import { z } from "zod";
import { supplyLineSchema } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow, type SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import type { WriteResult } from "@/features/floriday/sync/write-supply-page";

const PAGE_SIZE = 1000;

/**
 * Only the shape needed to drive the loop - individual records are validated one at a
 * time below, deliberately not as part of this schema, so one malformed record does not
 * take the rest of an otherwise-good page down with it.
 */
const rawPageSchema = z.object({
  maximumSequenceNumber: z.number().int(),
  results: z.array(z.unknown()),
});

/** Enough to recover a sequence number from a record that fails full validation. */
const sequenceNumberOnlySchema = z.object({ sequenceNumber: z.number().int() });

export interface SyncSupplyLinesOptions {
  client: { getJson<T>(path: string): Promise<T> };
  startCursor: bigint;
  writePage: (rows: SupplyLineRow[], observedAt: Date) => Promise<WriteResult>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  now: () => Date;
  /** Stops after this many pages. Used by the cron route to bound one run. */
  maxPages?: number;
  /** Overrides PAGE_SIZE. Exists for tests; production always uses the default. */
  pageSize?: number;
}

export interface SyncSupplyLinesResult {
  pagesProcessed: number;
  rowsProcessed: number;
  versionsAdded: number;
  duplicatesCollapsed: number;
  cursor: bigint;
  reachedEnd: boolean;
  warning?: string;
}

export async function syncSupplyLines(
  options: SyncSupplyLinesOptions,
): Promise<SyncSupplyLinesResult> {
  const { client, writePage, writeCursor, now, maxPages = Infinity, pageSize = PAGE_SIZE } =
    options;

  let cursor = options.startCursor;
  let pagesProcessed = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let duplicatesCollapsed = 0;
  let reachedEnd = false;
  let warning: string | undefined;

  while (pagesProcessed < maxPages) {
    const raw = await client.getJson<unknown>(
      `/auction/clock-presales-supply/sync/${cursor}?limit=${pageSize}`,
    );
    const page = rawPageSchema.parse(raw);
    const maximumSequenceNumber = BigInt(page.maximumSequenceNumber);
    const rawResults = page.results;

    if (rawResults.length === 0) {
      // Floriday's own docs warn that an empty page does not prove we are caught up:
      // results can be filtered on our connections while the maximum sequence number keeps
      // climbing. We currently see no such filtering on clock supply (35 zero-connection
      // suppliers), but that is an observation about today's behaviour, not a contract, so
      // this is reported rather than silently trusted.
      reachedEnd = true;
      if (cursor < maximumSequenceNumber) {
        warning =
          `Received an empty page at cursor ${cursor} while the maximum sequence number ` +
          `is ${maximumSequenceNumber}. Results may be filtered on our connections; an ` +
          `empty page does not by itself prove we are caught up.`;
      }
      break;
    }

    // Validate each record individually so a single malformed one does not abort the whole
    // page - seen in practice on the sibling organizations feed (see organizations.ts) with
    // records that failed strict validation only to be gone from the same query moments
    // later, apparently transient on Floriday's side. A multi-hour backfill over ~1.2M rows
    // cannot afford to be one bad row away from stopping dead. Records that fail full
    // validation are skipped and reported, not written; their sequence number is still
    // recovered where possible so the cursor advances past them instead of asking for the
    // same broken record forever.
    const rows: SupplyLineRow[] = [];
    const sequenceNumbers: bigint[] = [];
    let skipped = 0;

    for (const item of rawResults) {
      const parsed = supplyLineSchema.safeParse(item);
      if (parsed.success) {
        rows.push(toSupplyLineRow(parsed.data));
        sequenceNumbers.push(BigInt(parsed.data.sequenceNumber));
        continue;
      }

      skipped += 1;
      const sequenceOnly = sequenceNumberOnlySchema.safeParse(item);
      if (sequenceOnly.success) sequenceNumbers.push(BigInt(sequenceOnly.data.sequenceNumber));
    }

    if (sequenceNumbers.length === 0) {
      // Every record in the page failed to parse in any useful way, not even enough to
      // recover a sequence number. Same rationale as the non-advancing-cursor guard below:
      // stop rather than spin on a page we cannot make progress through.
      warning =
        `Every record in the page at cursor ${cursor} failed to parse (${skipped} of ` +
        `${rawResults.length}); investigate before the next run.`;
      break;
    }

    // Take the highest sequence number in the page rather than trusting that the last row
    // in the array is the highest. Floriday's sync semantics are defined by sequenceNumber
    // ordering, not array position, and this is equally cheap to compute either way.
    // Computed over every record Floriday returned, valid or not, so a persistently
    // malformed record does not get re-requested forever.
    let maxInPage = sequenceNumbers[0];
    for (const seq of sequenceNumbers) {
      if (seq > maxInPage) maxInPage = seq;
    }

    if (maxInPage <= cursor) {
      // The sync endpoint is queried with "sequenceNumber >= cursor", so the row at the
      // cursor itself is always eligible to come back. If that is the only row visible to us
      // (e.g. everything above it is filtered on our connections), the cursor would never
      // advance and this loop would repeat the identical request forever. Stop instead of
      // spinning - this is exactly the kind of "empty results lie" caveat Floriday warns
      // about, just manifesting as a non-empty page instead of an empty one.
      warning =
        `Cursor did not advance past ${cursor} despite a non-empty page (highest sequence ` +
        `number returned was ${maxInPage}). Stopping to avoid repeating the same request ` +
        `forever; investigate before the next run.`;
      break;
    }

    const written = await writePage(rows, now());
    cursor = maxInPage;
    await writeCursor(cursor);

    pagesProcessed += 1;
    rowsProcessed += written.rowsProcessed;
    versionsAdded += written.versionsAdded;
    duplicatesCollapsed += written.duplicatesCollapsed;

    if (skipped > 0) {
      warning =
        `Skipped ${skipped} malformed supply line record(s) out of ${rawResults.length} ` +
        `in the page at cursor ${cursor}; see logs for details.`;
      console.warn(warning);
    }

    // A page shorter than what we asked for means Floriday had no more matching rows to
    // fill it with - the standard end-of-data signal for this kind of limit/offset walk.
    // Checked against what Floriday returned (rawResults), not what we wrote (rows), so a
    // page that was actually full but had some records skipped is not mistaken for a short
    // one.
    //
    // maximumSequenceNumber is deliberately NOT used for this check. It reads like it
    // should be a stable bound for the whole feed ("you are up to date when your cursor
    // equals it" per Floriday's docs), but measured against the real API it is scoped to
    // the page just returned: querying the same cursor with a smaller limit returns a
    // smaller maximumSequenceNumber, and it always exactly equals the highest sequence
    // number in that response's own results. Comparing our post-page cursor (also the
    // page's own max) against it is therefore comparing a number to itself - true on
    // every full page regardless of how much more data remains beyond it, which is
    // exactly what a length check does not get wrong.
    if (rawResults.length < pageSize) {
      reachedEnd = true;
      break;
    }
  }

  return {
    pagesProcessed,
    rowsProcessed,
    versionsAdded,
    duplicatesCollapsed,
    cursor,
    reachedEnd,
    warning,
  };
}

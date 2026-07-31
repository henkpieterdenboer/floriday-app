import { z } from "zod";
import { organizationSchema } from "@/features/floriday/schemas/organization";
import { toOrganizationRow, type OrganizationRow } from "@/features/floriday/mappers/organization";
import type { WriteOrganizationsResult } from "@/features/floriday/sync/organizations-store";

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

export interface SyncOrganizationsOptions {
  client: { getJson<T>(path: string): Promise<T> };
  startCursor: bigint;
  writePage: (rows: OrganizationRow[]) => Promise<WriteOrganizationsResult>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  /** Stops after this many pages. Used by the cron route to bound one run. */
  maxPages?: number;
  /** Overrides PAGE_SIZE. Exists for tests; production always uses the default. */
  pageSize?: number;
}

export interface SyncOrganizationsResult {
  pagesProcessed: number;
  rowsProcessed: number;
  cursor: bigint;
  reachedEnd: boolean;
  warning?: string;
}

/**
 * Mirrors syncSupplyLines (sync/supply-lines.ts) deliberately: same pagination shape,
 * same failure modes guarded against.
 *
 * 1. An empty page does not by itself prove we are caught up - Floriday's docs warn
 *    results can be filtered while the maximum sequence number keeps climbing. We have no
 *    evidence organizations are filtered on our connections the way clock supply is (this
 *    is a plain directory listing, not a supply feed), but nothing confirms the opposite
 *    either, so the same defensive warning is kept rather than assumed away.
 * 2. The sync endpoint is queried with "sequenceNumber >= cursor", so the row at the
 *    cursor itself can always reappear. If it is the only row visible to us, the cursor
 *    would never advance and this loop would repeat the identical request forever without
 *    a guard that stops it.
 * 3. A single record can fail full validation while the rest of its page is fine - seen in
 *    practice against the real API: a handful of organizations with an organizationId that
 *    fails strict UUID validation, gone from the same query moments later (apparently a
 *    transient state on Floriday's side, not a permanent data problem on ours). One bad
 *    record must not abort an otherwise-good page of up to 1000, or a multi-hour backfill
 *    would be one bad row away from stopping dead every time. Records that fail full
 *    validation are skipped and reported, not written; their sequence number is still
 *    recovered where possible so the cursor advances past them instead of asking for the
 *    same broken record forever.
 */
export async function syncOrganizations(
  options: SyncOrganizationsOptions,
): Promise<SyncOrganizationsResult> {
  const { client, writePage, writeCursor, maxPages = Infinity, pageSize = PAGE_SIZE } = options;

  let cursor = options.startCursor;
  let pagesProcessed = 0;
  let rowsProcessed = 0;
  let reachedEnd = false;
  let warning: string | undefined;

  while (pagesProcessed < maxPages) {
    const raw = await client.getJson<unknown>(`/organizations/sync/${cursor}?limit=${pageSize}`);
    const page = rawPageSchema.parse(raw);
    const maximumSequenceNumber = BigInt(page.maximumSequenceNumber);
    const rawResults = page.results;

    if (rawResults.length === 0) {
      reachedEnd = true;
      if (cursor < maximumSequenceNumber) {
        warning =
          `Received an empty page at cursor ${cursor} while the maximum sequence number ` +
          `is ${maximumSequenceNumber}. An empty page does not by itself prove we are ` +
          `caught up; investigate before trusting this run finished.`;
      }
      break;
    }

    const rows: OrganizationRow[] = [];
    const sequenceNumbers: bigint[] = [];
    let skipped = 0;

    for (const item of rawResults) {
      const parsed = organizationSchema.safeParse(item);
      if (parsed.success) {
        rows.push(toOrganizationRow(parsed.data));
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

    // Highest sequence number actually present, not the last row in the array - Floriday's
    // sync semantics are ordered by sequenceNumber, not array position. Computed over every
    // record Floriday returned, valid or not, so a persistently malformed record does not
    // get re-requested forever.
    let maxInPage = sequenceNumbers[0];
    for (const seq of sequenceNumbers) {
      if (seq > maxInPage) maxInPage = seq;
    }

    if (maxInPage <= cursor) {
      warning =
        `Cursor did not advance past ${cursor} despite a non-empty page (highest sequence ` +
        `number returned was ${maxInPage}). Stopping to avoid repeating the same request ` +
        `forever; investigate before the next run.`;
      break;
    }

    const result = await writePage(rows);
    cursor = maxInPage;
    await writeCursor(cursor);

    pagesProcessed += 1;
    rowsProcessed += result.rowsProcessed;

    if (skipped > 0) {
      warning =
        `Skipped ${skipped} malformed organization record(s) out of ${rawResults.length} ` +
        `in the page at cursor ${cursor}; see logs for details.`;
      console.warn(warning);
    }

    // See syncSupplyLines for why this is a length check against what Floriday returned
    // (not what we wrote) and not a comparison against maximumSequenceNumber: measured
    // against the real API, that field is scoped to the page just returned (it shrinks if
    // you ask for a smaller limit), not a stable bound for the whole feed, so comparing our
    // post-page cursor - itself the page's own max - against it is true on every full page
    // regardless of how much data remains beyond it.
    if (rawResults.length < pageSize) {
      reachedEnd = true;
      break;
    }
  }

  return { pagesProcessed, rowsProcessed, cursor, reachedEnd, warning };
}

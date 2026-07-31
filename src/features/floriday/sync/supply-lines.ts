import { supplyPageSchema, type SupplyPage } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow, type SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import type { WriteResult } from "@/features/floriday/sync/write-supply-page";

const PAGE_SIZE = 1000;

export interface SyncSupplyLinesOptions {
  client: { getJson<T>(path: string): Promise<T> };
  startCursor: bigint;
  writePage: (rows: SupplyLineRow[], observedAt: Date) => Promise<WriteResult>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  now: () => Date;
  /** Stops after this many pages. Used by the cron route to bound one run. */
  maxPages?: number;
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
  const { client, writePage, writeCursor, now, maxPages = Infinity } = options;

  let cursor = options.startCursor;
  let pagesProcessed = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let duplicatesCollapsed = 0;
  let reachedEnd = false;
  let warning: string | undefined;

  while (pagesProcessed < maxPages) {
    const raw = await client.getJson<unknown>(
      `/auction/clock-presales-supply/sync/${cursor}?limit=${PAGE_SIZE}`,
    );
    const page: SupplyPage = supplyPageSchema.parse(raw);
    const maximumSequenceNumber = BigInt(page.maximumSequenceNumber);

    if (page.results.length === 0) {
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

    const rows = page.results.map(toSupplyLineRow);

    // Take the highest sequence number in the page rather than trusting that the last row
    // in the array is the highest. Floriday's sync semantics are defined by sequenceNumber
    // ordering, not array position, and this is equally cheap to compute either way.
    let maxInPage = rows[0].sequenceNumber;
    for (const row of rows) {
      if (row.sequenceNumber > maxInPage) maxInPage = row.sequenceNumber;
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

    if (cursor >= maximumSequenceNumber) {
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

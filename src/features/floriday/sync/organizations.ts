import { organizationPageSchema, type OrganizationPage } from "@/features/floriday/schemas/organization";
import { toOrganizationRow, type OrganizationRow } from "@/features/floriday/mappers/organization";
import type { WriteOrganizationsResult } from "@/features/floriday/sync/organizations-store";

const PAGE_SIZE = 1000;

export interface SyncOrganizationsOptions {
  client: { getJson<T>(path: string): Promise<T> };
  startCursor: bigint;
  writePage: (rows: OrganizationRow[]) => Promise<WriteOrganizationsResult>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  /** Stops after this many pages. Used by the cron route to bound one run. */
  maxPages?: number;
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
 * same two failure modes guarded against.
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
 */
export async function syncOrganizations(
  options: SyncOrganizationsOptions,
): Promise<SyncOrganizationsResult> {
  const { client, writePage, writeCursor, maxPages = Infinity } = options;

  let cursor = options.startCursor;
  let pagesProcessed = 0;
  let rowsProcessed = 0;
  let reachedEnd = false;
  let warning: string | undefined;

  while (pagesProcessed < maxPages) {
    const raw = await client.getJson<unknown>(`/organizations/sync/${cursor}?limit=${PAGE_SIZE}`);
    const page: OrganizationPage = organizationPageSchema.parse(raw);
    const maximumSequenceNumber = BigInt(page.maximumSequenceNumber);

    if (page.results.length === 0) {
      reachedEnd = true;
      if (cursor < maximumSequenceNumber) {
        warning =
          `Received an empty page at cursor ${cursor} while the maximum sequence number ` +
          `is ${maximumSequenceNumber}. An empty page does not by itself prove we are ` +
          `caught up; investigate before trusting this run finished.`;
      }
      break;
    }

    const rows = page.results.map(toOrganizationRow);

    // Highest sequence number actually present, not the last row in the array - Floriday's
    // sync semantics are ordered by sequenceNumber, not array position.
    let maxInPage = rows[0].sequenceNumber;
    for (const row of rows) {
      if (row.sequenceNumber > maxInPage) maxInPage = row.sequenceNumber;
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

    if (cursor >= maximumSequenceNumber) {
      reachedEnd = true;
      break;
    }
  }

  return { pagesProcessed, rowsProcessed, cursor, reachedEnd, warning };
}

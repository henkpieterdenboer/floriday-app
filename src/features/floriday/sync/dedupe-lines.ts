import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

/**
 * Collapses duplicate `supplyLineId` entries within a single page down to one row per id,
 * keeping the entry with the highest sequenceNumber - the most recent state.
 *
 * Floriday's sync endpoint returns current state, so a page is expected to contain each id
 * at most once, but that is an assumption about their internals, not a documented contract.
 * Without this guard, a duplicate would reach the bulk `INSERT ... ON CONFLICT DO UPDATE` in
 * write-supply-page.ts, which Postgres rejects with "ON CONFLICT DO UPDATE command cannot
 * affect row a second time" - aborting an in-progress backfill outright, potentially deep
 * into a 1200-page run.
 */
export function dedupeSupplyLines(rows: readonly SupplyLineRow[]): SupplyLineRow[] {
  const byId = new Map<string, SupplyLineRow>();

  for (const row of rows) {
    const current = byId.get(row.supplyLineId);
    if (!current || row.sequenceNumber > current.sequenceNumber) {
      byId.set(row.supplyLineId, row);
    }
  }

  return Array.from(byId.values());
}

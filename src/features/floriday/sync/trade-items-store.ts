import { prisma } from "@/lib/db";
import { toTradeItemRow } from "@/features/floriday/mappers/trade-item";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

/**
 * Which of the given ids are already stored.
 *
 * On the first backfill this can be called with every distinct tradeItemId ever seen
 * across the whole supply archive - tens of thousands of ids at once. Measured directly
 * against Neon on this Prisma version (6.19.3): a single `findMany({ where: { in } })`
 * with 200,000 ids completes in well under 4 seconds and does not error, so there is no
 * parameter-limit or timeout cliff to guard against at the scale this table will ever
 * reach (roughly one trade item per sixteen supply lines). No batching added here.
 */
export async function findKnownTradeItemIds(ids: readonly string[]): Promise<Set<string>> {
  const rows = await prisma.tradeItem.findMany({
    where: { tradeItemId: { in: [...ids] } },
    select: { tradeItemId: true },
  });
  return new Set(rows.map((row) => row.tradeItemId));
}

/**
 * Every tradeItemId referenced by a stored supply line for which no trade item exists.
 *
 * This asks the database what is missing rather than remembering what a run touched.
 * That distinction matters: a backfill can be interrupted, and the ids a run collected in
 * memory die with it, leaving supply lines permanently pointing at names nobody ever
 * fetched. Derived from the stored data instead, the gap is always visible and always
 * closable, whatever happened during earlier runs.
 */
export async function findSupplyLinesWithoutTradeItem(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ tradeItemId: string }[]>`
    SELECT DISTINCT sl."tradeItemId"
    FROM "SupplyLine" sl
    LEFT JOIN "TradeItem" ti ON ti."tradeItemId" = sl."tradeItemId"
    WHERE ti."tradeItemId" IS NULL
  `;
  return rows.map((row) => row.tradeItemId);
}

/**
 * Inserts newly-fetched trade items. Uses createMany + skipDuplicates rather than an
 * upsert: fetchMissingTradeItems (the only caller) already filters ids down to ones
 * findKnownIds reported as absent, so a conflict here means two calls raced on the same
 * missing id, not that a stored trade item has gone stale. Either version fetched in that
 * race is an acceptable value to keep, so skipping the loser is simpler and no less
 * correct than an upsert would be. Refreshing existing trade items (e.g. picking up a
 * name change) is a different, currently unbuilt job.
 */
export async function saveTradeItems(
  items: TradeItemPayload[],
  fetchedAt: Date,
): Promise<void> {
  await prisma.tradeItem.createMany({
    data: items.map((item) => toTradeItemRow(item, fetchedAt)),
    skipDuplicates: true,
  });
}

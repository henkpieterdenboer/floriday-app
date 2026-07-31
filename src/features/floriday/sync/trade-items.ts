import { tradeItemSchema, type TradeItemPayload } from "@/features/floriday/schemas/trade-item";

/** 100 ids produce a URL of about 3.8 kB, well within the usual 8 kB limit. */
const BATCH_SIZE = 100;

export function chunkIds(ids: readonly string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export interface FetchMissingTradeItemsOptions {
  client: { getJson<T>(path: string): Promise<T> };
  tradeItemIds: readonly string[];
  findKnownIds: (ids: readonly string[]) => Promise<Set<string>>;
  saveTradeItems: (items: TradeItemPayload[], fetchedAt: Date) => Promise<void>;
  now: () => Date;
}

/**
 * Trade items have no sync endpoint for us: /trade-items/sync returns 403 without
 * connected suppliers. Fetching by id does work, so we top up the lookup table with
 * whatever the supply pages referenced but we do not have yet.
 *
 * Only ids that findKnownIds does not already report are ever requested or saved, so
 * saveTradeItems never sees an id it already has in the normal path - the only way that
 * could happen is two overlapping calls racing on the same missing id, which is why
 * saveTradeItems is free to use skipDuplicates rather than upsert (see trade-items-store.ts).
 */
export async function fetchMissingTradeItems(
  options: FetchMissingTradeItemsOptions,
): Promise<number> {
  const { client, tradeItemIds, findKnownIds, saveTradeItems, now } = options;

  const unique = [...new Set(tradeItemIds)];
  if (unique.length === 0) return 0;

  const known = await findKnownIds(unique);
  const missing = unique.filter((id) => !known.has(id));
  if (missing.length === 0) return 0;

  let added = 0;

  for (const batch of chunkIds(missing, BATCH_SIZE)) {
    const raw = await client.getJson<unknown>(`/trade-items?tradeItemIds=${batch.join(",")}`);
    const items = tradeItemSchema.array().parse(raw);
    if (items.length > 0) {
      await saveTradeItems(items, now());
      added += items.length;
    }
  }

  return added;
}

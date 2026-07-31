import { describe, expect, it, vi } from "vitest";
import { chunkIds, fetchMissingTradeItems } from "@/features/floriday/sync/trade-items";

describe("chunkIds", () => {
  it("splits into blocks of the given size", () => {
    expect(chunkIds(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("returns nothing for an empty list", () => {
    expect(chunkIds([], 100)).toEqual([]);
  });
});

describe("fetchMissingTradeItems", () => {
  const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  const item = (id: string) => ({
    tradeItemId: id,
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    name: "CYMB T GEM.",
    vbnProductCode: "973",
    code: null,
    gtin: null,
    botanicalNames: [],
    countryOfOriginIsoCodes: [],
    tradeItemVersion: 1,
    isDeleted: false,
    sequenceNumber: 1,
    characteristics: null,
    photos: null,
    packingConfigurations: null,
    sellerOrganizationId: "33333333-3333-4333-8333-333333333333",
    seasonalPeriods: [],
    isCustomerSpecific: false,
    isHiddenInCatalog: false,
    hasInvalidFloricodeData: false,
    creationDateTime: "2026-01-01T00:00:00Z",
    lastModifiedDateTime: null,
    parentId: null,
    additionalPackagingInformationFloricodeVrsPackagingIds: null,
  });

  it("asks only for ids that are not stored yet", async () => {
    const getJson = vi.fn().mockResolvedValue([item(idB)]);
    const findKnownIds = vi.fn().mockResolvedValue(new Set([idA]));
    const saveTradeItems = vi.fn();

    const added = await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA, idB],
      findKnownIds,
      saveTradeItems,
      now: () => new Date(),
    });

    expect(getJson.mock.calls[0][0]).toContain(idB);
    expect(getJson.mock.calls[0][0]).not.toContain(idA);
    expect(added).toBe(1);
  });

  it("makes no request when everything is already known", async () => {
    const getJson = vi.fn();
    const added = await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA],
      findKnownIds: async () => new Set([idA]),
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson).not.toHaveBeenCalled();
    expect(added).toBe(0);
  });

  it("makes no request for an empty id list", async () => {
    const getJson = vi.fn();
    const findKnownIds = vi.fn();
    const added = await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [],
      findKnownIds,
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson).not.toHaveBeenCalled();
    expect(findKnownIds).not.toHaveBeenCalled();
    expect(added).toBe(0);
  });

  it("deduplicates ids before asking", async () => {
    const getJson = vi.fn().mockResolvedValue([item(idA)]);
    const findKnownIds = vi.fn().mockResolvedValue(new Set());

    await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA, idA, idA],
      findKnownIds,
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(findKnownIds).toHaveBeenCalledWith([idA]);
    expect(getJson).toHaveBeenCalledTimes(1);
  });

  it("splits large requests into blocks of a hundred", async () => {
    const ids = Array.from({ length: 250 }, (_, i) =>
      `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`);
    const getJson = vi.fn().mockResolvedValue([]);

    await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: ids,
      findKnownIds: async () => new Set(),
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson).toHaveBeenCalledTimes(3);
  });

  it("passes ids comma separated, because that is what the api accepts", async () => {
    const getJson = vi.fn().mockResolvedValue([]);
    await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA, idB],
      findKnownIds: async () => new Set(),
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson.mock.calls[0][0]).toBe(`/trade-items?tradeItemIds=${idA},${idB}`);
  });
});

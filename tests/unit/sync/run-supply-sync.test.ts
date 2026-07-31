import { describe, expect, it, vi } from "vitest";
import { runSupplySyncWith, type RunSupplySyncDeps } from "@/features/floriday/sync/run-supply-sync";
import type { SupplyPage } from "@/features/floriday/schemas/supply-line";

const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const idC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function line(sequenceNumber: number, tradeItemId: string) {
  return {
    supplyLineId: `00000000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    status: "AVAILABLE" as const,
    tradeItemId,
    tradeItemVersion: null,
    pricePerPiece: { currency: "EUR", value: 0.42 },
    deliveryNoteReference: null,
    deliveryNoteCode: null,
    deliveryNoteLetter: null,
    numberOfPieces: 100,
    packingConfiguration: {
      piecesPerPackage: 1,
      package: { vbnPackageCode: 800, customPackageId: null },
      packagesPerLayer: 0,
      layersPerLoadCarrier: 4,
      loadCarrier: "AUCTION_TROLLEY",
    },
    tradePeriod: {
      startDateTime: "2026-07-30T07:00:00Z",
      endDateTime: "2026-07-31T03:55:00Z",
    },
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    sequenceNumber,
    creationDateTime: "2026-07-30T07:03:30Z",
    lastModifiedDateTime: null,
    auctionDate: "2026-07-31",
    initialAuctionLocation: "AALSMEER" as const,
    photoUrl: null,
  };
}

function supplyPage(rows: Array<[number, string]>, maximumSequenceNumber: number): SupplyPage {
  return { maximumSequenceNumber, results: rows.map(([seq, tradeItemId]) => line(seq, tradeItemId)) };
}

function tradeItem(id: string) {
  return {
    tradeItemId: id,
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    sellerOrganizationId: "33333333-3333-4333-8333-333333333333",
    name: "CYMB T GEM.",
    vbnProductCode: "973",
    code: null,
    gtin: null,
    botanicalNames: [],
    countryOfOriginIsoCodes: [],
    tradeItemVersion: 1,
    isDeleted: false,
    isCustomerSpecific: false,
    isHiddenInCatalog: false,
    hasInvalidFloricodeData: false,
    sequenceNumber: 1,
    creationDateTime: "2026-01-01T00:00:00Z",
    lastModifiedDateTime: null,
    parentId: null,
    characteristics: null,
    seasonalPeriods: [],
    photos: null,
    packingConfigurations: null,
    additionalPackagingInformationFloricodeVrsPackagingIds: null,
  };
}

/** Builds fakes for every RunSupplySyncDeps field, overridable per test. */
function fakeDeps(overrides: Partial<RunSupplySyncDeps> = {}): RunSupplySyncDeps {
  return {
    client: { getJson: vi.fn() },
    readCursor: vi.fn().mockResolvedValue(0n),
    writeCursor: vi.fn(),
    writeSupplyPage: vi.fn().mockResolvedValue({ rowsProcessed: 1, versionsAdded: 1, duplicatesCollapsed: 0 }),
    startRun: vi.fn().mockResolvedValue(1n),
    finishRun: vi.fn(),
    findKnownTradeItemIds: vi.fn().mockResolvedValue(new Set()),
    saveTradeItems: vi.fn(),
    now: () => new Date("2026-07-31T10:00:00Z"),
    ...overrides,
  };
}

describe("runSupplySyncWith", () => {
  it("tops up trade items collected from the written pages, deduplicated, minus already-known ids", async () => {
    // pageSize 3: page 1 is full (3 results) so the walk continues to page 2; page 2 is
    // short (1 result) so the walk stops there and moves on to the trade-item top-up.
    const getJson = vi.fn()
      .mockResolvedValueOnce(supplyPage([[1, idA], [2, idB], [3, idC]], 999))
      .mockResolvedValueOnce(supplyPage([[4, idA]], 999))
      // Response for the trade-items lookup.
      .mockResolvedValueOnce([tradeItem(idB), tradeItem(idC)]);

    const findKnownTradeItemIds = vi.fn().mockResolvedValue(new Set([idA]));
    const saveTradeItems = vi.fn();

    const deps = fakeDeps({
      client: { getJson },
      findKnownTradeItemIds,
      saveTradeItems,
    });

    const result = await runSupplySyncWith({ trigger: "MANUAL", pageSize: 3 }, deps);

    // idA appeared twice across two pages but is already known - asked about once, not fetched.
    expect(findKnownTradeItemIds).toHaveBeenCalledTimes(1);
    const askedIds = new Set(findKnownTradeItemIds.mock.calls[0][0] as string[]);
    expect(askedIds).toEqual(new Set([idA, idB, idC]));

    expect(getJson.mock.calls[2][0]).toContain("/trade-items?");
    expect(saveTradeItems).toHaveBeenCalledTimes(1);
    expect(result.tradeItemsAdded).toBe(2);
  });

  it("does not query trade items at all when no pages were written", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(supplyPage([], 0));
    const findKnownTradeItemIds = vi.fn();

    const deps = fakeDeps({ client: { getJson }, findKnownTradeItemIds });
    const result = await runSupplySyncWith({ trigger: "CRON" }, deps);

    expect(findKnownTradeItemIds).not.toHaveBeenCalled();
    expect(result.tradeItemsAdded).toBe(0);
  });

  it("records a successful run with the warning kept separate from errorMessage", async () => {
    // An empty page below the maximum sequence number produces a warning without the sync
    // throwing - the run still succeeded, it just noted something worth checking.
    const getJson = vi.fn().mockResolvedValueOnce(supplyPage([], 999));
    const finishRun = vi.fn();

    const deps = fakeDeps({ client: { getJson }, finishRun });
    await runSupplySyncWith({ trigger: "CRON" }, deps);

    expect(finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({
      status: "SUCCEEDED",
      warning: expect.stringMatching(/empty page/i),
    }));
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.errorMessage).toBeUndefined();
  });

  it("records a run with no warning as clean", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(supplyPage([[1, idA]], 1));
    const finishRun = vi.fn();
    // Already known, so the trade item top-up makes no request - keeps this test focused
    // on the warning/errorMessage split, not the top-up behaviour covered elsewhere.
    const findKnownTradeItemIds = vi.fn().mockResolvedValue(new Set([idA]));

    const deps = fakeDeps({ client: { getJson }, finishRun, findKnownTradeItemIds });
    await runSupplySyncWith({ trigger: "CRON" }, deps);

    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.warning).toBeUndefined();
  });

  it("on failure, tops up trade items for pages already written, records FAILED, and rethrows", async () => {
    // pageSize 1: page 1 (1 result) is full, so the walk goes on to fetch page 2, which
    // is where the failure actually comes from.
    const getJson = vi.fn()
      .mockResolvedValueOnce(supplyPage([[1, idA]], 100))
      .mockRejectedValueOnce(new Error("network down"))
      // Response for the best-effort trade-items lookup in the catch block.
      .mockResolvedValueOnce([tradeItem(idA)]);

    const findKnownTradeItemIds = vi.fn().mockResolvedValue(new Set());
    const saveTradeItems = vi.fn();
    const finishRun = vi.fn();

    const deps = fakeDeps({ client: { getJson }, findKnownTradeItemIds, saveTradeItems, finishRun });

    await expect(
      runSupplySyncWith({ trigger: "CRON", pageSize: 1 }, deps),
    ).rejects.toThrow("network down");

    expect(findKnownTradeItemIds).toHaveBeenCalledWith([idA]);
    expect(saveTradeItems).toHaveBeenCalledTimes(1);
    expect(finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({
      status: "FAILED",
      errorMessage: "network down",
    }));
  });

  it("rethrows the original sync error even when the best-effort trade item top-up also fails", async () => {
    // pageSize 1: page 1 (1 result) is full, so the walk goes on to fetch page 2, which
    // rejects - the failure needs to come from the sync itself, not incidentally from the
    // trade-item top-up call sharing the same mocked client.
    const getJson = vi.fn()
      .mockResolvedValueOnce(supplyPage([[1, idA]], 100))
      .mockRejectedValueOnce(new Error("network down"));

    const findKnownTradeItemIds = vi.fn().mockRejectedValue(new Error("db also down"));
    const deps = fakeDeps({ client: { getJson }, findKnownTradeItemIds });

    await expect(
      runSupplySyncWith({ trigger: "CRON", pageSize: 1 }, deps),
    ).rejects.toThrow("network down");
  });

  it("rethrows the original sync error even when finishRun itself fails", async () => {
    const getJson = vi.fn().mockRejectedValueOnce(new Error("network down"));
    const finishRun = vi.fn().mockRejectedValue(new Error("db down"));

    const deps = fakeDeps({ client: { getJson }, finishRun });

    await expect(runSupplySyncWith({ trigger: "CRON" }, deps)).rejects.toThrow("network down");
  });

  it("starts the run with the given trigger and reads the cursor before syncing", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(supplyPage([], 0));
    const startRun = vi.fn().mockResolvedValue(42n);
    const readCursor = vi.fn().mockResolvedValue(7n);

    const deps = fakeDeps({ client: { getJson }, startRun, readCursor });
    await runSupplySyncWith({ trigger: "BACKFILL" }, deps);

    expect(startRun).toHaveBeenCalledWith("BACKFILL");
    expect(readCursor).toHaveBeenCalled();
    expect(getJson.mock.calls[0][0]).toContain("/sync/7?");
  });

  it("passes maxPages through to the underlying sync", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(supplyPage([[1, idA]], 100))
      .mockResolvedValueOnce(supplyPage([[2, idA]], 100));
    const findKnownTradeItemIds = vi.fn().mockResolvedValue(new Set([idA]));

    const deps = fakeDeps({ client: { getJson }, findKnownTradeItemIds });
    const result = await runSupplySyncWith(
      { trigger: "CRON", maxPages: 1, pageSize: 1 },
      deps,
    );

    expect(result.pagesProcessed).toBe(1);
    expect(result.reachedEnd).toBe(false);
  });
});

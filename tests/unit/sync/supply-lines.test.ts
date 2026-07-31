import { describe, expect, it, vi } from "vitest";
import { syncSupplyLines } from "@/features/floriday/sync/supply-lines";
import type { SupplyPage } from "@/features/floriday/schemas/supply-line";

function line(sequenceNumber: number) {
  return {
    supplyLineId: `00000000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    status: "AVAILABLE" as const,
    tradeItemId: "22222222-2222-4222-8222-222222222222",
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

function page(sequences: number[], maximumSequenceNumber: number): SupplyPage {
  return { maximumSequenceNumber, results: sequences.map(line) };
}

const written = () => ({ rowsProcessed: 2, versionsAdded: 2, duplicatesCollapsed: 0 });

describe("syncSupplyLines", () => {
  it("walks pages until the cursor reaches the maximum", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1, 2], 4))
      .mockResolvedValueOnce(page([3, 4], 4));
    const writePage = vi.fn().mockResolvedValue(written());
    const writeCursor = vi.fn();

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor,
      now: () => new Date("2026-07-31T10:00:00Z"),
    });

    expect(getJson).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
    expect(result.rowsProcessed).toBe(4);
    expect(result.reachedEnd).toBe(true);
    expect(writeCursor).toHaveBeenLastCalledWith(4n);
  });

  it("resumes from the given cursor", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([11], 11));
    await syncSupplyLines({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn().mockResolvedValue(written()),
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson.mock.calls[0][0]).toContain("/sync/10?");
  });

  it("stops on an empty page and reports it when below the maximum", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([], 999));

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(result.pagesProcessed).toBe(0);
    expect(result.warning).toMatch(/empty page/i);
  });

  it("does not warn on an empty page once the maximum is reached", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([], 10));

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(result.warning).toBeUndefined();
    expect(result.reachedEnd).toBe(true);
  });

  it("writes the page before advancing the cursor", async () => {
    const order: string[] = [];
    await syncSupplyLines({
      client: { getJson: vi.fn().mockResolvedValueOnce(page([1], 1)) },
      startCursor: 0n,
      writePage: vi.fn(async () => {
        order.push("write");
        return written();
      }),
      writeCursor: vi.fn(async () => { order.push("cursor"); }),
      now: () => new Date(),
    });

    expect(order).toEqual(["write", "cursor"]);
  });

  it("honours the page limit and reports it did not finish", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1], 100))
      .mockResolvedValueOnce(page([2], 100));

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn().mockResolvedValue(written()),
      writeCursor: vi.fn(),
      now: () => new Date(),
      maxPages: 2,
    });

    expect(result.pagesProcessed).toBe(2);
    expect(result.reachedEnd).toBe(false);
  });

  it("accumulates the totals reported by the writer", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1, 2], 4))
      .mockResolvedValueOnce(page([3, 4], 4));
    const writePage = vi.fn()
      .mockResolvedValueOnce({ rowsProcessed: 2, versionsAdded: 2, duplicatesCollapsed: 0 })
      .mockResolvedValueOnce({ rowsProcessed: 2, versionsAdded: 1, duplicatesCollapsed: 3 });

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(result.rowsProcessed).toBe(4);
    expect(result.versionsAdded).toBe(3);
    expect(result.duplicatesCollapsed).toBe(3);
  });

  it("rejects a response that does not match the schema", async () => {
    const getJson = vi.fn().mockResolvedValueOnce({ results: [{ nonsense: true }] });

    await expect(syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
      now: () => new Date(),
    })).rejects.toThrow();
  });
});

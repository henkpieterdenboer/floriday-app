import { describe, expect, it } from "vitest";
import { dedupeSupplyLines } from "@/features/floriday/sync/dedupe-lines";
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

function row(overrides: Partial<SupplyLineRow> = {}): SupplyLineRow {
  return {
    supplyLineId: "11111111-1111-1111-1111-111111111111",
    status: "AVAILABLE",
    tradeItemId: "22222222-2222-2222-2222-222222222222",
    tradeItemVersion: 1,
    pricePerPiece: "0.4200",
    currency: "EUR",
    numberOfPieces: 400,
    deliveryNoteReference: "50738A",
    deliveryNoteCode: "50738",
    deliveryNoteLetter: "A",
    piecesPerPackage: 1,
    vbnPackageCode: 800,
    customPackageId: null,
    packagesPerLayer: 0,
    layersPerLoadCarrier: 4,
    loadCarrier: "AUCTION_TROLLEY",
    tradePeriodStart: new Date("2026-07-30T07:00:00.000Z"),
    tradePeriodEnd: new Date("2026-07-31T03:55:00.000Z"),
    supplierOrganizationId: "33333333-3333-3333-3333-333333333333",
    sequenceNumber: 100n,
    creationDateTime: new Date("2026-07-30T07:03:30.000Z"),
    lastModifiedDateTime: null,
    auctionDate: new Date("2026-07-31T00:00:00.000Z"),
    initialAuctionLocation: "AALSMEER",
    photoUrl: null,
    ...overrides,
  };
}

describe("dedupeSupplyLines", () => {
  it("leaves a page with no duplicates unchanged", () => {
    const a = row({ supplyLineId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    const b = row({ supplyLineId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    expect(dedupeSupplyLines([a, b])).toEqual([a, b]);
  });

  it("keeps the entry with the higher sequence number when an id repeats", () => {
    const lower = row({ sequenceNumber: 100n, numberOfPieces: 400 });
    const higher = row({ sequenceNumber: 101n, numberOfPieces: 360 });

    expect(dedupeSupplyLines([lower, higher])).toEqual([higher]);
    expect(dedupeSupplyLines([higher, lower])).toEqual([higher]);
  });

  it("collapses more than two duplicates of the same id to the single highest one", () => {
    const one = row({ sequenceNumber: 1n });
    const two = row({ sequenceNumber: 2n });
    const three = row({ sequenceNumber: 3n });

    expect(dedupeSupplyLines([two, one, three])).toEqual([three]);
  });

  it("returns an empty array for an empty page", () => {
    expect(dedupeSupplyLines([])).toEqual([]);
  });

  it("dedupes only within a matching id, leaving other lines untouched", () => {
    const a1 = row({ supplyLineId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", sequenceNumber: 1n });
    const a2 = row({ supplyLineId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", sequenceNumber: 2n });
    const b = row({ supplyLineId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", sequenceNumber: 1n });

    const result = dedupeSupplyLines([a1, b, a2]);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(a2);
    expect(result).toContainEqual(b);
  });
});

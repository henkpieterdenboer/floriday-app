import { describe, expect, it } from "vitest";
import { selectChangedLines } from "@/features/floriday/sync/changed-lines";
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

describe("selectChangedLines", () => {
  it("returns a line that has never been seen before", () => {
    const incoming = [row()];
    expect(selectChangedLines(incoming, new Map())).toEqual(incoming);
  });

  it("skips a line that is identical apart from its sequence number", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });

  it("returns a line whose piece count dropped", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ numberOfPieces: 280, sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line whose price changed", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ pricePerPiece: "0.4500", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line whose status flipped", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ status: "UNAVAILABLE", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line that moved to another auction location", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ initialAuctionLocation: "NAALDWIJK", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("treats a change from null to a value as a change", () => {
    const existing = new Map([[row().supplyLineId, row({ deliveryNoteLetter: null })]]);
    const incoming = [row({ deliveryNoteLetter: "B", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("does not treat two nulls as a change", () => {
    const existing = new Map([[row().supplyLineId, row({ photoUrl: null })]]);
    const incoming = [row({ photoUrl: null, sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });

  it("compares dates by value, not by object identity", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({
      tradePeriodEnd: new Date("2026-07-31T03:55:00.000Z"),
      sequenceNumber: 999n,
    })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });

  it("returns only the changed lines from a mixed batch", () => {
    const a = row({ supplyLineId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    const b = row({ supplyLineId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    const existing = new Map([[a.supplyLineId, a], [b.supplyLineId, b]]);

    const incoming = [
      { ...a, sequenceNumber: 999n },
      { ...b, numberOfPieces: 1, sequenceNumber: 999n },
    ];

    const changed = selectChangedLines(incoming, existing);
    expect(changed).toHaveLength(1);
    expect(changed[0].supplyLineId).toBe(b.supplyLineId);
  });
});

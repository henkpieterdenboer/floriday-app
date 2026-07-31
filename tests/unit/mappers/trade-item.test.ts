import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { toTradeItemRow } from "@/features/floriday/mappers/trade-item";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

function payload(overrides: Partial<TradeItemPayload> = {}): TradeItemPayload {
  return {
    tradeItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    sellerOrganizationId: "33333333-3333-4333-8333-333333333333",
    name: "CYMB T GEM.",
    vbnProductCode: "973",
    code: null,
    gtin: null,
    botanicalNames: null,
    countryOfOriginIsoCodes: null,
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
    ...overrides,
  };
}

describe("toTradeItemRow", () => {
  // Verified against a real Neon database: assigning plain JS `null` to a Json? column
  // through createMany/create does NOT produce SQL NULL. It stores the jsonb literal
  // `null` instead (jsonb_typeof = 'null', "... IS NULL" is false). Since these columns
  // are genuinely absent for most trade items, they must land as true SQL NULL, which
  // requires Prisma.DbNull rather than the JS value null.
  it("uses Prisma.DbNull, not plain null, for absent json columns", () => {
    const row = toTradeItemRow(payload(), new Date("2026-07-31T10:00:00Z"));

    expect(row.characteristics).toBe(Prisma.DbNull);
    expect(row.photos).toBe(Prisma.DbNull);
    expect(row.packingConfigurations).toBe(Prisma.DbNull);
  });

  it("passes through actual json content unchanged", () => {
    const characteristics = [{ vbnCode: "1", vbnValueCode: "2" }];
    const row = toTradeItemRow(payload({ characteristics }), new Date());

    expect(row.characteristics).toEqual(characteristics);
  });

  it("converts the sequence number to bigint", () => {
    const row = toTradeItemRow(payload({ sequenceNumber: 42 }), new Date());
    expect(row.sequenceNumber).toBe(42n);
  });

  it("defaults nullable array fields to empty arrays, matching the non-null db columns", () => {
    const row = toTradeItemRow(
      payload({ botanicalNames: null, countryOfOriginIsoCodes: null }),
      new Date(),
    );
    expect(row.botanicalNames).toEqual([]);
    expect(row.countryOfOriginIsoCodes).toEqual([]);
  });

  it("stamps fetchedAt with the given time", () => {
    const now = new Date("2026-07-31T10:00:00Z");
    expect(toTradeItemRow(payload(), now).fetchedAt).toBe(now);
  });
});

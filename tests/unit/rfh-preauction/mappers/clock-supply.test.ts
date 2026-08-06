import { describe, expect, it } from "vitest";
import { clockSupplyPageSchema } from "@/features/rfh-preauction/schemas/clock-supply";
import { toClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

const PAYLOAD = {
  id: "0ec256ce-8fcc-442b-9039-9aeaf00a9b1f",
  reference: "9100183551655",
  organization: {
    id: "4cedfae1-b599-378d-a9ca-7fe0edfa81d1",
    name: "Raadschelders Varens",
    relationNumber: "73100",
    logoUrl: "https://image.floriday.io/44d43f9d.jpg",
    certificates: ["MPS A", "MPS GAP"],
  },
  photoUrl: "https://image.floriday.io/foto.jpg",
  productCode: "105127",
  vbnProductName: "NEPHROLEPIS",
  productName: "Nephrolepis",
  name: "NEPHRO EX BOSTONIENSIS",
  characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }],
  positiveCharacteristics: [],
  negativeCharacteristics: [],
  qualityCode: "A1",
  numberOfPackages: 3,
  currentNumberOfPieces: 36,
  packageTypeCode: "577",
  packageTypeName: "Deense kar",
  piecesPerPackage: 12,
  layersPerLoadcarrier: 4,
  packagesPerLayer: 3,
  loadCarrierCode: "DC",
  clockPresalesSupplyLineId: "c207aee2-07b6-442b-b172-22d9f3592c2e",
  preSaleInitialNumberOfPieces: 24,
  preSaleCurrentNumberOfPieces: 24,
  preSalePriceCurrency: "EUR",
  preSalePriceValue: 2,
  isFromSyntheticRequest: false,
  clockShortName: "N4",
  digitalAuctionSupplyType: null,
  topLevelMainColor: "groen",
  rgbMainColor: "#3a7d2c",
  auctionLocation: "Naaldwijk",
  auctioningSequence: 120,
  mainGroupCode: "1",
  lastCommercialMutationMoment: "2026-08-06T14:22:11.000Z",
  qualityIndexClassification: "A",
  numberOfLoadCarriers: 1,
  numberOfPackagesPerLoadCarrier: 12,
  deliveryFormBarcode: "F2DDPWA",
  sequenceOnLoadCarrier: 2,
  isAuctioned: false,
  productGroupName: "Varens",
  potSizeInCm: 12,
  plantHeightInCm: 40,
};

describe("clockSupplyPageSchema", () => {
  it("accepts a measured response", () => {
    const parsed = clockSupplyPageSchema.parse({
      results: [PAYLOAD],
      totalDocuments: 1,
      markings: [],
      filterItems: [],
    });
    expect(parsed.results).toHaveLength(1);
  });

  it("rejects a record without an id", () => {
    const zonderId = { ...PAYLOAD, id: undefined };
    expect(() =>
      clockSupplyPageSchema.parse({ results: [zonderId], totalDocuments: 1 }),
    ).toThrow();
  });
});

describe("toClockSupplyLineRow", () => {
  it("maps the payload onto the stored shape", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({ results: [PAYLOAD], totalDocuments: 1 }).results[0],
      "20260807",
    );

    expect(row.clockSupplyLineId).toBe("0ec256ce-8fcc-442b-9039-9aeaf00a9b1f");
    expect(row.auctionDate.toISOString()).toBe("2026-08-07T00:00:00.000Z");
    expect(row.clockPresalesSupplyLineId).toBe("c207aee2-07b6-442b-b172-22d9f3592c2e");
    expect(row.supplierOrganizationId).toBe("4cedfae1-b599-378d-a9ca-7fe0edfa81d1");
    expect(row.supplierName).toBe("Raadschelders Varens");
    expect(row.supplierCertificates).toEqual(["MPS A", "MPS GAP"]);
    expect(row.currentNumberOfPieces).toBe(36);
    expect(row.preSaleInitialNumberOfPieces).toBe(24);
    expect(row.preSalePriceValue).toBe("2.0000");
    expect(row.auctionLocation).toBe("Naaldwijk");
    expect(row.lastCommercialMutationMoment?.toISOString()).toBe("2026-08-06T14:22:11.000Z");
    expect(row.isSynthetic).toBe(false);
  });

  it("marks a staging record as synthetic from its reference", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, reference: "synth_174627#" }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.isSynthetic).toBe(true);
  });

  it("keeps a missing presale link as null", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, clockPresalesSupplyLineId: null }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.clockPresalesSupplyLineId).toBeNull();
  });

  // productCode, organization.relationNumber, packageTypeCode and mainGroupCode are typed
  // z.union([z.string(), z.number()]) precisely because RFH has been observed to send
  // numbers for them. Every fixture above uses strings, so without this test the tekst()
  // helper and the String(...) call on mainGroupCode never actually run their number branch.
  it("coerces the number-typed union fields to strings", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [
          {
            ...PAYLOAD,
            productCode: 105127,
            organization: { ...PAYLOAD.organization, relationNumber: 73100 },
            packageTypeCode: 577,
            mainGroupCode: 1,
          },
        ],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.productCode).toBe("105127");
    expect(row.supplierRelationNumber).toBe("73100");
    expect(row.packageTypeCode).toBe("577");
    expect(row.mainGroupCode).toBe("1");
  });

  it("keeps a null presale price as null, not as the string \"null\"", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, preSalePriceValue: null }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.preSalePriceValue).toBeNull();
  });

  // Only the fields the schema actually requires. Everything else is `.nullish()` and
  // genuinely absent here, not just null - the case a new, not-yet-observed product group
  // would trigger. This pins down that such a record still satisfies every NOT NULL column
  // on ClockSupplyLine; the reviewer's column-by-column check proves it once, this test
  // keeps proving it as the schema moves.
  it("still produces every NOT NULL column from a bare-minimum payload", () => {
    const minimal = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      reference: "minimal-1",
      organization: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      name: "MINIMAL",
      mainGroupCode: "1",
      currentNumberOfPieces: 10,
      auctionLocation: "Naaldwijk",
    };

    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({ results: [minimal], totalDocuments: 1 }).results[0],
      "20260807",
    );

    expect(row.clockSupplyLineId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(row.reference).toBe("minimal-1");
    expect(row.auctionDate.toISOString()).toBe("2026-08-07T00:00:00.000Z");
    expect(row.supplierOrganizationId).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(row.supplierCertificates).toEqual([]);
    expect(row.name).toBe("MINIMAL");
    expect(row.mainGroupCode).toBe("1");
    expect(row.currentNumberOfPieces).toBe(10);
    expect(row.auctionLocation).toBe("Naaldwijk");
    expect(row.isAuctioned).toBe(false);
    expect(row.isFromSyntheticRequest).toBe(false);
    expect(row.isSynthetic).toBe(false);
  });
});

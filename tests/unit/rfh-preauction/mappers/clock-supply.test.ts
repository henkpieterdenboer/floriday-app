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
});

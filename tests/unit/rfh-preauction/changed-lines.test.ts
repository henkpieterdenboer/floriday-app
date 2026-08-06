import { describe, expect, it } from "vitest";
import { selectChangedClockLines } from "@/features/rfh-preauction/sync/changed-lines";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

function rij(overschrijf: Partial<ClockSupplyLineRow> = {}): ClockSupplyLineRow {
  return {
    clockSupplyLineId: "11111111-1111-4111-8111-111111111111",
    reference: "9100183551655",
    auctionDate: new Date("2026-08-07T00:00:00.000Z"),
    clockPresalesSupplyLineId: "22222222-2222-4222-8222-222222222222",
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    supplierName: "Raadschelders Varens",
    supplierRelationNumber: "73100",
    supplierLogoUrl: null,
    supplierCertificates: ["MPS A"],
    productCode: "105127",
    vbnProductName: "NEPHROLEPIS",
    productName: "Nephrolepis",
    name: "NEPHRO EX BOSTONIENSIS",
    characteristics: null,
    positiveCharacteristics: null,
    negativeCharacteristics: null,
    qualityCode: "A1",
    qualityIndexClassification: "A",
    mainGroupCode: "1",
    productGroupName: "Varens",
    potSizeInCm: 12,
    plantHeightInCm: 40,
    photoUrl: null,
    topLevelMainColor: null,
    rgbMainColor: null,
    currentNumberOfPieces: 36,
    numberOfPackages: 3,
    piecesPerPackage: 12,
    packagesPerLayer: 3,
    layersPerLoadcarrier: 4,
    numberOfLoadCarriers: 1,
    numberOfPackagesPerLoadCarrier: 12,
    packageTypeCode: "577",
    packageTypeName: "Deense kar",
    loadCarrierCode: "DC",
    sequenceOnLoadCarrier: 2,
    preSaleInitialNumberOfPieces: 24,
    preSaleCurrentNumberOfPieces: 24,
    preSalePriceValue: "2.0000",
    preSalePriceCurrency: "EUR",
    auctionLocation: "Naaldwijk",
    clockShortName: "N4",
    auctioningSequence: 120,
    isAuctioned: false,
    digitalAuctionSupplyType: null,
    deliveryFormBarcode: "F2DDPWA",
    lastCommercialMutationMoment: new Date("2026-08-06T14:22:11.000Z"),
    isFromSyntheticRequest: false,
    isSynthetic: false,
    ...overschrijf,
  };
}

describe("selectChangedClockLines", () => {
  it("returns a line that was never seen before", () => {
    expect(selectChangedClockLines([rij()], new Map())).toHaveLength(1);
  });

  it("returns nothing when nothing changed", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij()], bestaand)).toHaveLength(0);
  });

  it("notices a sold-down piece count", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ currentNumberOfPieces: 24 });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(1);
  });

  it("notices the lot going under the clock", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij({ isAuctioned: true })], bestaand)).toHaveLength(1);
  });

  it("compares dates by value, not by identity", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ lastCommercialMutationMoment: new Date("2026-08-06T14:22:11.000Z") });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });

  it("compares certificate lists by content", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij({ supplierCertificates: ["MPS A"] })], bestaand))
      .toHaveLength(0);
    expect(selectChangedClockLines([rij({ supplierCertificates: ["MPS A", "GLOBALG.A.P."] })], bestaand))
      .toHaveLength(1);
  });

  // Zonder canonicalisatie is dit elke vijf minuten een "wijziging", voor elke partij met
  // kenmerken. Postgres jsonb geeft de sleutels in zijn eigen volgorde terug, niet in die
  // van RFH.
  it("ignores key order inside the characteristics", () => {
    const bestaand = new Map([
      [rij().clockSupplyLineId, rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }] })],
    ]);
    const nieuw = rij({ characteristics: [{ vbnValueCode: "012", vbnCode: "S01" }] });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });

  it("still notices a genuinely different characteristic", () => {
    const bestaand = new Map([
      [rij().clockSupplyLineId, rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }] })],
    ]);
    const nieuw = rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "014" }] });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(1);
  });

  it("sorts keys at every nesting level, not just the top", () => {
    const bestaand = new Map([
      [
        rij().clockSupplyLineId,
        rij({ characteristics: [{ a: 1, b: { c: 2, d: { e: 3, f: 4 } } }] }),
      ],
    ]);
    const nieuw = rij({ characteristics: [{ b: { d: { f: 4, e: 3 }, c: 2 }, a: 1 }] });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });

  it("treats a reversed characteristic order as a change", () => {
    const bestaand = new Map([
      [
        rij().clockSupplyLineId,
        rij({
          characteristics: [
            { vbnCode: "S01", vbnValueCode: "012" },
            { vbnCode: "S02", vbnValueCode: "013" },
          ],
        }),
      ],
    ]);
    const nieuw = rij({
      characteristics: [
        { vbnCode: "S02", vbnValueCode: "013" },
        { vbnCode: "S01", vbnValueCode: "012" },
      ],
    });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(1);
  });

  it("does not treat a dropped presale link as a change", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ clockPresalesSupplyLineId: null });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });
});

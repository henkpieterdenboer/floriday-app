import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

/**
 * Fabricated ids, not fixture ids.
 *
 * tests/helpers/test-ids.ts explains why that matters: the fixtures are real API responses,
 * and a cleanup step keyed on their primary keys once deleted 25 real archive rows. The
 * ffffffff prefix is the convention this repository uses to mark a row as belonging to a
 * test, and nothing real carries it.
 *
 * tests/integration/no-real-data-touched.test.ts guards SupplyLine, SupplyLineVersion,
 * TradeItem and Organization - not ClockSupplyLine. So the afterEach below deletes exactly
 * these two ids and never runs an unfiltered deleteMany.
 */
const ID = "ffffffff-0000-4000-8000-00000000c10c";
const PRESALE_ID = "ffffffff-0000-4000-8000-00000000b71d";

/**
 * A full row, copied from tests/unit/rfh-preauction/changed-lines.test.ts rather than shared
 * with it: the two tests should be free to change independently.
 *
 * characteristics deliberately carries a real array and positiveCharacteristics a null, so
 * both jsonb paths are exercised - a value written through the raw upsert and read back, and
 * an absent value that has to land as SQL NULL instead of the JSON string "null".
 */
function rij(overschrijf: Partial<ClockSupplyLineRow> = {}): ClockSupplyLineRow {
  return {
    clockSupplyLineId: ID,
    reference: "9100183551655",
    auctionDate: new Date("2026-08-07T00:00:00.000Z"),
    clockPresalesSupplyLineId: PRESALE_ID,
    supplierOrganizationId: "ffffffff-0000-4000-8000-00000000073a",
    supplierName: "Raadschelders Varens",
    supplierRelationNumber: "73100",
    supplierLogoUrl: null,
    supplierCertificates: ["MPS A"],
    productCode: "105127",
    vbnProductName: "NEPHROLEPIS",
    productName: "Nephrolepis",
    name: "NEPHRO EX BOSTONIENSIS",
    characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }],
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

afterEach(async () => {
  await prisma.clockSupplyLineVersion.deleteMany({ where: { clockSupplyLineId: ID } });
  await prisma.clockSupplyLine.deleteMany({ where: { clockSupplyLineId: ID } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("writeClockPage", () => {
  it("inserts a line and its first version", async () => {
    const uit = await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));

    expect(uit).toEqual({ rowsProcessed: 1, versionsAdded: 1, duplicatesCollapsed: 0 });
    expect(await prisma.clockSupplyLine.count({ where: { clockSupplyLineId: ID } })).toBe(1);
    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } }))
      .toBe(1);

    const huidig = await prisma.clockSupplyLine.findUniqueOrThrow({
      where: { clockSupplyLineId: ID },
    });
    expect(huidig.characteristics).toEqual([{ vbnCode: "S01", vbnValueCode: "012" }]);
    expect(huidig.preSalePriceValue?.toFixed(4)).toBe("2.0000");
    expect(huidig.supplierCertificates).toEqual(["MPS A"]);
    expect(huidig.auctionDate.toISOString()).toBe("2026-08-07T00:00:00.000Z");

    // An absent characteristic list must be SQL NULL in both tables, not the jsonb value
    // 'null'. The difference is invisible through Prisma - both read back as null in
    // JavaScript - so it is asserted in the database's own terms.
    const [nulls] = await prisma.$queryRaw<
      { huidigIsNull: boolean; versieIsNull: boolean; versieJson: string | null }[]
    >`
      SELECT
        (SELECT "positiveCharacteristics" IS NULL FROM "ClockSupplyLine"
          WHERE "clockSupplyLineId" = ${ID}::uuid) AS "huidigIsNull",
        (SELECT "positiveCharacteristics" IS NULL FROM "ClockSupplyLineVersion"
          WHERE "clockSupplyLineId" = ${ID}::uuid) AS "versieIsNull",
        (SELECT "characteristics"::text FROM "ClockSupplyLineVersion"
          WHERE "clockSupplyLineId" = ${ID}::uuid) AS "versieJson"
    `;
    expect(nulls.huidigIsNull).toBe(true);
    expect(nulls.versieIsNull).toBe(true);
    expect(JSON.parse(nulls.versieJson ?? "null")).toEqual([
      { vbnCode: "S01", vbnValueCode: "012" },
    ]);
  });

  it("adds no version when nothing changed", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    const uit = await writeClockPage([rij()], new Date("2026-08-06T10:05:00.000Z"));

    expect(uit.versionsAdded).toBe(0);
    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } }))
      .toBe(1);
  });

  it("adds a version when the piece count moves", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage(
      [rij({ currentNumberOfPieces: 12 })],
      new Date("2026-08-06T10:05:00.000Z"),
    );

    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } }))
      .toBe(2);
    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.currentNumberOfPieces).toBe(12);
  });

  // The single most important guarantee in write-clock-page.ts. RFH drops the presale link
  // once the auction day has passed, and that link is the only bridge to the presale
  // archive; a plain EXCLUDED assignment would erase it on the morning after every auction.
  it("never overwrites a stored presale link with null", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage(
      [rij({ clockPresalesSupplyLineId: null })],
      new Date("2026-08-08T10:00:00.000Z"),
    );

    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.clockPresalesSupplyLineId).toBe(PRESALE_ID);
  });

  it("keeps firstSeenAt and moves lastSeenAt", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage([rij()], new Date("2026-08-06T11:00:00.000Z"));

    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.firstSeenAt.toISOString()).toBe("2026-08-06T10:00:00.000Z");
    expect(huidig?.lastSeenAt.toISOString()).toBe("2026-08-06T11:00:00.000Z");
  });

  // Without deduplication this reaches the bulk upsert and throws "ON CONFLICT DO UPDATE
  // command cannot affect row a second time", which would abort the whole slice.
  it("collapses a duplicate id inside one page", async () => {
    const uit = await writeClockPage([rij(), rij()], new Date("2026-08-06T10:00:00.000Z"));
    expect(uit).toMatchObject({ rowsProcessed: 1, duplicatesCollapsed: 1 });
  });
});

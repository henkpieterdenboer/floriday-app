import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { UPSERT_COLUMNS, writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";
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
const ID_TWEE = "ffffffff-0000-4000-8000-00000000c10d";
const PRESALE_ID = "ffffffff-0000-4000-8000-00000000b71d";
const IDS = [ID, ID_TWEE];

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

/**
 * Dates and Decimals do not survive a database round trip as the same JavaScript value, so
 * they are compared by value. Everything else is left alone: toEqual already compares arrays
 * and objects structurally, and ignores key order - which matters, because jsonb hands the
 * keys back in its own order rather than RFH's.
 */
function normaliseer(waarde: unknown): unknown {
  if (waarde instanceof Date) return waarde.toISOString();
  if (typeof waarde === "object" && waarde !== null && "toFixed" in waarde) {
    return (waarde as { toFixed(cijfers: number): string }).toFixed(4);
  }
  return waarde;
}

/**
 * Compares a stored row against the row that went in, column by column.
 *
 * The VALUES tuple in write-clock-page.ts is hand-written with a cast per column; a spot check
 * of five columns would not notice two of them swapped. The column name is folded into the
 * compared value so a failure says which one.
 */
function verwachtRondgang(opgeslagen: Record<string, unknown>, verwacht: ClockSupplyLineRow): void {
  for (const kolom of UPSERT_COLUMNS) {
    expect({ [kolom]: normaliseer(opgeslagen[kolom]) }).toEqual({
      [kolom]: normaliseer((verwacht as unknown as Record<string, unknown>)[kolom]),
    });
  }
}

afterEach(async () => {
  await prisma.clockSupplyLineVersion.deleteMany({ where: { clockSupplyLineId: { in: IDS } } });
  await prisma.clockSupplyLine.deleteMany({ where: { clockSupplyLineId: { in: IDS } } });
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

  /**
   * The reason writeClockPage is a batch function instead of a loop is Prisma.join over the
   * VALUES tuples, and every other test in this file hands it a single line - the duplicate
   * test included, since those two collapse into one. So without this test the multi-row path
   * that carries every real page is never executed.
   *
   * Two lines that differ in as much as possible, compared column by column, so a VALUES
   * expression landing in the wrong column shows up here rather than in the archive.
   */
  it("writes two different lines in one call", async () => {
    const een = rij();
    const twee = rij({
      clockSupplyLineId: ID_TWEE,
      reference: "synth_9100183551999",
      clockPresalesSupplyLineId: null,
      supplierName: "Zurel",
      supplierCertificates: ["MPS A", "GLOBALG.A.P."],
      name: "ROSA GR RED NAOMI",
      characteristics: null,
      positiveCharacteristics: [{ vbnCode: "S25", vbnValueCode: "003" }],
      currentNumberOfPieces: 500,
      preSalePriceValue: null,
      preSalePriceCurrency: null,
      auctionLocation: "Aalsmeer",
      isAuctioned: true,
      lastCommercialMutationMoment: null,
      isSynthetic: true,
    });

    const uit = await writeClockPage([een, twee], new Date("2026-08-06T10:00:00.000Z"));

    expect(uit).toEqual({ rowsProcessed: 2, versionsAdded: 2, duplicatesCollapsed: 0 });

    const opgeslagen = await prisma.clockSupplyLine.findMany({
      where: { clockSupplyLineId: { in: IDS } },
    });
    expect(opgeslagen).toHaveLength(2);

    const perId = new Map(opgeslagen.map((regel) => [regel.clockSupplyLineId, regel]));
    verwachtRondgang(perId.get(ID) as unknown as Record<string, unknown>, een);
    verwachtRondgang(perId.get(ID_TWEE) as unknown as Record<string, unknown>, twee);
  });

  /**
   * The column list, the VALUES tuple and the ON CONFLICT assignments used to be three blocks
   * of text that had to agree by hand. Two of the three are now generated from UPSERT_COLUMNS,
   * and this holds that list up against the row type: add a field to ClockSupplyLineRow, write
   * it nowhere, and this fails instead of the value quietly never being stored.
   *
   * isSynthetic is the one deliberate exception - not a column, recomputed from reference on
   * read (see the note on ClockSupplyLineRow.isSynthetic).
   */
  it("has a column for every field of a row", () => {
    const velden = Object.keys(rij()).filter((veld) => veld !== "isSynthetic");
    expect([...UPSERT_COLUMNS].sort()).toEqual(velden.sort());
  });
});

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";
import { selectChangedClockLines } from "@/features/rfh-preauction/sync/changed-lines";

export interface ClockWriteResult {
  rowsProcessed: number;
  versionsAdded: number;
  /**
   * How many rows were dropped as duplicates within this slice. Expected to be zero. It is
   * reported rather than silently swallowed because a non-zero value means an assumption
   * about RFH's slicing no longer holds, and that is worth noticing the first time.
   */
  duplicatesCollapsed: number;
}

/** Last occurrence wins, matching how dedupeSupplyLines treats the Floriday feed. */
function dedupe(rows: readonly ClockSupplyLineRow[]): ClockSupplyLineRow[] {
  const perId = new Map<string, ClockSupplyLineRow>();
  for (const row of rows) perId.set(row.clockSupplyLineId, row);
  return [...perId.values()];
}

/**
 * A jsonb literal for the raw upsert.
 *
 * Prisma.JsonNull and Prisma.DbNull are sentinels the Prisma query builder understands; they
 * mean nothing inside Prisma.sql, where every value becomes a plain query parameter. So the
 * value is stringified and cast explicitly, and an absent list becomes a real SQL NULL rather
 * than the jsonb value 'null'. Handing the array itself to the driver would not work either:
 * node-postgres serialises a JavaScript array as a Postgres *array* literal, which is not
 * valid jsonb input. Tried, not reasoned about - it fails with 22P02, `invalid input syntax
 * for type json: Expected ":", but found "}"`, on the first row with characteristics.
 */
function jsonb(value: unknown[] | null): Prisma.Sql {
  return value === null ? Prisma.sql`NULL::jsonb` : Prisma.sql`${JSON.stringify(value)}::jsonb`;
}

/**
 * The same value for the createMany path, which goes through the query builder rather than
 * raw SQL and therefore does want a sentinel.
 *
 * Prisma.DbNull, not Prisma.JsonNull: the first stores SQL NULL, the second stores the jsonb
 * value 'null'. "This lot has no characteristics" is the former, and the two are impossible
 * to tell apart from JavaScript afterwards - both read back as null - so it has to be right
 * on the way in.
 *
 * The cast is unavoidable: ClockSupplyLineRow types these as unknown[], and Prisma's
 * InputJsonValue does not accept an array of unknown.
 */
function jsonInput(value: unknown[] | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

/**
 * Whether a stored line is RFH's own staging test data. Never a column: see the note on
 * ClockSupplyLineRow.isSynthetic. reference is stored, so this is recomputed on read.
 */
function isSynthetisch(reference: string): boolean {
  return reference.startsWith("synth_");
}

/**
 * Every ClockSupplyLine column this writer fills from a row, in the order the VALUES tuple
 * below lists them.
 *
 * A Record rather than an array so the compiler enforces completeness, the same reasoning as
 * CONTENT_FIELD_SET in changed-lines.ts: add a field to ClockSupplyLineRow and this object
 * stops compiling until someone decides which column it belongs in. Without that, a new field
 * would simply never be written - no error, no failing test, and a gap in the archive that
 * cannot be reconstructed afterwards.
 *
 * isSynthetic is deliberately absent: it is not a column, it is derived from reference on
 * read (see the note on the field). firstSeenAt and lastSeenAt are absent because they are
 * bookkeeping rather than row content; upsertSql appends them itself.
 */
const UPSERT_COLUMN_SET: Record<Exclude<keyof ClockSupplyLineRow, "isSynthetic">, true> = {
  clockSupplyLineId: true,
  reference: true,
  auctionDate: true,
  clockPresalesSupplyLineId: true,
  supplierOrganizationId: true,
  supplierName: true,
  supplierRelationNumber: true,
  supplierLogoUrl: true,
  supplierCertificates: true,
  productCode: true,
  vbnProductName: true,
  productName: true,
  name: true,
  characteristics: true,
  positiveCharacteristics: true,
  negativeCharacteristics: true,
  qualityCode: true,
  qualityIndexClassification: true,
  mainGroupCode: true,
  productGroupName: true,
  potSizeInCm: true,
  plantHeightInCm: true,
  photoUrl: true,
  topLevelMainColor: true,
  rgbMainColor: true,
  currentNumberOfPieces: true,
  numberOfPackages: true,
  piecesPerPackage: true,
  packagesPerLayer: true,
  layersPerLoadcarrier: true,
  numberOfLoadCarriers: true,
  numberOfPackagesPerLoadCarrier: true,
  packageTypeCode: true,
  packageTypeName: true,
  loadCarrierCode: true,
  sequenceOnLoadCarrier: true,
  preSaleInitialNumberOfPieces: true,
  preSaleCurrentNumberOfPieces: true,
  preSalePriceValue: true,
  preSalePriceCurrency: true,
  auctionLocation: true,
  clockShortName: true,
  auctioningSequence: true,
  isAuctioned: true,
  digitalAuctionSupplyType: true,
  deliveryFormBarcode: true,
  lastCommercialMutationMoment: true,
  isFromSyntheticRequest: true,
};

/** Exported so a test can hold this list up against ClockSupplyLineRow itself. */
export const UPSERT_COLUMNS = Object.keys(UPSERT_COLUMN_SET);

/**
 * The column list and the ON CONFLICT assignments are both generated from UPSERT_COLUMNS, so
 * the three parts of the statement cannot drift apart. Written out by hand they were three
 * separate blocks of text that happened to agree; a column added to two of them and forgotten
 * in the third compiles and runs, and only shows up as a value that is silently never stored.
 *
 * Prisma.raw is safe here precisely because these names come from a compile-time constant and
 * never from data - it is the only way to put an identifier into a statement, since a bound
 * parameter cannot be a column name.
 */
const KOLOMMEN = Prisma.raw(
  [...UPSERT_COLUMNS, "firstSeenAt", "lastSeenAt"].map((kolom) => `"${kolom}"`).join(", "),
);

/**
 * Three columns are deliberately not a plain EXCLUDED assignment.
 *
 * clockSupplyLineId is the conflict target; assigning it would be meaningless.
 *
 * firstSeenAt is absent altogether, so a re-observation never disturbs when we first saw the
 * lot. lastSeenAt is always bumped to observedAt.
 *
 * clockPresalesSupplyLineId is the subtle one: COALESCE, so an incoming null can never erase
 * a link we already hold. RFH drops the link once the auction day has passed (spec §3.7) -
 * measured on staging, past auction days carry it on zero rows and the next auction day on
 * 33 of 36 - and that link is the only bridge between this feed and the presale archive.
 * Losing it to routine housekeeping would quietly destroy the thing this feature exists to
 * provide. The integration test proves it: swap this line for a plain EXCLUDED assignment and
 * "never overwrites a stored presale link with null" fails, alone.
 */
const TOEWIJZINGEN = Prisma.raw(
  [
    ...UPSERT_COLUMNS.filter(
      (kolom) => kolom !== "clockSupplyLineId" && kolom !== "clockPresalesSupplyLineId",
    ).map((kolom) => `"${kolom}" = EXCLUDED."${kolom}"`),
    `"clockPresalesSupplyLineId" = COALESCE(EXCLUDED."clockPresalesSupplyLineId", "ClockSupplyLine"."clockPresalesSupplyLineId")`,
    `"lastSeenAt" = EXCLUDED."lastSeenAt"`,
  ].join(",\n      "),
);

/**
 * One multi-row INSERT ... ON CONFLICT for the whole slice, for the same reason the Floriday
 * writer does it (see write-supply-page.ts for the measurements): a per-row upsert loop
 * inside a transaction is an order of magnitude slower and does not fit inside the
 * transaction timeout at page size.
 *
 * The VALUES tuple is the one part that stays hand-written, because every column needs its own
 * cast. Its order must match UPSERT_COLUMNS. A mismatch in *count* is not a silent failure -
 * Postgres refuses the statement outright ("INSERT has more expressions than target columns"),
 * so every test goes red at once.
 */
function upsertSql(rows: readonly ClockSupplyLineRow[], observedAt: Date): Prisma.Sql {
  const values = rows.map(
    (row) => Prisma.sql`(
      ${row.clockSupplyLineId}::uuid, ${row.reference}, ${row.auctionDate}::date,
      ${row.clockPresalesSupplyLineId}::uuid,
      ${row.supplierOrganizationId}::uuid, ${row.supplierName}, ${row.supplierRelationNumber},
      ${row.supplierLogoUrl}, ${row.supplierCertificates}::text[],
      ${row.productCode}, ${row.vbnProductName}, ${row.productName}, ${row.name},
      ${jsonb(row.characteristics)}, ${jsonb(row.positiveCharacteristics)},
      ${jsonb(row.negativeCharacteristics)},
      ${row.qualityCode}, ${row.qualityIndexClassification}, ${row.mainGroupCode},
      ${row.productGroupName}, ${row.potSizeInCm}, ${row.plantHeightInCm}, ${row.photoUrl},
      ${row.topLevelMainColor}, ${row.rgbMainColor},
      ${row.currentNumberOfPieces}, ${row.numberOfPackages}, ${row.piecesPerPackage},
      ${row.packagesPerLayer}, ${row.layersPerLoadcarrier}, ${row.numberOfLoadCarriers},
      ${row.numberOfPackagesPerLoadCarrier}, ${row.packageTypeCode}, ${row.packageTypeName},
      ${row.loadCarrierCode}, ${row.sequenceOnLoadCarrier},
      ${row.preSaleInitialNumberOfPieces}, ${row.preSaleCurrentNumberOfPieces},
      ${row.preSalePriceValue}::numeric(12,4), ${row.preSalePriceCurrency},
      ${row.auctionLocation}, ${row.clockShortName}, ${row.auctioningSequence},
      ${row.isAuctioned}, ${row.digitalAuctionSupplyType}, ${row.deliveryFormBarcode},
      ${row.lastCommercialMutationMoment}, ${row.isFromSyntheticRequest},
      ${observedAt}, ${observedAt}
    )`,
  );

  return Prisma.sql`
    INSERT INTO "ClockSupplyLine" (${KOLOMMEN})
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("clockSupplyLineId") DO UPDATE SET
      ${TOEWIJZINGEN}
  `;
}

/**
 * Persists one slice: current state to ClockSupplyLine, plus one version row per line whose
 * content actually changed since it was last stored (see selectChangedClockLines for what
 * counts as a change and why the presale link does not).
 *
 * Both writes share a single transaction, so a slice is archived atomically - either the
 * current-state table and the archive both reflect this slice, or neither does. The read
 * that decides which lines changed happens beforehand, outside the transaction, since it
 * only needs to be consistent with itself.
 */
export async function writeClockPage(
  rows: readonly ClockSupplyLineRow[],
  observedAt: Date,
): Promise<ClockWriteResult> {
  if (rows.length === 0) {
    return { rowsProcessed: 0, versionsAdded: 0, duplicatesCollapsed: 0 };
  }

  const deduped = dedupe(rows);
  const ids = deduped.map((row) => row.clockSupplyLineId);

  const stored = await prisma.clockSupplyLine.findMany({
    where: { clockSupplyLineId: { in: ids } },
  });

  // Bring the stored rows back to the shape selectChangedClockLines compares against:
  // drop the bookkeeping columns, turn the Decimal back into the fixed-point string the
  // mapper produces, and recompute isSynthetic, which is not stored.
  const existing = new Map<string, ClockSupplyLineRow>(
    stored.map((line) => {
      const { firstSeenAt: _first, lastSeenAt: _last, ...content } = line;
      return [
        line.clockSupplyLineId,
        {
          ...content,
          preSalePriceValue: line.preSalePriceValue?.toFixed(4) ?? null,
          characteristics: content.characteristics as unknown[] | null,
          positiveCharacteristics: content.positiveCharacteristics as unknown[] | null,
          negativeCharacteristics: content.negativeCharacteristics as unknown[] | null,
          isSynthetic: isSynthetisch(line.reference),
        },
      ];
    }),
  );

  const changed = selectChangedClockLines(deduped, existing);

  await prisma.$transaction(
    async (tx) => {
      // ClockSupplyLineVersion has a foreign key to ClockSupplyLine, so on a lot's first
      // observation the current-state row must exist before its version row can be inserted.
      await tx.$executeRaw(upsertSql(deduped, observedAt));

      if (changed.length > 0) {
        await tx.clockSupplyLineVersion.createMany({
          // isSynthetic is stripped here: it is not a column (see jsonInput for the Json ones).
          data: changed.map(({ isSynthetic: _isSynthetic, ...row }) => ({
            ...row,
            characteristics: jsonInput(row.characteristics),
            positiveCharacteristics: jsonInput(row.positiveCharacteristics),
            negativeCharacteristics: jsonInput(row.negativeCharacteristics),
            observedAt,
          })),
          skipDuplicates: true,
        });
      }
    },
    // Fifteen seconds, taken from the Floriday writer, where the bulk upsert was measured at
    // roughly one second per 1000 rows against Neon in Frankfurt. A page from this feed holds
    // at most 500 lines, so the budget is an order of magnitude more than the work needs -
    // deliberately, since the cost of a timeout is a slice that never lands.
    { timeout: 15_000 },
  );

  return {
    rowsProcessed: deduped.length,
    versionsAdded: changed.length,
    duplicatesCollapsed: rows.length - deduped.length,
  };
}

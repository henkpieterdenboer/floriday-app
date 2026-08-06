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
 * One multi-row INSERT ... ON CONFLICT for the whole slice, for the same reason the Floriday
 * writer does it (see write-supply-page.ts for the measurements): a per-row upsert loop
 * inside a transaction is an order of magnitude slower and does not fit inside the
 * transaction timeout at slice size.
 *
 * Two columns are deliberately absent from a plain EXCLUDED assignment.
 *
 * firstSeenAt is not updated at all, so a re-observation never disturbs when we first saw
 * the lot.
 *
 * clockPresalesSupplyLineId is written with COALESCE, which is the subtle one: an incoming
 * null can never erase a link we already hold. RFH drops the link once the auction day has
 * passed (spec §3.7) - measured on staging, past auction days carry it on zero rows and the
 * next auction day on 33 of 36 - and that link is the only bridge between this feed and the
 * presale archive. Losing it to routine housekeeping would quietly destroy the thing this
 * feature exists to provide.
 *
 * isSynthetic is absent because it is not a column; it is derived from reference on read.
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
    INSERT INTO "ClockSupplyLine" (
      "clockSupplyLineId", "reference", "auctionDate", "clockPresalesSupplyLineId",
      "supplierOrganizationId", "supplierName", "supplierRelationNumber", "supplierLogoUrl",
      "supplierCertificates", "productCode", "vbnProductName", "productName", "name",
      "characteristics", "positiveCharacteristics", "negativeCharacteristics",
      "qualityCode", "qualityIndexClassification", "mainGroupCode", "productGroupName",
      "potSizeInCm", "plantHeightInCm", "photoUrl", "topLevelMainColor", "rgbMainColor",
      "currentNumberOfPieces", "numberOfPackages", "piecesPerPackage", "packagesPerLayer",
      "layersPerLoadcarrier", "numberOfLoadCarriers", "numberOfPackagesPerLoadCarrier",
      "packageTypeCode", "packageTypeName", "loadCarrierCode", "sequenceOnLoadCarrier",
      "preSaleInitialNumberOfPieces", "preSaleCurrentNumberOfPieces", "preSalePriceValue",
      "preSalePriceCurrency", "auctionLocation", "clockShortName", "auctioningSequence",
      "isAuctioned", "digitalAuctionSupplyType", "deliveryFormBarcode",
      "lastCommercialMutationMoment", "isFromSyntheticRequest", "firstSeenAt", "lastSeenAt"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("clockSupplyLineId") DO UPDATE SET
      "reference" = EXCLUDED."reference",
      "auctionDate" = EXCLUDED."auctionDate",
      "clockPresalesSupplyLineId" = COALESCE(
        EXCLUDED."clockPresalesSupplyLineId", "ClockSupplyLine"."clockPresalesSupplyLineId"
      ),
      "supplierOrganizationId" = EXCLUDED."supplierOrganizationId",
      "supplierName" = EXCLUDED."supplierName",
      "supplierRelationNumber" = EXCLUDED."supplierRelationNumber",
      "supplierLogoUrl" = EXCLUDED."supplierLogoUrl",
      "supplierCertificates" = EXCLUDED."supplierCertificates",
      "productCode" = EXCLUDED."productCode",
      "vbnProductName" = EXCLUDED."vbnProductName",
      "productName" = EXCLUDED."productName",
      "name" = EXCLUDED."name",
      "characteristics" = EXCLUDED."characteristics",
      "positiveCharacteristics" = EXCLUDED."positiveCharacteristics",
      "negativeCharacteristics" = EXCLUDED."negativeCharacteristics",
      "qualityCode" = EXCLUDED."qualityCode",
      "qualityIndexClassification" = EXCLUDED."qualityIndexClassification",
      "mainGroupCode" = EXCLUDED."mainGroupCode",
      "productGroupName" = EXCLUDED."productGroupName",
      "potSizeInCm" = EXCLUDED."potSizeInCm",
      "plantHeightInCm" = EXCLUDED."plantHeightInCm",
      "photoUrl" = EXCLUDED."photoUrl",
      "topLevelMainColor" = EXCLUDED."topLevelMainColor",
      "rgbMainColor" = EXCLUDED."rgbMainColor",
      "currentNumberOfPieces" = EXCLUDED."currentNumberOfPieces",
      "numberOfPackages" = EXCLUDED."numberOfPackages",
      "piecesPerPackage" = EXCLUDED."piecesPerPackage",
      "packagesPerLayer" = EXCLUDED."packagesPerLayer",
      "layersPerLoadcarrier" = EXCLUDED."layersPerLoadcarrier",
      "numberOfLoadCarriers" = EXCLUDED."numberOfLoadCarriers",
      "numberOfPackagesPerLoadCarrier" = EXCLUDED."numberOfPackagesPerLoadCarrier",
      "packageTypeCode" = EXCLUDED."packageTypeCode",
      "packageTypeName" = EXCLUDED."packageTypeName",
      "loadCarrierCode" = EXCLUDED."loadCarrierCode",
      "sequenceOnLoadCarrier" = EXCLUDED."sequenceOnLoadCarrier",
      "preSaleInitialNumberOfPieces" = EXCLUDED."preSaleInitialNumberOfPieces",
      "preSaleCurrentNumberOfPieces" = EXCLUDED."preSaleCurrentNumberOfPieces",
      "preSalePriceValue" = EXCLUDED."preSalePriceValue",
      "preSalePriceCurrency" = EXCLUDED."preSalePriceCurrency",
      "auctionLocation" = EXCLUDED."auctionLocation",
      "clockShortName" = EXCLUDED."clockShortName",
      "auctioningSequence" = EXCLUDED."auctioningSequence",
      "isAuctioned" = EXCLUDED."isAuctioned",
      "digitalAuctionSupplyType" = EXCLUDED."digitalAuctionSupplyType",
      "deliveryFormBarcode" = EXCLUDED."deliveryFormBarcode",
      "lastCommercialMutationMoment" = EXCLUDED."lastCommercialMutationMoment",
      "isFromSyntheticRequest" = EXCLUDED."isFromSyntheticRequest",
      "lastSeenAt" = EXCLUDED."lastSeenAt"
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
    { timeout: 15_000 },
  );

  return {
    rowsProcessed: deduped.length,
    versionsAdded: changed.length,
    duplicatesCollapsed: rows.length - deduped.length,
  };
}

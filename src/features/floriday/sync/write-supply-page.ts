import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import { selectChangedLines } from "@/features/floriday/sync/changed-lines";

export interface WriteResult {
  rowsProcessed: number;
  versionsAdded: number;
}

/**
 * Builds a single multi-row `INSERT ... ON CONFLICT ("supplyLineId") DO UPDATE` statement
 * for the whole page. One round trip regardless of page size, which matters at backfill
 * scale (roughly 1.2 million rows in pages of 1000).
 *
 * Measured against Neon (Frankfurt): a per-row `upsert` loop inside an interactive
 * transaction cost ~45 ms/row, i.e. ~45 s per 1000-row page - already past the 30 s
 * transaction timeout for a single page, and ~15 hours for a full backfill. This single
 * statement costs ~1 s per 1000-row page, ~20 minutes for the full backfill.
 *
 * firstSeenAt is deliberately absent from the UPDATE SET list so a conflict never disturbs
 * it; lastSeenAt is always bumped to observedAt.
 */
function upsertSupplyLinesSql(rows: readonly SupplyLineRow[], observedAt: Date): Prisma.Sql {
  const values = rows.map(
    (row) => Prisma.sql`(
      ${row.supplyLineId}::uuid,
      ${row.status}::"SupplyStatus",
      ${row.tradeItemId}::uuid,
      ${row.tradeItemVersion},
      ${row.pricePerPiece}::numeric(12,4),
      ${row.currency},
      ${row.numberOfPieces},
      ${row.deliveryNoteReference},
      ${row.deliveryNoteCode},
      ${row.deliveryNoteLetter},
      ${row.piecesPerPackage},
      ${row.vbnPackageCode},
      ${row.customPackageId}::uuid,
      ${row.packagesPerLayer},
      ${row.layersPerLoadCarrier},
      ${row.loadCarrier},
      ${row.tradePeriodStart},
      ${row.tradePeriodEnd},
      ${row.supplierOrganizationId}::uuid,
      ${row.sequenceNumber},
      ${row.creationDateTime},
      ${row.lastModifiedDateTime},
      ${row.auctionDate}::date,
      ${row.initialAuctionLocation}::"AuctionLocation",
      ${row.photoUrl},
      ${observedAt},
      ${observedAt}
    )`,
  );

  return Prisma.sql`
    INSERT INTO "SupplyLine" (
      "supplyLineId", "status", "tradeItemId", "tradeItemVersion", "pricePerPiece",
      "currency", "numberOfPieces", "deliveryNoteReference", "deliveryNoteCode",
      "deliveryNoteLetter", "piecesPerPackage", "vbnPackageCode", "customPackageId",
      "packagesPerLayer", "layersPerLoadCarrier", "loadCarrier", "tradePeriodStart",
      "tradePeriodEnd", "supplierOrganizationId", "sequenceNumber", "creationDateTime",
      "lastModifiedDateTime", "auctionDate", "initialAuctionLocation", "photoUrl",
      "firstSeenAt", "lastSeenAt"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("supplyLineId") DO UPDATE SET
      "status" = EXCLUDED."status",
      "tradeItemId" = EXCLUDED."tradeItemId",
      "tradeItemVersion" = EXCLUDED."tradeItemVersion",
      "pricePerPiece" = EXCLUDED."pricePerPiece",
      "currency" = EXCLUDED."currency",
      "numberOfPieces" = EXCLUDED."numberOfPieces",
      "deliveryNoteReference" = EXCLUDED."deliveryNoteReference",
      "deliveryNoteCode" = EXCLUDED."deliveryNoteCode",
      "deliveryNoteLetter" = EXCLUDED."deliveryNoteLetter",
      "piecesPerPackage" = EXCLUDED."piecesPerPackage",
      "vbnPackageCode" = EXCLUDED."vbnPackageCode",
      "customPackageId" = EXCLUDED."customPackageId",
      "packagesPerLayer" = EXCLUDED."packagesPerLayer",
      "layersPerLoadCarrier" = EXCLUDED."layersPerLoadCarrier",
      "loadCarrier" = EXCLUDED."loadCarrier",
      "tradePeriodStart" = EXCLUDED."tradePeriodStart",
      "tradePeriodEnd" = EXCLUDED."tradePeriodEnd",
      "supplierOrganizationId" = EXCLUDED."supplierOrganizationId",
      "sequenceNumber" = EXCLUDED."sequenceNumber",
      "creationDateTime" = EXCLUDED."creationDateTime",
      "lastModifiedDateTime" = EXCLUDED."lastModifiedDateTime",
      "auctionDate" = EXCLUDED."auctionDate",
      "initialAuctionLocation" = EXCLUDED."initialAuctionLocation",
      "photoUrl" = EXCLUDED."photoUrl",
      "lastSeenAt" = EXCLUDED."lastSeenAt"
  `;
}

/**
 * Persists one page of supply lines: current state to SupplyLine, and one SupplyLineVersion
 * row per line whose content actually changed since it was last stored (see
 * selectChangedLines for what counts as a change and why sequenceNumber is excluded).
 *
 * Both writes happen in a single database transaction so a page is archived atomically -
 * either both the current-state table and the version history reflect this page, or
 * neither does. The read that decides which lines changed happens beforehand, outside the
 * transaction, since it only needs to be consistent with itself, not with the write.
 */
export async function writeSupplyPage(
  rows: readonly SupplyLineRow[],
  observedAt: Date,
): Promise<WriteResult> {
  if (rows.length === 0) return { rowsProcessed: 0, versionsAdded: 0 };

  const ids = rows.map((row) => row.supplyLineId);

  const stored = await prisma.supplyLine.findMany({ where: { supplyLineId: { in: ids } } });

  // Prisma returns pricePerPiece as a Decimal and adds the two bookkeeping columns.
  // Bring it back to the shape selectChangedLines compares against.
  const existing = new Map<string, SupplyLineRow>(
    stored.map((line) => {
      const { firstSeenAt: _first, lastSeenAt: _last, ...content } = line;
      return [
        line.supplyLineId,
        { ...content, pricePerPiece: line.pricePerPiece.toFixed(4) },
      ];
    }),
  );

  const changed = selectChangedLines(rows, existing);

  await prisma.$transaction(async (tx) => {
    // SupplyLineVersion has a foreign key to SupplyLine, so on a line's first-ever
    // observation the SupplyLine row must exist before its version row can be inserted.
    await tx.$executeRaw(upsertSupplyLinesSql(rows, observedAt));

    if (changed.length > 0) {
      await tx.supplyLineVersion.createMany({
        data: changed.map((row) => ({ ...row, observedAt })),
        skipDuplicates: true,
      });
    }
  }, { timeout: 15_000 });

  return { rowsProcessed: rows.length, versionsAdded: changed.length };
}

import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

/**
 * Every field that carries meaning. sequenceNumber is deliberately absent: Floriday
 * hands out a fresh one on any touch, including bulk operations that change nothing.
 * Comparing on it would fill the archive with noise.
 */
const CONTENT_FIELDS = [
  "status",
  "tradeItemId",
  "tradeItemVersion",
  "pricePerPiece",
  "currency",
  "numberOfPieces",
  "deliveryNoteReference",
  "deliveryNoteCode",
  "deliveryNoteLetter",
  "piecesPerPackage",
  "vbnPackageCode",
  "customPackageId",
  "packagesPerLayer",
  "layersPerLoadCarrier",
  "loadCarrier",
  "tradePeriodStart",
  "tradePeriodEnd",
  "supplierOrganizationId",
  "creationDateTime",
  "lastModifiedDateTime",
  "auctionDate",
  "initialAuctionLocation",
  "photoUrl",
] as const satisfies readonly (keyof SupplyLineRow)[];

function isSameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }
  return left === right;
}

/**
 * Returns the incoming lines that differ from what is already stored. A line that is not
 * in `existing` is always returned, because a first observation is always worth keeping.
 */
export function selectChangedLines(
  incoming: readonly SupplyLineRow[],
  existing: ReadonlyMap<string, SupplyLineRow>,
): SupplyLineRow[] {
  return incoming.filter((line) => {
    const stored = existing.get(line.supplyLineId);
    if (!stored) return true;

    return CONTENT_FIELDS.some((field) => !isSameValue(line[field], stored[field]));
  });
}

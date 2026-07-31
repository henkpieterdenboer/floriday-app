import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

/**
 * Everything except the key and the sequence number carries meaning. sequenceNumber is
 * deliberately excluded: Floriday hands out a fresh one on any touch, including bulk
 * operations that change nothing. Comparing on it would fill the archive with noise.
 */
type ContentField = Exclude<keyof SupplyLineRow, "supplyLineId" | "sequenceNumber">;

/**
 * A Record rather than an array, so the compiler enforces completeness. `satisfies` on an
 * array only rejects names that are not keys; it happily accepts a list with a field
 * missing. That failure mode is invisible and permanent: a forgotten field means real
 * changes to it are never archived, and the gap cannot be reconstructed afterwards.
 * Add a column to SupplyLineRow and this object stops compiling until you decide about it.
 */
const CONTENT_FIELD_SET: Record<ContentField, true> = {
  status: true,
  tradeItemId: true,
  tradeItemVersion: true,
  pricePerPiece: true,
  currency: true,
  numberOfPieces: true,
  deliveryNoteReference: true,
  deliveryNoteCode: true,
  deliveryNoteLetter: true,
  piecesPerPackage: true,
  vbnPackageCode: true,
  customPackageId: true,
  packagesPerLayer: true,
  layersPerLoadCarrier: true,
  loadCarrier: true,
  tradePeriodStart: true,
  tradePeriodEnd: true,
  supplierOrganizationId: true,
  creationDateTime: true,
  lastModifiedDateTime: true,
  auctionDate: true,
  initialAuctionLocation: true,
  photoUrl: true,
};

const CONTENT_FIELDS = Object.keys(CONTENT_FIELD_SET) as ContentField[];

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

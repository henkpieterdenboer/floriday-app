import type { SupplyLinePayload } from "@/features/floriday/schemas/supply-line";

/**
 * The shape written to SupplyLine and SupplyLineVersion, minus the columns that are
 * bookkeeping rather than content (firstSeenAt, lastSeenAt, observedAt).
 */
export interface SupplyLineRow {
  supplyLineId: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  tradeItemId: string;
  tradeItemVersion: number | null;
  /** Kept as a fixed-point string so no precision is lost before Prisma's Decimal. */
  pricePerPiece: string;
  currency: string;
  numberOfPieces: number;
  deliveryNoteReference: string | null;
  deliveryNoteCode: string | null;
  deliveryNoteLetter: string | null;
  piecesPerPackage: number | null;
  vbnPackageCode: number | null;
  customPackageId: string | null;
  packagesPerLayer: number | null;
  layersPerLoadCarrier: number | null;
  loadCarrier: string | null;
  tradePeriodStart: Date;
  tradePeriodEnd: Date;
  supplierOrganizationId: string;
  sequenceNumber: bigint;
  creationDateTime: Date;
  lastModifiedDateTime: Date | null;
  auctionDate: Date;
  initialAuctionLocation:
    | "AALSMEER" | "NAALDWIJK" | "RIJNSBURG" | "EELDE"
    | "PLANTION" | "RHEINMAAS" | "DIGITAL";
  photoUrl: string | null;
}

export function toSupplyLineRow(payload: SupplyLinePayload): SupplyLineRow {
  const packing = payload.packingConfiguration;

  return {
    supplyLineId: payload.supplyLineId,
    status: payload.status,
    tradeItemId: payload.tradeItemId,
    tradeItemVersion: payload.tradeItemVersion,
    pricePerPiece: payload.pricePerPiece.value.toFixed(4),
    currency: payload.pricePerPiece.currency,
    numberOfPieces: payload.numberOfPieces,
    deliveryNoteReference: payload.deliveryNoteReference,
    deliveryNoteCode: payload.deliveryNoteCode,
    deliveryNoteLetter: payload.deliveryNoteLetter,
    piecesPerPackage: packing.piecesPerPackage,
    vbnPackageCode: packing.package.vbnPackageCode,
    customPackageId: packing.package.customPackageId,
    packagesPerLayer: packing.packagesPerLayer,
    layersPerLoadCarrier: packing.layersPerLoadCarrier,
    loadCarrier: packing.loadCarrier,
    tradePeriodStart: new Date(payload.tradePeriod.startDateTime),
    tradePeriodEnd: new Date(payload.tradePeriod.endDateTime),
    supplierOrganizationId: payload.supplierOrganizationId,
    sequenceNumber: BigInt(payload.sequenceNumber),
    creationDateTime: new Date(payload.creationDateTime),
    lastModifiedDateTime: payload.lastModifiedDateTime
      ? new Date(payload.lastModifiedDateTime)
      : null,
    auctionDate: new Date(`${payload.auctionDate}T00:00:00.000Z`),
    initialAuctionLocation: payload.initialAuctionLocation,
    photoUrl: payload.photoUrl,
  };
}

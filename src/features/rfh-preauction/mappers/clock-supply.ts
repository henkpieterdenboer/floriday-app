import type { ClockSupplyLinePayload } from "@/features/rfh-preauction/schemas/clock-supply";
import { sleutelNaarDatum } from "@/features/rfh-preauction/sync/veildagen";

/** The shape written to ClockSupplyLine and ClockSupplyLineVersion, minus the bookkeeping columns. */
export interface ClockSupplyLineRow {
  clockSupplyLineId: string;
  reference: string;
  auctionDate: Date;
  clockPresalesSupplyLineId: string | null;

  supplierOrganizationId: string;
  supplierName: string | null;
  supplierRelationNumber: string | null;
  supplierLogoUrl: string | null;
  supplierCertificates: string[];

  productCode: string | null;
  vbnProductName: string | null;
  productName: string | null;
  name: string;
  characteristics: unknown[] | null;
  positiveCharacteristics: unknown[] | null;
  negativeCharacteristics: unknown[] | null;
  qualityCode: string | null;
  qualityIndexClassification: string | null;
  mainGroupCode: string;
  productGroupName: string | null;
  potSizeInCm: number | null;
  plantHeightInCm: number | null;
  photoUrl: string | null;
  topLevelMainColor: string | null;
  rgbMainColor: string | null;

  currentNumberOfPieces: number;
  numberOfPackages: number | null;
  piecesPerPackage: number | null;
  packagesPerLayer: number | null;
  layersPerLoadcarrier: number | null;
  numberOfLoadCarriers: number | null;
  numberOfPackagesPerLoadCarrier: number | null;
  packageTypeCode: string | null;
  packageTypeName: string | null;
  loadCarrierCode: string | null;
  sequenceOnLoadCarrier: number | null;

  preSaleInitialNumberOfPieces: number | null;
  preSaleCurrentNumberOfPieces: number | null;
  /** Fixed-point string, like SupplyLineRow.pricePerPiece, so nothing is lost before Decimal. */
  preSalePriceValue: string | null;
  preSalePriceCurrency: string | null;

  auctionLocation: string;
  clockShortName: string | null;
  auctioningSequence: number | null;
  isAuctioned: boolean;
  digitalAuctionSupplyType: string | null;
  deliveryFormBarcode: string | null;
  lastCommercialMutationMoment: Date | null;

  isFromSyntheticRequest: boolean;
  /**
   * Whether this is RFH's own staging test data. Derived from the reference prefix, not from
   * isFromSyntheticRequest: that flag was false on every record measured, including the 174
   * obviously synthetic ones (spec §3.2).
   *
   * Never stored. It exists on this row only so changed-lines.ts and the search screen have
   * it to hand; ClockSupplyLine and ClockSupplyLineVersion carry no isSynthetic column and
   * are not meant to. reference is stored, and reference.startsWith("synth_") recomputes
   * this at read time, so a column here would just be a second copy of that same fact -
   * one that could drift from it. Task 11's writer strips this field before every insert.
   */
  isSynthetic: boolean;
}

const tekst = (waarde: string | number | null | undefined): string | null =>
  waarde === null || waarde === undefined ? null : String(waarde);

export function toClockSupplyLineRow(
  payload: ClockSupplyLinePayload,
  auctionDateKey: string,
): ClockSupplyLineRow {
  return {
    clockSupplyLineId: payload.id,
    reference: payload.reference,
    auctionDate: sleutelNaarDatum(auctionDateKey),
    clockPresalesSupplyLineId: payload.clockPresalesSupplyLineId ?? null,

    supplierOrganizationId: payload.organization.id,
    supplierName: payload.organization.name ?? null,
    supplierRelationNumber: tekst(payload.organization.relationNumber),
    supplierLogoUrl: payload.organization.logoUrl ?? null,
    supplierCertificates: payload.organization.certificates ?? [],

    productCode: tekst(payload.productCode),
    vbnProductName: payload.vbnProductName ?? null,
    productName: payload.productName ?? null,
    name: payload.name,
    characteristics: payload.characteristics ?? null,
    positiveCharacteristics: payload.positiveCharacteristics ?? null,
    negativeCharacteristics: payload.negativeCharacteristics ?? null,
    qualityCode: payload.qualityCode ?? null,
    qualityIndexClassification: payload.qualityIndexClassification ?? null,
    mainGroupCode: String(payload.mainGroupCode),
    productGroupName: payload.productGroupName ?? null,
    potSizeInCm: payload.potSizeInCm ?? null,
    plantHeightInCm: payload.plantHeightInCm ?? null,
    photoUrl: payload.photoUrl ?? null,
    topLevelMainColor: payload.topLevelMainColor ?? null,
    rgbMainColor: payload.rgbMainColor ?? null,

    currentNumberOfPieces: payload.currentNumberOfPieces,
    numberOfPackages: payload.numberOfPackages ?? null,
    piecesPerPackage: payload.piecesPerPackage ?? null,
    packagesPerLayer: payload.packagesPerLayer ?? null,
    layersPerLoadcarrier: payload.layersPerLoadcarrier ?? null,
    numberOfLoadCarriers: payload.numberOfLoadCarriers ?? null,
    numberOfPackagesPerLoadCarrier: payload.numberOfPackagesPerLoadCarrier ?? null,
    packageTypeCode: tekst(payload.packageTypeCode),
    packageTypeName: payload.packageTypeName ?? null,
    loadCarrierCode: payload.loadCarrierCode ?? null,
    sequenceOnLoadCarrier: payload.sequenceOnLoadCarrier ?? null,

    preSaleInitialNumberOfPieces: payload.preSaleInitialNumberOfPieces ?? null,
    preSaleCurrentNumberOfPieces: payload.preSaleCurrentNumberOfPieces ?? null,
    preSalePriceValue:
      payload.preSalePriceValue === null || payload.preSalePriceValue === undefined
        ? null
        : payload.preSalePriceValue.toFixed(4),
    preSalePriceCurrency: payload.preSalePriceCurrency ?? null,

    auctionLocation: payload.auctionLocation,
    clockShortName: payload.clockShortName ?? null,
    auctioningSequence: payload.auctioningSequence ?? null,
    isAuctioned: payload.isAuctioned ?? false,
    digitalAuctionSupplyType: payload.digitalAuctionSupplyType ?? null,
    deliveryFormBarcode: payload.deliveryFormBarcode ?? null,
    lastCommercialMutationMoment: payload.lastCommercialMutationMoment
      ? new Date(payload.lastCommercialMutationMoment)
      : null,

    isFromSyntheticRequest: payload.isFromSyntheticRequest ?? false,
    isSynthetic: payload.reference.startsWith("synth_"),
  };
}

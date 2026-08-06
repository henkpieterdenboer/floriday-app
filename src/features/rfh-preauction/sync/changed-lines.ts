import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

/**
 * Everything except the key and the presale link carries meaning.
 *
 * clockPresalesSupplyLineId is excluded because RFH drops it once the auction day has passed
 * (spec §3.7). Comparing on it would write an archive row for every lot on the morning after
 * every auction - thousands of versions a day recording nothing but RFH's own housekeeping.
 * write-clock-page.ts never overwrites a stored link with null for the same reason.
 */
type ContentField = Exclude<
  keyof ClockSupplyLineRow,
  "clockSupplyLineId" | "clockPresalesSupplyLineId"
>;

/**
 * A Record rather than an array, so the compiler enforces completeness - the same reasoning
 * as the Floriday side. Add a column to ClockSupplyLineRow and this object stops compiling
 * until someone decides whether it counts as content. A forgotten field means real changes
 * to it are never archived, and that gap cannot be reconstructed afterwards.
 */
const CONTENT_FIELD_SET: Record<ContentField, true> = {
  reference: true,
  auctionDate: true,
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
  isSynthetic: true,
};

const CONTENT_FIELDS = Object.keys(CONTENT_FIELD_SET) as ContentField[];

/**
 * Sorts object keys, recursively, leaving array order alone.
 *
 * The characteristic arrays are stored in Postgres `jsonb`, and jsonb does not preserve
 * key order inside an object - it stores keys by length, then bytewise. So the copy read
 * back from the database can stringify differently from the copy that just arrived from
 * RFH while meaning exactly the same thing. Compared naively that is a changed row on
 * every run: at 13.000 lots every five minutes, an archive filling up with noise that
 * records nothing.
 *
 * Array order is deliberately left alone. Key order carries no meaning; element order does.
 */
function canoniek(waarde: unknown): unknown {
  if (Array.isArray(waarde)) return waarde.map(canoniek);
  if (waarde !== null && typeof waarde === "object") {
    return Object.fromEntries(
      Object.entries(waarde as Record<string, unknown>)
        .sort(([links], [rechts]) => (links < rechts ? -1 : links > rechts ? 1 : 0))
        .map(([sleutel, inhoud]) => [sleutel, canoniek(inhoud)]),
    );
  }
  return waarde;
}

function isSameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    // Arrays here are certificate lists and characteristic blobs: small, and only ever
    // compared, never merged. Canonical JSON is the cheapest comparison that is actually
    // correct - see canoniek for why plain stringify is not.
    return JSON.stringify(canoniek(left)) === JSON.stringify(canoniek(right));
  }
  return left === right;
}

/**
 * Returns the incoming lines that differ from what is already stored. A line that is not
 * in `existing` is always returned, because a first observation is always worth keeping.
 */
export function selectChangedClockLines(
  incoming: readonly ClockSupplyLineRow[],
  existing: ReadonlyMap<string, ClockSupplyLineRow>,
): ClockSupplyLineRow[] {
  return incoming.filter((line) => {
    const stored = existing.get(line.clockSupplyLineId);
    if (!stored) return true;
    return CONTENT_FIELDS.some((field) => !isSameValue(line[field], stored[field]));
  });
}

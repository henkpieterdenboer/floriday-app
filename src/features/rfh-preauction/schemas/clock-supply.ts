import { z } from "zod";

/**
 * The clock supply record, as measured on 6 August 2026 (spec §3.1).
 *
 * Two deliberate departures from how the Floriday schemas are written.
 *
 * Optional scalars use `.nullish()` rather than `.nullable()`. The Floriday schemas can be
 * strict because there is a published swagger to be strict against; here the only
 * specification is what the web app happens to send, and a field that is simply absent for
 * a product group we have not looked at yet is not a reason to drop a page on the floor.
 *
 * The characteristic arrays stay `z.unknown()`. They are stored as Json and only ever
 * displayed, so parsing their internals would buy nothing and would break on the first
 * shape we have not seen.
 *
 * Run `npm run rfh-typeproef` before trusting any of this - it measures the real types over
 * hundreds of records instead of the handful this was drafted from. It already caught two
 * mistakes in this file: sequenceOnLoadCarrier and auctioningSequence arrive as a string on
 * most records rather than a number, and clockPresalesSupplyLineId can be `""` rather than
 * absent or a real UUID. Both are visible below.
 */

/**
 * "" and not present is the same absence, for clockPresalesSupplyLineId. Measured on staging
 * on 6 August 2026: 20260806 NAALDWIJK record 21 (reference 9100151942796) carries `""`
 * where every other record either has a real UUID or omits the field. `.uuid()` rejects the
 * empty string outright, which would drop the whole page over one record that is simply not
 * linked to a presale line - exactly the case this column exists to represent. Floriday's own
 * feed has the same habit (see fixtures-zijn-echte-data / floriday-lege-strings lessons), so
 * this is a known shape of these APIs rather than a one-off.
 */
const leegAlsAfwezig = (waarde: unknown) => (waarde === "" ? undefined : waarde);

export const clockSupplyLineSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  clockPresalesSupplyLineId: z.preprocess(leegAlsAfwezig, z.string().uuid().nullish()),

  organization: z.object({
    id: z.string().uuid(),
    name: z.string().nullish(),
    relationNumber: z.union([z.string(), z.number()]).nullish(),
    logoUrl: z.string().nullish(),
    certificates: z.string().array().nullish(),
  }),

  productCode: z.union([z.string(), z.number()]).nullish(),
  vbnProductName: z.string().nullish(),
  productName: z.string().nullish(),
  name: z.string(),
  characteristics: z.unknown().array().nullish(),
  positiveCharacteristics: z.unknown().array().nullish(),
  negativeCharacteristics: z.unknown().array().nullish(),
  qualityCode: z.string().nullish(),
  qualityIndexClassification: z.string().nullish(),
  mainGroupCode: z.union([z.string(), z.number()]),
  productGroupName: z.string().nullish(),
  potSizeInCm: z.number().nullish(),
  plantHeightInCm: z.number().nullish(),
  photoUrl: z.string().nullish(),
  topLevelMainColor: z.string().nullish(),
  rgbMainColor: z.string().nullish(),

  currentNumberOfPieces: z.number().int(),
  numberOfPackages: z.number().int().nullish(),
  piecesPerPackage: z.number().int().nullish(),
  packagesPerLayer: z.number().int().nullish(),
  layersPerLoadcarrier: z.number().int().nullish(),
  numberOfLoadCarriers: z.number().int().nullish(),
  numberOfPackagesPerLoadCarrier: z.number().int().nullish(),
  packageTypeCode: z.union([z.string(), z.number()]).nullish(),
  packageTypeName: z.string().nullish(),
  loadCarrierCode: z.string().nullish(),
  /**
   * A number in the single record this file was first drafted from, but a string on every one
   * of the 1117 records the typeproef measured across 3, 5, 6 and 7 August 2026. Both are real;
   * the mapper's `getal()` coerces whichever one arrives.
   */
  sequenceOnLoadCarrier: z.union([z.string(), z.number()]).nullish(),

  preSaleInitialNumberOfPieces: z.number().int().nullish(),
  preSaleCurrentNumberOfPieces: z.number().int().nullish(),
  preSalePriceValue: z.number().nullish(),
  preSalePriceCurrency: z.string().nullish(),

  auctionLocation: z.string(),
  clockShortName: z.string().nullish(),
  /** Same string-or-number inconsistency as sequenceOnLoadCarrier above, same evidence. */
  auctioningSequence: z.union([z.string(), z.number()]).nullish(),
  isAuctioned: z.boolean().nullish(),
  digitalAuctionSupplyType: z.string().nullish(),
  deliveryFormBarcode: z.string().nullish(),
  lastCommercialMutationMoment: z.string().nullish(),

  isFromSyntheticRequest: z.boolean().nullish(),
});

export const clockSupplyPageSchema = z.object({
  results: clockSupplyLineSchema.array(),
  totalDocuments: z.number().int(),
});

export type ClockSupplyLinePayload = z.infer<typeof clockSupplyLineSchema>;
export type ClockSupplyPage = z.infer<typeof clockSupplyPageSchema>;

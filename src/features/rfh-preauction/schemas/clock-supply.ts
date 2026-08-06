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
 * hundreds of records instead of the handful this was drafted from.
 */
export const clockSupplyLineSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  clockPresalesSupplyLineId: z.string().uuid().nullish(),

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
  sequenceOnLoadCarrier: z.number().int().nullish(),

  preSaleInitialNumberOfPieces: z.number().int().nullish(),
  preSaleCurrentNumberOfPieces: z.number().int().nullish(),
  preSalePriceValue: z.number().nullish(),
  preSalePriceCurrency: z.string().nullish(),

  auctionLocation: z.string(),
  clockShortName: z.string().nullish(),
  auctioningSequence: z.number().int().nullish(),
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

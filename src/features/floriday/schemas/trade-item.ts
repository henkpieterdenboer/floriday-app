import { z } from "zod";

const characteristicSchema = z.object({
  vbnCode: z.string(),
  vbnValueCode: z.string(),
});

const seasonalPeriodSchema = z.object({
  startWeek: z.number().int(),
  endWeek: z.number().int(),
});

// Floriday's photo ids are not always valid RFC4122 UUIDs (a real sample had an
// invalid variant nibble: "8bb25702-90f6-4123-d59c-08dc1b2a061e"), so this is a
// plain string rather than z.uuid().
const photoSchema = z.object({
  id: z.string(),
  url: z.string(),
  seasonalPeriod: z.unknown().nullable(),
  type: z.string(),
  primary: z.boolean(),
});

const packingConfigurationSchema = z.object({
  package: z.object({
    vbnPackageCode: z.number().int().nullable(),
    customPackageId: z.string().uuid().nullable(),
  }),
  piecesPerPackage: z.number().int(),
  photoUrl: z.string().nullable(),
  packagesPerLayer: z.number().int(),
  layersPerLoadCarrier: z.number().int(),
  loadCarrierType: z.string(),
  additionalPricePerPiece: z.object({
    currency: z.string(),
    value: z.number(),
  }),
  isPrimary: z.boolean(),
  floricodeVrsPackagingId: z.string().nullable(),
});

export const tradeItemSchema = z.object({
  tradeItemId: z.string().uuid(),
  supplierOrganizationId: z.string().uuid(),
  sellerOrganizationId: z.string().uuid(),
  name: z.string(),
  vbnProductCode: z.string().nullable(),
  code: z.string().nullable(),
  gtin: z.string().nullable(),
  botanicalNames: z.string().array().nullable(),
  countryOfOriginIsoCodes: z.string().array().nullable(),
  tradeItemVersion: z.number().int().nullable(),
  isDeleted: z.boolean(),
  isCustomerSpecific: z.boolean(),
  isHiddenInCatalog: z.boolean(),
  hasInvalidFloricodeData: z.boolean(),
  sequenceNumber: z.number().int(),
  creationDateTime: z.string(),
  lastModifiedDateTime: z.string(),
  parentId: z.string().nullable(),
  characteristics: characteristicSchema.array().nullable(),
  seasonalPeriods: seasonalPeriodSchema.array(),
  photos: photoSchema.array().nullable(),
  packingConfigurations: packingConfigurationSchema.array().nullable(),
  // Only ever observed as null; shape unconfirmed, kept loose rather than guessed.
  additionalPackagingInformationFloricodeVrsPackagingIds: z.unknown().nullable(),
});

export type TradeItemPayload = z.infer<typeof tradeItemSchema>;

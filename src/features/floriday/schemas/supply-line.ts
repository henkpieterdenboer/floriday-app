import { z } from "zod";

export const supplyStatusSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const auctionLocationSchema = z.enum([
  "AALSMEER",
  "NAALDWIJK",
  "RIJNSBURG",
  "EELDE",
  "PLANTION",
  "RHEINMAAS",
  "DIGITAL",
]);

export const supplyLineSchema = z.object({
  supplyLineId: z.string().uuid(),
  status: supplyStatusSchema,
  tradeItemId: z.string().uuid(),
  tradeItemVersion: z.number().int().nullable(),
  pricePerPiece: z.object({
    currency: z.string(),
    value: z.number(),
  }),
  deliveryNoteReference: z.string().nullable(),
  deliveryNoteCode: z.string().nullable(),
  deliveryNoteLetter: z.string().nullable(),
  numberOfPieces: z.number().int(),
  packingConfiguration: z.object({
    piecesPerPackage: z.number().int().nullable(),
    package: z.object({
      vbnPackageCode: z.number().int().nullable(),
      customPackageId: z.string().uuid().nullable(),
    }),
    packagesPerLayer: z.number().int().nullable(),
    layersPerLoadCarrier: z.number().int().nullable(),
    loadCarrier: z.string().nullable(),
  }),
  tradePeriod: z.object({
    startDateTime: z.string(),
    endDateTime: z.string(),
  }),
  supplierOrganizationId: z.string().uuid(),
  sequenceNumber: z.number().int(),
  creationDateTime: z.string(),
  lastModifiedDateTime: z.string().nullable(),
  auctionDate: z.string(),
  initialAuctionLocation: auctionLocationSchema,
  photoUrl: z.string().nullable(),
});

export const supplyPageSchema = z.object({
  maximumSequenceNumber: z.number().int(),
  results: supplyLineSchema.array(),
});

export type SupplyLinePayload = z.infer<typeof supplyLineSchema>;
export type SupplyPage = z.infer<typeof supplyPageSchema>;

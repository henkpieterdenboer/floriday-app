import { z } from "zod";

const addressSchema = z
  .object({
    addressLine: z.string().nullable(),
    city: z.string().nullable(),
    countryCode: z.string().nullable(),
    postalCode: z.string().nullable(),
    stateOrProvince: z.string().nullable(),
  })
  .nullable();

export const organizationSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().nullable(),
  commercialName: z.string().nullable(),
  companyGln: z.string().nullable(),
  rfhRelationId: z.number().int().nullable(),
  organizationType: z.string().nullable(),
  endDate: z.string().nullable(),
  sequenceNumber: z.number().int(),
  physicalAddress: addressSchema,
  mailingAddress: addressSchema,
  website: z.string().nullable(),
  phytosanitaryNumber: z.string().nullable(),
  paymentProviders: z.string().array(),
  isFsiCompliant: z.boolean(),
});

export const organizationPageSchema = z.object({
  maximumSequenceNumber: z.number().int(),
  results: organizationSchema.array(),
});

export type OrganizationPayload = z.infer<typeof organizationSchema>;

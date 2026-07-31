import type { OrganizationPayload } from "@/features/floriday/schemas/organization";

/**
 * The shape written to Organization. A dedicated interface rather than
 * Prisma.OrganizationCreateManyInput directly, because that generated type accepts
 * `bigint | number` for sequenceNumber (Prisma's convenience for BigInt columns) - callers
 * that compare or track the running maximum across a page want a single concrete type,
 * the same reasoning mappers/supply-line.ts already applies to SupplyLineRow.
 */
export interface OrganizationRow {
  organizationId: string;
  name: string | null;
  commercialName: string | null;
  companyGln: string | null;
  rfhRelationId: number | null;
  organizationType: string | null;
  city: string | null;
  countryCode: string | null;
  endDate: Date | null;
  sequenceNumber: bigint;
}

export function toOrganizationRow(payload: OrganizationPayload): OrganizationRow {
  const address = payload.physicalAddress ?? payload.mailingAddress;

  return {
    organizationId: payload.organizationId,
    name: payload.name,
    commercialName: payload.commercialName,
    companyGln: payload.companyGln,
    rfhRelationId: payload.rfhRelationId,
    organizationType: payload.organizationType,
    city: address?.city ?? null,
    countryCode: address?.countryCode ?? null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    sequenceNumber: BigInt(payload.sequenceNumber),
  };
}

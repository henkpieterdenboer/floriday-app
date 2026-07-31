import { Prisma } from "@prisma/client";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

export function toTradeItemRow(
  payload: TradeItemPayload,
  fetchedAt: Date,
): Prisma.TradeItemCreateManyInput {
  return {
    tradeItemId: payload.tradeItemId,
    supplierOrganizationId: payload.supplierOrganizationId,
    name: payload.name,
    vbnProductCode: payload.vbnProductCode,
    code: payload.code,
    gtin: payload.gtin,
    botanicalNames: payload.botanicalNames ?? [],
    countryOfOriginIsoCodes: payload.countryOfOriginIsoCodes ?? [],
    tradeItemVersion: payload.tradeItemVersion,
    isDeleted: payload.isDeleted,
    sequenceNumber: BigInt(payload.sequenceNumber),
    // Assigning plain JS `null` to a Json? column through createMany does not produce
    // SQL NULL - verified against a real Neon database, it stores the jsonb literal
    // `null` instead (jsonb_typeof = 'null', "column IS NULL" is false). Prisma.DbNull
    // is what actually clears the column, so it is used explicitly rather than `?? null`.
    characteristics: (payload.characteristics as Prisma.InputJsonValue | null) ?? Prisma.DbNull,
    photos: (payload.photos as Prisma.InputJsonValue | null) ?? Prisma.DbNull,
    packingConfigurations:
      (payload.packingConfigurations as Prisma.InputJsonValue | null) ?? Prisma.DbNull,
    fetchedAt,
  };
}

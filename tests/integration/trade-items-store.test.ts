import "dotenv/config";
import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { tradeItemSchema } from "@/features/floriday/schemas/trade-item";
import { findKnownTradeItemIds, saveTradeItems } from "@/features/floriday/sync/trade-items-store";

const items = tradeItemSchema.array().parse(
  JSON.parse(readFileSync("tests/fixtures/trade-items.json", "utf8")),
);
const ids = items.map((i) => i.tradeItemId);

const nullJsonId = "00000000-0000-4000-8000-000000000099";

async function cleanup(): Promise<void> {
  await prisma.tradeItem.deleteMany({ where: { tradeItemId: { in: [...ids, nullJsonId] } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("saveTradeItems / findKnownTradeItemIds", () => {
  it("saves a real fixture page and reports it as known afterwards", async () => {
    await saveTradeItems(items, new Date());

    expect(await prisma.tradeItem.count({ where: { tradeItemId: { in: ids } } }))
      .toBe(items.length);

    const known = await findKnownTradeItemIds(ids);
    expect(known).toEqual(new Set(ids));
  });

  it("skips duplicates instead of throwing when an id is already stored", async () => {
    await saveTradeItems(items, new Date());

    await expect(saveTradeItems(items, new Date())).resolves.not.toThrow();
    expect(await prisma.tradeItem.count({ where: { tradeItemId: { in: ids } } }))
      .toBe(items.length);
  });

  it("reports ids not yet stored as unknown", async () => {
    const known = await findKnownTradeItemIds(ids);
    expect(known.size).toBe(0);
  });

  // Pins the fix for a real Prisma pitfall found while building this: assigning plain JS
  // `null` to a Json? column through createMany does not produce SQL NULL, it stores the
  // jsonb literal `null` instead. Only Prisma.DbNull (used in the mapper) produces a
  // genuine SQL NULL, verified here directly against the database rather than trusting
  // the mapper's output shape alone.
  it("stores a trade item's absent json fields as true SQL NULL, not the jsonb null literal", async () => {
    const item = tradeItemSchema.parse({
      tradeItemId: nullJsonId,
      supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
      sellerOrganizationId: "33333333-3333-4333-8333-333333333333",
      name: "Probe item",
      vbnProductCode: "1",
      code: null,
      gtin: null,
      botanicalNames: [],
      countryOfOriginIsoCodes: [],
      tradeItemVersion: 1,
      isDeleted: false,
      isCustomerSpecific: false,
      isHiddenInCatalog: false,
      hasInvalidFloricodeData: false,
      sequenceNumber: 1,
      creationDateTime: "2026-01-01T00:00:00Z",
      lastModifiedDateTime: null,
      parentId: null,
      characteristics: null,
      seasonalPeriods: [],
      photos: null,
      packingConfigurations: null,
      additionalPackagingInformationFloricodeVrsPackagingIds: null,
    });

    await saveTradeItems([item], new Date());

    const raw = await prisma.$queryRaw<{ is_sql_null: boolean }[]>`
      SELECT characteristics IS NULL as is_sql_null
      FROM "TradeItem" WHERE "tradeItemId" = ${nullJsonId}::uuid
    `;
    expect(raw[0].is_sql_null).toBe(true);
  });

  it("does nothing for an empty item list", async () => {
    await expect(saveTradeItems([], new Date())).resolves.not.toThrow();
  });
});

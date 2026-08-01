import "dotenv/config";
import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";
import { toOrganizationRow } from "@/features/floriday/mappers/organization";
import { writeOrganizationsPage } from "@/features/floriday/sync/organizations-store";
import { toTestId } from "../helpers/test-ids";

const page = organizationPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/organizations.json", "utf8")),
);
// The fixture is a real captured page, so organizationId is the primary key of a real
// archive row. Convert it before it ever reaches the database so this test's writes and
// cleanup can never touch (or delete) real data.
const rows = page.results
  .map(toOrganizationRow)
  .map((row) => ({ ...row, organizationId: toTestId(row.organizationId) }));
const ids = rows.map((r) => r.organizationId);

async function cleanup(): Promise<void> {
  await prisma.organization.deleteMany({ where: { organizationId: { in: ids } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("writeOrganizationsPage", () => {
  it("inserts every organization in a real page", async () => {
    const result = await writeOrganizationsPage(rows);

    expect(result.rowsProcessed).toBe(rows.length);
    expect(await prisma.organization.count({ where: { organizationId: { in: ids } } }))
      .toBe(rows.length);
  });

  it("updates on a second write instead of failing on conflict", async () => {
    await writeOrganizationsPage(rows);

    const updated = rows.map((r) => ({ ...r, name: `${r.name} (renamed)` }));
    const second = await writeOrganizationsPage(updated);

    expect(second.rowsProcessed).toBe(rows.length);
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { organizationId: rows[0].organizationId },
    });
    expect(stored.name).toBe(`${rows[0].name} (renamed)`);
  });

  it("stores every column correctly, not just the ones spot-checked elsewhere", async () => {
    await writeOrganizationsPage(rows);

    const stored = await prisma.organization.findMany({ where: { organizationId: { in: ids } } });
    const storedById = new Map(stored.map((o) => [o.organizationId, o]));

    for (const row of rows) {
      const org = storedById.get(row.organizationId);
      expect(org).toBeDefined();
      if (!org) continue;

      expect(org.name).toBe(row.name);
      expect(org.commercialName).toBe(row.commercialName);
      expect(org.companyGln).toBe(row.companyGln);
      expect(org.rfhRelationId).toBe(row.rfhRelationId);
      expect(org.organizationType).toBe(row.organizationType);
      expect(org.city).toBe(row.city);
      expect(org.countryCode).toBe(row.countryCode);
      expect(org.endDate?.toISOString() ?? null).toBe(row.endDate?.toISOString() ?? null);
      expect(org.sequenceNumber).toBe(row.sequenceNumber);
    }
  });

  it("writes nothing and reports zero for an empty page", async () => {
    expect(await writeOrganizationsPage([])).toEqual({ rowsProcessed: 0 });
  });

  // Same class of assumption-violation guard as dedupeSupplyLines: if a duplicate
  // organizationId ever reaches the bulk upsert, Postgres would reject the whole
  // statement with "ON CONFLICT DO UPDATE command cannot affect row a second time".
  it("collapses a duplicate id within a page, keeping the entry with the higher sequence number", async () => {
    const lower = rows[0];
    const higher = { ...rows[0], sequenceNumber: rows[0].sequenceNumber + 1n, name: "Newer Name" };
    const pageWithDuplicate = [lower, higher, ...rows.slice(1)];

    const result = await writeOrganizationsPage(pageWithDuplicate);

    expect(result.rowsProcessed).toBe(rows.length);
    const stored = await prisma.organization.findUniqueOrThrow({
      where: { organizationId: rows[0].organizationId },
    });
    expect(stored.name).toBe("Newer Name");
    expect(stored.sequenceNumber).toBe(higher.sequenceNumber);
  });
});

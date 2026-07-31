import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { OrganizationRow } from "@/features/floriday/mappers/organization";

export interface WriteOrganizationsResult {
  rowsProcessed: number;
}

/**
 * Collapses duplicate organizationId entries within a single page, keeping the entry
 * with the highest sequenceNumber. Floriday's sync endpoint returns current state, so a
 * page is expected to contain each id at most once, but that is an assumption about their
 * internals, not a documented contract - the same caveat noted for supply lines. Without
 * this guard a duplicate would reach the bulk upsert below, which Postgres rejects with
 * "ON CONFLICT DO UPDATE command cannot affect row a second time".
 */
function dedupeOrganizations(rows: readonly OrganizationRow[]): OrganizationRow[] {
  const byId = new Map<string, OrganizationRow>();
  for (const row of rows) {
    const current = byId.get(row.organizationId);
    if (!current || row.sequenceNumber > current.sequenceNumber) {
      byId.set(row.organizationId, row);
    }
  }
  return Array.from(byId.values());
}

/**
 * One multi-row `INSERT ... ON CONFLICT DO UPDATE`, not a per-row upsert loop.
 *
 * Measured against Neon (Frankfurt) with synthetic 1000-row pages, the same page size
 * this sync uses: a per-row `upsert` in an interactive transaction cost ~41 ms/row
 * (~41 s for a 1000-row page - already past a 30 s transaction timeout). The single
 * statement below cost ~130 ms for the same 1000 rows. Organizations are a smaller
 * dataset than clock supply overall, but each page is the same size, so the per-page
 * cost is what matters here, and it is the same order of magnitude worse.
 */
function upsertOrganizationsSql(rows: readonly OrganizationRow[]): Prisma.Sql {
  const values = rows.map(
    (row) => Prisma.sql`(
      ${row.organizationId}::uuid,
      ${row.name},
      ${row.commercialName},
      ${row.companyGln},
      ${row.rfhRelationId},
      ${row.organizationType},
      ${row.city},
      ${row.countryCode},
      ${row.endDate},
      ${row.sequenceNumber}
    )`,
  );

  return Prisma.sql`
    INSERT INTO "Organization" (
      "organizationId", "name", "commercialName", "companyGln", "rfhRelationId",
      "organizationType", "city", "countryCode", "endDate", "sequenceNumber"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("organizationId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "commercialName" = EXCLUDED."commercialName",
      "companyGln" = EXCLUDED."companyGln",
      "rfhRelationId" = EXCLUDED."rfhRelationId",
      "organizationType" = EXCLUDED."organizationType",
      "city" = EXCLUDED."city",
      "countryCode" = EXCLUDED."countryCode",
      "endDate" = EXCLUDED."endDate",
      "sequenceNumber" = EXCLUDED."sequenceNumber"
  `;
}

export async function writeOrganizationsPage(
  rows: readonly OrganizationRow[],
): Promise<WriteOrganizationsResult> {
  if (rows.length === 0) return { rowsProcessed: 0 };

  const deduped = dedupeOrganizations(rows);
  await prisma.$executeRaw(upsertOrganizationsSql(deduped));

  return { rowsProcessed: deduped.length };
}

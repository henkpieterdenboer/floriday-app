import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuctionLocation, SearchFilters } from "@/features/supply-search/filters";
import { sortColumnSql } from "@/features/supply-search/sort";

export const PAGE_SIZE = 50;

export interface SupplyLineRow {
  supplyLineId: string;
  tradeItemId: string;
  /** Left join: 709 lines in the archive reference a trade item that was never fetched. */
  articleName: string | null;
  supplierOrganizationId: string;
  /** Left join: a supplier organization can be missing for the same reason. */
  growerName: string | null;
  numberOfPieces: number;
  pricePerPiece: number;
  currency: string;
  auctionDate: Date;
  initialAuctionLocation: AuctionLocation;
  deliveryNoteReference: string | null;
  deliveryNoteCode: string | null;
  status: "AVAILABLE" | "UNAVAILABLE";
}

/**
 * Escapes ILIKE's wildcard characters in free-text input, so a search term containing a
 * literal `%` or `_` is matched literally instead of as a wildcard. Not a security
 * boundary (the term is always bound as a parameter, never concatenated into the SQL
 * string) - purely a correctness fix, otherwise searching for e.g. "10_20" would also
 * match "10x20".
 */
function escapeLikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const FROM_JOIN = Prisma.sql`
  FROM "SupplyLine" sl
  LEFT JOIN "TradeItem" ti ON ti."tradeItemId" = sl."tradeItemId"
  LEFT JOIN "Organization" o ON o."organizationId" = sl."supplierOrganizationId"
`;

/**
 * The WHERE clause shared by the line query and the summary. Both must agree on exactly
 * which rows a given filter selects - the summary's central guarantee (its groups sum to
 * the same total as the line list) only holds if they do.
 */
export function buildWhereClause(filters: SearchFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`sl."auctionDate" BETWEEN ${filters.range.from}::date AND ${filters.range.to}::date`,
  ];

  if (filters.locations.length > 0) {
    conditions.push(
      Prisma.sql`sl."initialAuctionLocation" = ANY(${filters.locations}::"AuctionLocation"[])`,
    );
  }

  if (filters.availableOnly) {
    conditions.push(Prisma.sql`sl."status" = 'AVAILABLE'::"SupplyStatus"`);
  }

  if (filters.search) {
    const pattern = `%${escapeLikeTerm(filters.search)}%`;
    conditions.push(Prisma.sql`(
      ti.name ILIKE ${pattern} ESCAPE '\\'
      OR o.name ILIKE ${pattern} ESCAPE '\\'
      OR sl."deliveryNoteReference" ILIKE ${pattern} ESCAPE '\\'
    )`);
  }

  return Prisma.join(conditions, " AND ");
}

export interface SupplyLinesPage {
  rows: SupplyLineRow[];
  total: number;
}

/**
 * One page of supply lines plus the total matching the same filters.
 *
 * Runs the page and the count as two separate queries rather than one windowed query.
 * The archive is fed by an hourly sync, not continuous writes, and this whole call
 * completes in well under a second, so the two numbers disagreeing requires a sync to
 * land rows in the exact instant between them - possible in principle, and at worst off
 * by a handful of rows for one request, self-correcting on the next. Not worth a
 * snapshot-isolated transaction for a read-only internal search screen.
 */
export async function fetchSupplyLines(filters: SearchFilters): Promise<SupplyLinesPage> {
  const where = buildWhereClause(filters);
  const orderColumn = Prisma.raw(sortColumnSql(filters.sort.column));
  const direction = Prisma.raw(filters.sort.direction === "desc" ? "DESC" : "ASC");
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.$queryRaw<SupplyLineRow[]>(Prisma.sql`
      SELECT
        sl."supplyLineId",
        sl."tradeItemId",
        ti.name AS "articleName",
        sl."supplierOrganizationId",
        o.name AS "growerName",
        sl."numberOfPieces",
        sl."pricePerPiece"::float AS "pricePerPiece",
        sl."currency",
        sl."auctionDate",
        sl."initialAuctionLocation",
        sl."deliveryNoteReference",
        sl."deliveryNoteCode",
        sl."status"
      ${FROM_JOIN}
      WHERE ${where}
      -- supplyLineId as a tiebreaker: without it, rows sharing the same sort value have no
      -- guaranteed order across two LIMIT/OFFSET calls, and paging could silently skip or
      -- repeat a row.
      ORDER BY ${orderColumn} ${direction} NULLS LAST, sl."supplyLineId" ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
    countSupplyLines(filters),
  ]);

  return { rows, total };
}

/** Only the count for the given filters - used on its own and internally by fetchSupplyLines. */
export async function countSupplyLines(filters: SearchFilters): Promise<number> {
  const where = buildWhereClause(filters);
  const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>(Prisma.sql`
    SELECT count(*)::bigint AS n ${FROM_JOIN} WHERE ${where}
  `);
  return Number(n);
}

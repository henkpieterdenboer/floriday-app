import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildWhereClause, FROM_JOIN } from "@/features/supply-search/queries";
import type { SearchFilters } from "@/features/supply-search/filters";
import {
  UNKNOWN_ARTICLE_LABEL,
  type PeriodGranularity,
  type SummaryAxis,
} from "@/features/supply-search/summary-types";

export type { PeriodGranularity, SummaryAxis } from "@/features/supply-search/summary-types";
export { UNKNOWN_ARTICLE_LABEL } from "@/features/supply-search/summary-types";

export interface SummaryGroup {
  key: string;
  label: string;
  lineCount: number;
  totalPieces: number;
  averagePrice: number;
  growerCount: number;
}

export interface SummaryResult {
  groups: SummaryGroup[];
  /** Grand total across every group, at the bottom of the table per the spec. */
  total: SummaryGroup;
}

interface RawGroupRow {
  key: string;
  label: string;
  lineCount: bigint;
  totalPieces: bigint | null;
  averagePrice: number | null;
  growerCount: bigint;
}

/**
 * The average is computed in SQL, not by averaging in JavaScript after pulling every
 * matching row. Verified against the real archive that the two give the same result
 * (pricePerPiece only ever has 4 decimal digits, well inside double-precision range for
 * a sum of thousands of them) - so this is purely about not dragging tens or hundreds of
 * thousands of rows to the application just to average them, which is what the "per
 * artikel over een heel jaar" axis would otherwise require.
 */
const AGGREGATES = Prisma.sql`
  count(*)::bigint AS "lineCount",
  coalesce(sum(sl."numberOfPieces"), 0)::bigint AS "totalPieces",
  coalesce(avg(sl."pricePerPiece"), 0)::float AS "averagePrice",
  count(distinct sl."supplierOrganizationId")::bigint AS "growerCount"
`;

function toGroup(row: RawGroupRow): SummaryGroup {
  return {
    key: row.key,
    label: row.label,
    lineCount: Number(row.lineCount),
    totalPieces: Number(row.totalPieces ?? 0),
    averagePrice: Number(row.averagePrice ?? 0),
    growerCount: Number(row.growerCount),
  };
}

async function fetchTotal(filters: SearchFilters): Promise<SummaryGroup> {
  const where = buildWhereClause(filters);
  const [row] = await prisma.$queryRaw<Omit<RawGroupRow, "key" | "label">[]>(Prisma.sql`
    SELECT ${AGGREGATES}
    ${FROM_JOIN}
    WHERE ${where}
  `);
  return toGroup({ ...row, key: "totaal", label: "Totaal" });
}

/**
 * date_trunc's first argument takes a normal text parameter here (not user input to begin
 * with - PeriodGranularity is a closed union checked by the compiler), so this binds like
 * any other value rather than needing sort.ts's raw-SQL-fragment whitelist treatment.
 *
 * Confirmed against the real database that date_trunc('week', ...) starts on Monday, the
 * same day date-presets.ts's startOfWeek uses - otherwise a week in this summary would not
 * be the same week as "deze week" in the filter bar.
 */
async function summarizeByPeriod(
  filters: SearchFilters,
  granularity: PeriodGranularity,
): Promise<SummaryGroup[]> {
  const where = buildWhereClause(filters);
  const rows = await prisma.$queryRaw<RawGroupRow[]>(Prisma.sql`
    SELECT
      to_char(date_trunc(${granularity}, sl."auctionDate"), 'YYYY-MM-DD') AS key,
      to_char(date_trunc(${granularity}, sl."auctionDate"), 'YYYY-MM-DD') AS label,
      ${AGGREGATES}
    ${FROM_JOIN}
    WHERE ${where}
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `);
  return rows.map(toGroup);
}

/**
 * Falls back to the id itself when the organization is missing or - found while writing
 * this, not assumed beforehand - has an empty string as its name: 34,461 of the 67,342
 * organizations in the real archive have `name = ''`, not NULL, so a plain `COALESCE`
 * against NULL alone left thousands of groups with an empty label. `NULLIF` treats both
 * the same.
 */
async function summarizeByGrower(filters: SearchFilters): Promise<SummaryGroup[]> {
  const where = buildWhereClause(filters);
  const rows = await prisma.$queryRaw<RawGroupRow[]>(Prisma.sql`
    SELECT
      sl."supplierOrganizationId" AS key,
      COALESCE(NULLIF(o.name, ''), sl."supplierOrganizationId"::text) AS label,
      ${AGGREGATES}
    ${FROM_JOIN}
    WHERE ${where}
    GROUP BY sl."supplierOrganizationId", o.name
    ORDER BY "lineCount" DESC
  `);
  return rows.map(toGroup);
}

/**
 * Groups by article name, per the spec's "Groepering: artikelnaam" - not by tradeItemId, so
 * two trade items that happen to share a name fall into one group. Lines with no trade item
 * at all (709 of them, see the plan) collapse into a single "(onbekend artikel)" group
 * instead of one group per missing id, and instead of being dropped.
 */
async function summarizeByArticle(filters: SearchFilters): Promise<SummaryGroup[]> {
  const where = buildWhereClause(filters);
  // Grouped on the normalised expression (not the raw ti.name column), so a missing trade
  // item (NULL, 709 lines archive-wide) and one with an empty-string name (3 trade items -
  // same real-data quirk as Organization.name, checked once this surfaced for grower) land
  // in the same "(onbekend artikel)" group instead of two visually-identical ones.
  const rows = await prisma.$queryRaw<RawGroupRow[]>(Prisma.sql`
    SELECT
      COALESCE(NULLIF(ti.name, ''), ${UNKNOWN_ARTICLE_LABEL}) AS key,
      COALESCE(NULLIF(ti.name, ''), ${UNKNOWN_ARTICLE_LABEL}) AS label,
      ${AGGREGATES}
    ${FROM_JOIN}
    WHERE ${where}
    GROUP BY 1, 2
    ORDER BY "lineCount" DESC
  `);
  return rows.map(toGroup);
}

async function summarizeByLocation(filters: SearchFilters): Promise<SummaryGroup[]> {
  const where = buildWhereClause(filters);
  const rows = await prisma.$queryRaw<RawGroupRow[]>(Prisma.sql`
    SELECT
      sl."initialAuctionLocation"::text AS key,
      sl."initialAuctionLocation"::text AS label,
      ${AGGREGATES}
    ${FROM_JOIN}
    WHERE ${where}
    GROUP BY sl."initialAuctionLocation"
    ORDER BY "lineCount" DESC
  `);
  return rows.map(toGroup);
}

/**
 * Summarises the same filtered set of lines as fetchSupplyLines, grouped along one of four
 * axes. Every group and the grand total share buildWhereClause with the line query, so a
 * group's lineCount summed across the whole result always equals the line list's total for
 * the same filters - if it did not, the summary would be lying, which the plan calls worse
 * than not having a summary at all.
 */
export async function summarize(
  filters: SearchFilters,
  axis: SummaryAxis,
  granularity: PeriodGranularity = "day",
): Promise<SummaryResult> {
  const groupsPromise =
    axis === "period"
      ? summarizeByPeriod(filters, granularity)
      : axis === "grower"
        ? summarizeByGrower(filters)
        : axis === "article"
          ? summarizeByArticle(filters)
          : summarizeByLocation(filters);

  const [groups, total] = await Promise.all([groupsPromise, fetchTotal(filters)]);
  return { groups, total };
}

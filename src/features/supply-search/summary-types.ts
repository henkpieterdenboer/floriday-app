/**
 * Pure types and constants shared between summary.ts (which also pulls in queries.ts and
 * the Prisma client - server-only) and view.ts (imported by client components such as
 * filter-bar.tsx). Kept in their own dependency-free module so a client component can use
 * the axis/granularity types and the UNKNOWN_ARTICLE_LABEL constant without a runtime import
 * chain dragging Prisma into the browser bundle.
 */

export type SummaryAxis = "period" | "grower" | "article" | "location";
export type PeriodGranularity = "day" | "week" | "month";

/** The label summarizeByArticle falls back to when a line has no trade item, or one with an
 * empty-string name. Shared so view.ts's isDrillableGroup and summary.ts's query agree on
 * the exact same string without one hardcoding a copy of the other's literal. */
export const UNKNOWN_ARTICLE_LABEL = "(onbekend artikel)";

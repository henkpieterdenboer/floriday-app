import type { AuctionLocation, SearchFilters } from "@/features/supply-search/filters";
import { filtersToSearchParams } from "@/features/supply-search/filters";
import {
  UNKNOWN_ARTICLE_LABEL,
  type PeriodGranularity,
  type SummaryAxis,
} from "@/features/supply-search/summary-types";

/**
 * Screen-level state that sits next to SearchFilters but is not part of it: which of the two
 * result shapes is showing, and (only meaningful for the summary) which axis and, for the
 * period axis, which granularity. Kept separate from filters.ts deliberately - that module
 * and its tests are already built and frozen for this task; view concerns get their own
 * small, equally pure module instead of growing SearchFilters's contract.
 */
export type ViewMode = "lines" | "summary";

export interface ViewState {
  mode: ViewMode;
  axis: SummaryAxis;
  granularity: PeriodGranularity;
}

const MODES: readonly ViewMode[] = ["lines", "summary"];
const AXES: readonly SummaryAxis[] = ["period", "grower", "article", "location"];
const GRANULARITIES: readonly PeriodGranularity[] = ["day", "week", "month"];

export const DEFAULT_VIEW: ViewState = { mode: "lines", axis: "period", granularity: "day" };

function isViewMode(value: string): value is ViewMode {
  return (MODES as readonly string[]).includes(value);
}
function isAxis(value: string): value is SummaryAxis {
  return (AXES as readonly string[]).includes(value);
}
function isGranularity(value: string): value is PeriodGranularity {
  return (GRANULARITIES as readonly string[]).includes(value);
}

/** Same safety posture as filters.ts's resolveSort: an unrecognised value always falls back
 * to the default, never throws. */
export function parseView(params: URLSearchParams): ViewState {
  const mode = params.get("view");
  const axis = params.get("axis");
  const granularity = params.get("granularity");

  return {
    mode: mode !== null && isViewMode(mode) ? mode : DEFAULT_VIEW.mode,
    axis: axis !== null && isAxis(axis) ? axis : DEFAULT_VIEW.axis,
    granularity: granularity !== null && isGranularity(granularity) ? granularity : DEFAULT_VIEW.granularity,
  };
}

export function viewToSearchParams(view: ViewState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("view", view.mode);
  params.set("axis", view.axis);
  params.set("granularity", view.granularity);
  return params;
}

/** Filters and view combined into the one href every link and redirect in this feature
 * points at, so a shared selection (lines or summary, any axis) reproduces exactly. */
export function buildHref(filters: SearchFilters, view: ViewState): string {
  const params = filtersToSearchParams(filters);
  for (const [key, value] of viewToSearchParams(view)) {
    params.set(key, value);
  }
  return `/aanbod?${params.toString()}`;
}

/** Midnight UTC of the same calendar day - mirrors date-presets.ts's startOfDay so a bucket
 * key round-trips through the same day boundary everywhere in this feature. */
function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const result = startOfDay(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Turns a summary bucket key (always "YYYY-MM-DD", see summary.ts's to_char) back into the
 * date range that bucket covers, for the period axis's drill-down. Mirrors
 * date-presets.ts's own week/month arithmetic (Monday-start weeks, day-0-of-next-month for
 * a month's last day) so a bucket you drilled into lands on the exact same range "deze
 * week"/"deze maand" would have produced for that date.
 */
export function bucketToRange(key: string, granularity: PeriodGranularity): { from: Date; to: Date } {
  const [year, month, day] = key.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));

  switch (granularity) {
    case "day":
      return { from: start, to: start };
    case "week":
      return { from: start, to: addDays(start, 6) };
    case "month": {
      const y = start.getUTCFullYear();
      const m = start.getUTCMonth();
      return { from: new Date(Date.UTC(y, m, 1)), to: new Date(Date.UTC(y, m + 1, 0)) };
    }
  }
}

interface DrillGroup {
  key: string;
  label: string;
}

/**
 * Whether clicking a summary row can sensibly become a filter. A grower group whose label
 * fell back to the raw id (summary.ts: COALESCE(NULLIF(o.name, ''), id) - key === label
 * exactly when that happens) or an article group labelled UNKNOWN_ARTICLE_LABEL has no real
 * name to search on: the free-text filter matches o.name/ti.name, never an id, so drilling
 * into such a group would silently produce zero rows instead of the group's own lines.
 * Article's key and label are the *same* expression even for a real name (unlike grower's),
 * so it needs the sentinel check rather than grower's key-vs-label comparison. Location and
 * period groups always drill cleanly - they use dedicated filter fields (locations, range)
 * rather than a name search.
 */
export function isDrillableGroup(axis: SummaryAxis, group: DrillGroup): boolean {
  if (axis === "grower") return group.key !== group.label;
  if (axis === "article") return group.label !== UNKNOWN_ARTICLE_LABEL;
  return true;
}

/**
 * "Klikken op een regel in de samenvatting zet die groep als extra filter en schakelt terug
 * naar de regels" (spec §6). Adds the group's dimension on top of the existing filters
 * rather than replacing them, and always resets to page 1 - the previous page number almost
 * certainly does not exist in the narrower result.
 */
export function drillDownFilters(
  filters: SearchFilters,
  axis: SummaryAxis,
  group: DrillGroup,
  granularity: PeriodGranularity,
): SearchFilters {
  const base: SearchFilters = { ...filters, page: 1 };

  switch (axis) {
    case "period":
      return { ...base, preset: "aangepast", range: bucketToRange(group.key, granularity) };
    case "location":
      return { ...base, locations: [group.key as AuctionLocation] };
    case "grower":
    case "article":
      return { ...base, search: group.label };
  }
}

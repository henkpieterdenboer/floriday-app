import { z } from "zod";
import { auctionLocationSchema } from "@/features/floriday/schemas/supply-line";
import { type DateRange, type PresetId, PRESETS, resolvePreset } from "@/features/supply-search/date-presets";
import { resolveSort, type SortState } from "@/features/supply-search/sort";

export type AuctionLocation = z.infer<typeof auctionLocationSchema>;

/** "aangepast" staat voor een handmatig gekozen bereik in plaats van een van de presets. */
export type DatePresetSelection = PresetId | "aangepast";

const PRESET_IDS: readonly PresetId[] = PRESETS.map((preset) => preset.id);
const DEFAULT_PRESET: PresetId = "komende-3-dagen";

export interface SearchFilters {
  preset: DatePresetSelection;
  range: DateRange;
  locations: AuctionLocation[];
  search: string;
  availableOnly: boolean;
  sort: SortState;
  page: number;
}

/** yyyy-mm-dd, geverifieerd op kalendarische geldigheid, als middernacht UTC. */
function parseIsoDate(value: string | null): Date | null {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC normaliseert een ongeldige dag (zoals 30 februari) in plaats van te falen -
  // deze vergelijking vangt dat alsnog af.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateFilter(
  params: URLSearchParams,
  now: Date,
): { preset: DatePresetSelection; range: DateRange } {
  const presetParam = params.get("preset");

  if (presetParam !== null && (PRESET_IDS as readonly string[]).includes(presetParam)) {
    const preset = presetParam as PresetId;
    return { preset, range: resolvePreset(preset, now) };
  }

  if (presetParam === "aangepast") {
    const from = parseIsoDate(params.get("from"));
    const to = parseIsoDate(params.get("to"));
    if (from !== null && to !== null && from.getTime() <= to.getTime()) {
      return { preset: "aangepast", range: { from, to } };
    }
  }

  return { preset: DEFAULT_PRESET, range: resolvePreset(DEFAULT_PRESET, now) };
}

function resolveLocations(params: URLSearchParams): AuctionLocation[] {
  const seen = new Set<AuctionLocation>();
  for (const value of params.getAll("location")) {
    const parsed = auctionLocationSchema.safeParse(value);
    if (parsed.success) seen.add(parsed.data);
  }
  return [...seen].sort();
}

function resolvePage(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return page >= 1 ? page : 1;
}

/** URLSearchParams in, een gevalideerd filterobject uit - nooit een fout, altijd een veilige standaard. */
export function parseFilters(params: URLSearchParams, now: Date): SearchFilters {
  const { preset, range } = resolveDateFilter(params, now);

  return {
    preset,
    range,
    locations: resolveLocations(params),
    search: (params.get("q") ?? "").trim(),
    availableOnly: params.get("availableOnly") === "true",
    sort: resolveSort(params.get("sort") ?? undefined, params.get("order") ?? undefined),
    page: resolvePage(params.get("page")),
  };
}

/** De heenweg terug: hetzelfde filterobject als URL-parameters, zodat een selectie deelbaar is. */
export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  params.set("preset", filters.preset);
  if (filters.preset === "aangepast") {
    params.set("from", isoDate(filters.range.from));
    params.set("to", isoDate(filters.range.to));
  }

  for (const location of filters.locations) params.append("location", location);
  if (filters.search) params.set("q", filters.search);
  if (filters.availableOnly) params.set("availableOnly", "true");

  params.set("sort", filters.sort.column);
  params.set("order", filters.sort.direction);
  params.set("page", String(filters.page));

  return params;
}

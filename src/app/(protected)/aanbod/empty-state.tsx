import Link from "next/link";
import type { SearchFilters } from "@/features/supply-search/filters";
import { formatRange } from "@/features/supply-search/date-presets";
import { buildHref, DEFAULT_VIEW, type ViewState } from "@/features/supply-search/view";

/**
 * "Een lege selectie zegt wat er is uitgefilterd en biedt aan het te verruimen" (spec §7) -
 * names the active filters instead of just saying "niets gevonden", and offers a widening
 * link per active dimension plus one that resets everything.
 */
export function EmptyState({ filters, view }: { filters: SearchFilters; view: ViewState }) {
  const widenLinks: { label: string; href: string }[] = [];

  if (filters.search) {
    widenLinks.push({
      label: `Wis zoekterm "${filters.search}"`,
      href: buildHref({ ...filters, search: "", page: 1 }, view),
    });
  }
  if (filters.locations.length > 0) {
    widenLinks.push({
      label: "Toon alle veillocaties",
      href: buildHref({ ...filters, locations: [], page: 1 }, view),
    });
  }
  if (filters.availableOnly) {
    widenLinks.push({
      label: "Toon ook niet-beschikbare regels",
      href: buildHref({ ...filters, availableOnly: false, page: 1 }, view),
    });
  }
  widenLinks.push({
    label: "Wis alle filters",
    href: buildHref(
      {
        preset: "komende-3-dagen",
        // Irrelevant here: filtersToSearchParams only serialises range for preset
        // "aangepast", so this value is never actually emitted into the URL.
        range: filters.range,
        locations: [],
        search: "",
        availableOnly: false,
        sort: filters.sort,
        page: 1,
      },
      DEFAULT_VIEW,
    ),
  });

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6 text-sm">
      <p>
        Geen aanbodregels gevonden voor periode <strong>{formatRange(filters.range)}</strong>
        {filters.locations.length > 0 ? (
          <>
            , locatie <strong>{filters.locations.join(", ")}</strong>
          </>
        ) : null}
        {filters.search ? (
          <>
            {" "}
            en zoekterm <strong>&quot;{filters.search}&quot;</strong>
          </>
        ) : null}
        {filters.availableOnly ? <> (alleen beschikbare regels)</> : null}.
      </p>
      <div className="flex flex-wrap gap-2">
        {widenLinks.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg border border-input px-2.5 py-1 hover:bg-muted">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

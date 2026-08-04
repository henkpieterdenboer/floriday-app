"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auctionLocationSchema } from "@/features/floriday/schemas/supply-line";
import type { AuctionLocation, SearchFilters } from "@/features/supply-search/filters";
import { PRESETS, formatRange, resolvePreset } from "@/features/supply-search/date-presets";
import { buildHref, type ViewState } from "@/features/supply-search/view";
import { cn } from "@/lib/utils";

const LOCATIONS = auctionLocationSchema.options;
const SEARCH_DEBOUNCE_MS = 300;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-sm transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * The filter bar. Every change here lands as a URL change - presets and toggles navigate via
 * plain <Link>s (no client state needed, works even before hydration finishes), the free
 * text search debounces through a ref-held timer into a router.push. Deliberately no
 * useEffect anywhere in this file: the one place state could drift from the `filters` prop
 * (the search box, if the URL changes from outside this component) is handled by remounting
 * the input via `key={filters.search}` with an uncontrolled `defaultValue`, not by an effect
 * that calls setState to resync - see the project's React 19 rule against setState directly
 * in an effect body.
 */
export function FilterBar({
  filters,
  view,
  now,
  alleenActievePeriode = false,
}: {
  filters: SearchFilters;
  view: ViewState;
  now: string;
  /**
   * Toont alleen de actieve periodeknop en verbergt de andere presets plus "Zelf kiezen".
   * Aangezet met ?eenvoudig=1 in de URL, bedoeld voor een schermafdruk waarop de app niet
   * meer moet laten zien dan het onderwerp van dat moment. Verandert niets aan de
   * filtering zelf: dezelfde URL zonder de parameter geeft hetzelfde resultaat met alle
   * knoppen erbij.
   */
  alleenActievePeriode?: boolean;
}) {
  const router = useRouter();
  const nowDate = new Date(now);

  const [customOpen, setCustomOpen] = useState(filters.preset === "aangepast");
  const [customFrom, setCustomFrom] = useState(isoDate(filters.range.from));
  const [customTo, setCustomTo] = useState(isoDate(filters.range.to));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function navigate(next: SearchFilters) {
    router.push(buildHref(next, view));
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ ...filters, search: value, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
  }

  function applyCustomRange() {
    const from = parseIsoDate(customFrom);
    const to = parseIsoDate(customTo);
    if (!from || !to || from.getTime() > to.getTime()) return;
    navigate({ ...filters, preset: "aangepast", range: { from, to }, page: 1 });
  }

  function toggleLocation(location: AuctionLocation): SearchFilters {
    const has = filters.locations.includes(location);
    const locations = has
      ? filters.locations.filter((candidate) => candidate !== location)
      : [...filters.locations, location];
    return { ...filters, locations, page: 1 };
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Periode">
        {PRESETS.filter((preset) => !alleenActievePeriode || filters.preset === preset.id).map((preset) => {
          const range = resolvePreset(preset.id, nowDate);
          const active = filters.preset === preset.id;
          return (
            <Link
              key={preset.id}
              href={buildHref({ ...filters, preset: preset.id, range, page: 1 }, view)}
              onClick={() => setCustomOpen(false)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted",
              )}
            >
              <span className="font-medium">{preset.label}</span>
              <span className={cn("text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {formatRange(range)}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setCustomOpen((open) => !open)}
          aria-pressed={filters.preset === "aangepast"}
          hidden={alleenActievePeriode && filters.preset !== "aangepast"}
          className={cn(
            "flex flex-col items-start rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
            alleenActievePeriode && filters.preset !== "aangepast" && "hidden",
            filters.preset === "aangepast"
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-muted",
          )}
        >
          <span className="font-medium">Zelf kiezen</span>
          <span
            className={cn(
              "text-xs",
              filters.preset === "aangepast" ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {filters.preset === "aangepast" ? formatRange(filters.range) : "Eigen bereik"}
          </span>
        </button>
      </div>

      {customOpen ? (
        <div className="flex flex-wrap items-end gap-2 border-t pt-3">
          <label className="flex flex-col gap-1 text-sm">
            Van
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tot en met
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            className="h-8 rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/80"
          >
            Toepassen
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        <input
          key={filters.search}
          type="search"
          defaultValue={filters.search}
          onChange={handleSearchChange}
          placeholder="Zoek op artikel, kweker of partijbrief..."
          aria-label="Vrij zoeken"
          className="h-8 w-72 max-w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Veillocatie">
          {LOCATIONS.map((location) => (
            <Chip
              key={location}
              href={buildHref(toggleLocation(location), view)}
              active={filters.locations.includes(location)}
            >
              {location}
            </Chip>
          ))}
        </div>

        <Chip
          href={buildHref({ ...filters, availableOnly: !filters.availableOnly, page: 1 }, view)}
          active={filters.availableOnly}
        >
          Alleen beschikbaar
        </Chip>
      </div>
    </div>
  );
}

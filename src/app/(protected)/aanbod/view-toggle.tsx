import Link from "next/link";
import type { SearchFilters } from "@/features/supply-search/filters";
import { buildHref, type ViewState } from "@/features/supply-search/view";
import { cn } from "@/lib/utils";

const AXIS_LABELS: Record<ViewState["axis"], string> = {
  period: "Tijdvak",
  grower: "Kweker",
  article: "Artikel",
  location: "Veillocatie",
};

const GRANULARITY_LABELS: Record<ViewState["granularity"], string> = {
  day: "Dag",
  week: "Week",
  month: "Maand",
};

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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
 * Server component - pure Links, no client JS. Switches between the line list and the
 * summary, and (only while summarising) which axis and, for the period axis, which
 * granularity to group by. Every option here already resets the page to 1 via buildHref,
 * since drillDownFilters and every filter link elsewhere in this feature do the same, and a
 * changed axis almost never has the same number of groups as before.
 */
export function ViewToggle({ filters, view }: { filters: SearchFilters; view: ViewState }) {
  const linesHref = buildHref({ ...filters, page: 1 }, { ...view, mode: "lines" });
  const summaryHref = buildHref({ ...filters, page: 1 }, { ...view, mode: "summary" });

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-1" role="group" aria-label="Weergave">
        <Pill href={linesHref} active={view.mode === "lines"}>
          Regels
        </Pill>
        <Pill href={summaryHref} active={view.mode === "summary"}>
          Samenvatting
        </Pill>
      </div>

      {view.mode === "summary" ? (
        <>
          <div className="flex items-center gap-1" role="group" aria-label="Groeperen op">
            <span className="mr-1 text-sm text-muted-foreground">Groeperen op:</span>
            {(Object.keys(AXIS_LABELS) as ViewState["axis"][]).map((axis) => (
              <Pill
                key={axis}
                href={buildHref({ ...filters, page: 1 }, { ...view, axis })}
                active={view.axis === axis}
              >
                {AXIS_LABELS[axis]}
              </Pill>
            ))}
          </div>

          {view.axis === "period" ? (
            <div className="flex items-center gap-1" role="group" aria-label="Periode-eenheid">
              {(Object.keys(GRANULARITY_LABELS) as ViewState["granularity"][]).map((granularity) => (
                <Pill
                  key={granularity}
                  href={buildHref({ ...filters, page: 1 }, { ...view, granularity })}
                  active={view.granularity === granularity}
                >
                  {GRANULARITY_LABELS[granularity]}
                </Pill>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { parseFilters } from "@/features/supply-search/filters";
import { fetchSupplyLines, type SupplyLineRow } from "@/features/supply-search/queries";
import { summarize } from "@/features/supply-search/summary";
import { parseView } from "@/features/supply-search/view";
import { FilterBar } from "./filter-bar";
import { ViewToggle } from "./view-toggle";
import { SupplyTable, type SupplyLineRowView } from "./supply-table";
import { SummaryTable } from "./summary-table";
import { Pagination } from "./pagination";
import { Freshness } from "./freshness";
import { EmptyState } from "./empty-state";

export const metadata: Metadata = { title: "Aanbod - Floriday Middleware" };

interface AanbodPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toURLSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else {
      params.append(key, value);
    }
  }
  return params;
}

/**
 * auctionDate crosses into the client SupplyTable as a plain "YYYY-MM-DD" string rather than
 * the Date instance queries.ts returns. Dates themselves serialise fine across the RSC
 * boundary, but formatting one consistently needs a fixed reference point regardless - doing
 * the Date -> string conversion once here, server-side, means the client component never
 * has to reason about which timezone `new Date(...)` would resolve in when the row later
 * turns it back into a Date purely for the Intl formatter (see supply-table.tsx).
 */
function mapRowForClient(row: SupplyLineRow): SupplyLineRowView {
  return { ...row, auctionDate: row.auctionDate.toISOString().slice(0, 10) };
}

export default async function AanbodPage({ searchParams }: AanbodPageProps) {
  const raw = await searchParams;
  const params = toURLSearchParams(raw);
  const now = new Date();

  // ?eenvoudig=1 laat het scherm alleen de gekozen periode zien, zonder de andere presets
  // en zonder de ondertitel. Puur weergave: dezelfde url zonder deze parameter geeft exact
  // dezelfde resultaten, met alles erbij. Bedoeld voor schermafdrukken.
  const eenvoudig = raw.eenvoudig === "1";

  const filters = parseFilters(params, now);
  const view = parseView(params);

  // Only the query the current view actually needs runs - switching to summary never also
  // pages through fifty lines it will not render, and vice versa.
  const linesResult = view.mode === "lines" ? await fetchSupplyLines(filters) : null;
  const summaryResult = view.mode === "summary" ? await summarize(filters, view.axis, view.granularity) : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Aanbod</h1>
        {/* Weggelaten in de eenvoudige weergave: "gearchiveerde" zegt meer over wat dit
            scherm achter zich heeft staan dan op een schermafdruk hoeft te staan. */}
        {eenvoudig ? null : (
          <p className="text-sm text-muted-foreground">
            Doorzoek het gearchiveerde klokvoorverkoop-aanbod.
          </p>
        )}
      </div>

      <Freshness />

      <FilterBar filters={filters} view={view} now={now.toISOString()} alleenActievePeriode={eenvoudig} />

      <ViewToggle filters={filters} view={view} />

      {view.mode === "lines" && linesResult ? (
        linesResult.rows.length > 0 ? (
          <>
            <SupplyTable rows={linesResult.rows.map(mapRowForClient)} filters={filters} view={view} />
            <Pagination filters={filters} view={view} total={linesResult.total} />
          </>
        ) : (
          <EmptyState filters={filters} view={view} />
        )
      ) : null}

      {view.mode === "summary" && summaryResult ? (
        summaryResult.groups.length > 0 ? (
          <SummaryTable result={summaryResult} filters={filters} view={view} />
        ) : (
          <EmptyState filters={filters} view={view} />
        )
      ) : null}
    </div>
  );
}

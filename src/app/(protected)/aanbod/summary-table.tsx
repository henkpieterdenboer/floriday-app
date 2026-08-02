import Link from "next/link";
import type { SearchFilters } from "@/features/supply-search/filters";
import type { SummaryResult } from "@/features/supply-search/summary";
import { buildHref, drillDownFilters, isDrillableGroup, type ViewState } from "@/features/supply-search/view";
import { formatInteger, formatPrice } from "@/features/supply-search/format";

const AXIS_COLUMN_LABEL: Record<ViewState["axis"], string> = {
  period: "Periode",
  grower: "Kweker",
  article: "Artikel",
  location: "Veillocatie",
};

/**
 * Server component - the only interaction is drilling into a row, which is a plain link to
 * a new URL (drillDownFilters + buildHref), not a client event handler. See view.ts for why
 * a grower/article row whose label fell back to a raw id is rendered as plain text instead
 * of a link: the free-text filter searches names, never ids, so that click would silently
 * land on zero rows.
 */
export function SummaryTable({
  result,
  filters,
  view,
}: {
  result: SummaryResult;
  filters: SearchFilters;
  view: ViewState;
}) {
  // Every currency in the filtered set should be the same (EUR throughout the archive so
  // far), but the total's average price has no single row to borrow a currency from, so it
  // falls back to EUR rather than guessing wrong silently.
  const currency = "EUR";

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">{AXIS_COLUMN_LABEL[view.axis]}</th>
            <th className="px-3 py-2 font-medium text-right">Aantal regels</th>
            <th className="px-3 py-2 font-medium text-right">Totaal stuks</th>
            <th className="px-3 py-2 font-medium text-right">Gemiddelde prijs</th>
            <th className="px-3 py-2 font-medium text-right">Aantal kwekers</th>
          </tr>
        </thead>
        <tbody>
          {result.groups.map((group) => {
            const drillable = isDrillableGroup(view.axis, group);
            const label = drillable ? (
              <Link
                href={buildHref(drillDownFilters(filters, view.axis, group, view.granularity), {
                  ...view,
                  mode: "lines",
                })}
                className="hover:underline"
              >
                {group.label}
              </Link>
            ) : (
              <span className="text-muted-foreground italic" title="Geen naam bekend om op te filteren">
                {group.label}
              </span>
            );

            return (
              <tr key={group.key} className="border-t">
                <td className="px-3 py-2">{label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatInteger(group.lineCount)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatInteger(group.totalPieces)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatPrice(group.averagePrice, currency)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatInteger(group.growerCount)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-medium">
            <td className="px-3 py-2">{result.total.label}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatInteger(result.total.lineCount)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatInteger(result.total.totalPieces)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatPrice(result.total.averagePrice, currency)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatInteger(result.total.growerCount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

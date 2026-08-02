"use client";

import Link from "next/link";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { AuctionLocation, SearchFilters } from "@/features/supply-search/filters";
import type { SortColumn } from "@/features/supply-search/sort";
import { buildHref, type ViewState } from "@/features/supply-search/view";
import { formatDate, formatInteger, formatPrice } from "@/features/supply-search/format";

/**
 * Client-safe shape of SupplyLineRow: auctionDate crosses the server/client boundary as a
 * plain "YYYY-MM-DD" string rather than a Date instance. Dates survive the RSC boundary
 * fine on their own, but formatting them consistently needs a fixed timezone either way, so
 * converting once on the server (see page.tsx's mapRowForClient) and treating it as an
 * opaque string here removes any doubt about which timezone new Date(row.auctionDate) would
 * resolve in in the browser.
 */
export interface SupplyLineRowView {
  supplyLineId: string;
  tradeItemId: string;
  articleName: string | null;
  supplierOrganizationId: string;
  growerName: string | null;
  numberOfPieces: number;
  pricePerPiece: number;
  currency: string;
  auctionDate: string;
  initialAuctionLocation: AuctionLocation;
  deliveryNoteReference: string | null;
  deliveryNoteCode: string | null;
  status: "AVAILABLE" | "UNAVAILABLE";
}

const columnHelper = createColumnHelper<SupplyLineRowView>();

/** Muted id fallback for a missing name, so a missing article/grower reads as "unknown"
 * rather than an empty cell that looks like the row is broken (709 lines archive-wide have
 * no article; growers can be missing for the same reason). */
function NameOrId({ name, id }: { name: string | null; id: string }) {
  if (name && name.length > 0) return <span>{name}</span>;
  return <span className="text-muted-foreground italic">{id}</span>;
}

const columns = [
  columnHelper.accessor("articleName", {
    id: "articleName" satisfies SortColumn,
    header: "Artikel",
    cell: (info) => <NameOrId name={info.getValue()} id={info.row.original.tradeItemId} />,
  }),
  columnHelper.accessor("growerName", {
    id: "growerName" satisfies SortColumn,
    header: "Kweker",
    cell: (info) => <NameOrId name={info.getValue()} id={info.row.original.supplierOrganizationId} />,
  }),
  columnHelper.accessor("numberOfPieces", {
    id: "numberOfPieces" satisfies SortColumn,
    header: "Stuks",
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="tabular-nums">
          {formatInteger(info.getValue())}
          {/* 349 real lines have a negative aantal, all UNAVAILABLE - plausibly a correction
              in the Floriday-feed. A short note instead of pretending it's a normal count. */}
          {row.status === "UNAVAILABLE" && info.getValue() < 0 ? (
            <span className="ml-1 text-xs text-muted-foreground">(correctie)</span>
          ) : null}
        </span>
      );
    },
  }),
  columnHelper.accessor("pricePerPiece", {
    id: "pricePerPiece" satisfies SortColumn,
    header: "Prijs per stuk",
    cell: (info) => (
      <span className="tabular-nums">{formatPrice(info.getValue(), info.row.original.currency)}</span>
    ),
  }),
  columnHelper.accessor("auctionDate", {
    id: "auctionDate" satisfies SortColumn,
    header: "Veildatum",
    cell: (info) => formatDate(new Date(`${info.getValue()}T00:00:00.000Z`)),
  }),
  columnHelper.accessor("initialAuctionLocation", {
    id: "location" satisfies SortColumn,
    header: "Locatie",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("deliveryNoteReference", {
    id: "deliveryNoteReference" satisfies SortColumn,
    header: "Partijbrief",
    // Truthy check, not `?? `: an empty string is falsy but not null/undefined, and ??
    // would let it through as a blank cell that reads as broken rather than "no reference"
    // - the same empty-string-instead-of-null trap the plan documents for Organization.name.
    cell: (info) => {
      const value = info.getValue();
      return value ? value : <span className="text-muted-foreground">-</span>;
    },
  }),
];

function SortIndicator({ direction }: { direction: "asc" | "desc" | false }) {
  if (direction === "asc") return <span aria-hidden>&uarr;</span>;
  if (direction === "desc") return <span aria-hidden>&darr;</span>;
  return null;
}

export function SupplyTable({
  rows,
  filters,
  view,
}: {
  rows: SupplyLineRowView[];
  filters: SearchFilters;
  view: ViewState;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Sorting is resolved by the database against the URL's sort/order params, never in the
    // browser - the grid only ever holds one page of fifty out of possibly thousands of
    // rows. This state exists purely so the header can show which column is active.
    manualSorting: true,
    state: {
      sorting: [{ id: filters.sort.column, desc: filters.sort.direction === "desc" }],
    },
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id as SortColumn;
                const isActive = filters.sort.column === columnId;
                const nextDirection = isActive && filters.sort.direction === "asc" ? "desc" : "asc";
                const href = buildHref(
                  { ...filters, sort: { column: columnId, direction: nextDirection }, page: 1 },
                  view,
                );

                return (
                  <th key={header.id} className="px-3 py-2 font-medium">
                    <Link href={href} className="inline-flex items-center gap-1 hover:text-foreground">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIndicator direction={isActive ? filters.sort.direction : false} />
                    </Link>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

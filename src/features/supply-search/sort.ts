/**
 * Toegestane sorteerkolommen voor het aanbod-overzicht.
 *
 * Beveiligingsgrens: `sortColumnSql` levert de kant-en-klare SQL-uitdrukking voor een
 * kolom, en die uitdrukking komt uitsluitend uit deze vaste tabel. Een waarde uit de URL
 * bepaalt hoogstens welke sleutel van de tabel wordt opgezocht (via `resolveSort`, dat een
 * onbekende sleutel altijd naar de standaard laat terugvallen) - hij komt nooit als string
 * in de query terecht. `queries.ts`/`summary.ts` mogen de teruggegeven SQL daarom direct in
 * rauwe SQL plakken.
 */

export type SortColumn =
  | "auctionDate"
  | "articleName"
  | "growerName"
  | "numberOfPieces"
  | "pricePerPiece"
  | "location"
  | "deliveryNoteReference";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

/** sql: de exacte, hardcoded kolomverwijzing die in de query mag verschijnen. */
const SORT_DEFS: Record<SortColumn, { sql: string }> = {
  auctionDate: { sql: `sl."auctionDate"` },
  articleName: { sql: `ti.name` },
  growerName: { sql: `o.name` },
  numberOfPieces: { sql: `sl."numberOfPieces"` },
  pricePerPiece: { sql: `sl."pricePerPiece"` },
  location: { sql: `sl."initialAuctionLocation"` },
  deliveryNoteReference: { sql: `sl."deliveryNoteReference"` },
};

export const SORT_COLUMNS: readonly SortColumn[] = Object.keys(SORT_DEFS) as SortColumn[];

export const DEFAULT_SORT: SortState = { column: "auctionDate", direction: "asc" };

function isSortColumn(value: string): value is SortColumn {
  return (SORT_COLUMNS as readonly string[]).includes(value);
}

/** Een URL-waarde erin, een veilige sorteerstand eruit - nooit een fout, altijd een terugval. */
export function resolveSort(column: string | undefined, direction: string | undefined): SortState {
  return {
    column: column !== undefined && isSortColumn(column) ? column : DEFAULT_SORT.column,
    direction: direction === "asc" || direction === "desc" ? direction : DEFAULT_SORT.direction,
  };
}

/** De vaste SQL-uitdrukking voor een kolom uit de whitelist. */
export function sortColumnSql(column: SortColumn): string {
  return SORT_DEFS[column].sql;
}

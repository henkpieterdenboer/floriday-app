/**
 * Dutch-locale display formatting, shared by the server-rendered summary and the client
 * table. Always pinned to "nl-NL" and, where a date is involved, to UTC - the same
 * discipline as date-presets.ts, so a formatted date never drifts a day depending on which
 * timezone the Node process or the browser happens to run in.
 */

/** "1.234.567" - and "-98.200" unchanged: the archive has 349 real lines with a negative
 * numberOfPieces (down to -98.200, all UNAVAILABLE), plausibly corrections in the Floriday
 * feed. This must not be dressed up as if counts are always positive. */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(value);
}

/** "€ 1,50". Falls back to a plain "amount CODE" string for a currency code Intl does not
 * recognise, rather than throwing and taking the whole row down with it. */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** "5 aug. 2026" - a compact form for a table column, in UTC like every other date in this
 * feature (auctionDate is a timezone-less database date). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

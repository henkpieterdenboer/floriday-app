/**
 * The scope, as a filter value. "1" is (Snij)bloemen; "2" is Kamerplanten and "3" is
 * Tuinplanten, both deliberately out of scope (spec §1). The filter key and the record's
 * mainGroupCode are the same text.
 */
export const SNIJBLOEMEN_HOOFDGROEP = "1";

/**
 * The auction locations to slice on, hard-coded on purpose.
 *
 * The facet list in the response cannot be used for this: measured on 6 August 2026 it
 * offered only NAALDWIJK for a day that demonstrably held three locations (spec §3.6b).
 * Discovering slices from it would silently drop most of the supply.
 *
 * Uppercase, because that is what the filter takes. The record's own auctionLocation field
 * spells it "Naaldwijk" - do not compare the two without normalising.
 */
export const VEILLOCATIE_SLEUTELS = [
  "AALSMEER",
  "NAALDWIJK",
  "RIJNSBURG",
  "EELDE",
  "PLANTION",
  "RHEINMAAS",
  "DIGITAL",
] as const;

export type VeillocatieSleutel = (typeof VEILLOCATIE_SLEUTELS)[number];

export interface Snede {
  auctionDate: string;
  auctionLocationKey: VeillocatieSleutel;
}

/**
 * Every slice one run walks. Unused locations answer with zero rather than an error, so
 * asking for all seven costs six cheap requests a day and removes the need to know in
 * advance which locations are in play.
 */
export function snedenVoor(veildagen: readonly string[]): Snede[] {
  return veildagen.flatMap((auctionDate) =>
    VEILLOCATIE_SLEUTELS.map((auctionLocationKey) => ({ auctionDate, auctionLocationKey })),
  );
}

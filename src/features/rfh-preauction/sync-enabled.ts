import { getEnv } from "@/lib/env";

/**
 * Of de synchronisatie van het klokaanbod mag draaien in deze omgeving.
 *
 * Standaard aan. Zet `CLOCK_SYNC_ENABLED=false` om hem stil te leggen.
 *
 * Eigen schakelaar, los van `SYNC_ENABLED` (zie src/features/floriday/sync-enabled.ts) - en
 * bewust niet in die map, want het klokaanbod praat met RFH, niet met Floriday. `SYNC_ENABLED`
 * bestaat om de Floriday-cron stil te houden zolang de Floriday-productiecredentials er niet
 * zijn; die reden raakt het klokaanbod niet. Eén gedeelde vlag zou betekenen dat je het
 * klokaanbod pas kunt vrijgeven door de Floriday-cron óók weer aan te zetten - en die blijft
 * dan elke vijf minuten falen op `invalid_client`, precies het lawaai waarvoor `SYNC_ENABLED`
 * ooit is gemaakt.
 */
export function isClockSyncEnabled(): boolean {
  return getEnv().CLOCK_SYNC_ENABLED !== "false";
}

/** De uitleg die een overgeslagen run teruggeeft, zodat het antwoord zichzelf verklaart. */
export const CLOCK_SYNC_DISABLED_MESSAGE =
  "Synchronisatie van het klokaanbod staat uit in deze omgeving (CLOCK_SYNC_ENABLED=false). " +
  "Zet de variabele op true, of verwijder hem, om de synchronisatie te hervatten.";

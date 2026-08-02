import { getEnv } from "@/lib/env";

/**
 * Of de synchronisatie mag draaien in deze omgeving.
 *
 * Standaard aan. Zet `SYNC_ENABLED=false` om hem stil te leggen.
 *
 * Waarom dit bestaat: een omgeving die nog niet is ingericht hoort niet elk uur te falen
 * alsof er iets kapot is. Toen de productie-deployment live ging zonder Floriday-
 * credentials, liep de uurlijkse cron zeven keer op een `invalid_client` van de
 * tokenserver. Dat is geen storing maar een omgeving die nog wacht op gegevens, en het
 * verschil daartussen hoort zichtbaar te zijn — anders went het falen en valt een echte
 * storing later niet meer op.
 *
 * Ook bruikbaar om de synchronisatie tijdelijk stil te leggen, bijvoorbeeld tijdens
 * onderhoud aan de database of als Floriday zelf uit de lucht is.
 */
export function isSyncEnabled(): boolean {
  return getEnv().SYNC_ENABLED !== "false";
}

/** De uitleg die een overgeslagen run teruggeeft, zodat het antwoord zichzelf verklaart. */
export const SYNC_DISABLED_MESSAGE =
  "Synchronisatie staat uit in deze omgeving (SYNC_ENABLED=false). " +
  "Zet de variabele op true zodra de Floriday-gegevens zijn ingevuld.";

/**
 * Hoe vaak er werkelijk gesynchroniseerd wordt, instelbaar zonder nieuwe deploy.
 *
 * Vercel legt zijn cronschema vast bij het deployen; dat is runtime niet te wijzigen. In
 * plaats daarvan draait de geplande taak op zijn kortste zinvolle interval en beslist de
 * route zelf of er iets te doen valt: is de vorige geslaagde run korter geleden dan het
 * ingestelde interval, dan slaat hij over. Zo stuurt deze instelling de feitelijke
 * frequentie, terwijl het cronschema onaangeroerd blijft.
 *
 * Meteen ook wat Floriday zelf adviseert: niet op een vaste kloktijd pieken maar de cyclus
 * laten afhangen van wanneer de vorige klaar was.
 *
 * Dit bestand raakt bewust geen database aan. De keuzelijst op de statuspagina is een
 * client component en importeert KEUZES; zou hier `prisma` staan, dan reist de Prisma-client
 * mee naar de browser en valt de pagina om op een ontbrekende DATABASE_URL. Het lezen en
 * schrijven staat daarom in interval-store.ts.
 */

export const INTERVAL_SLEUTEL = "sync.interval.minuten";

/**
 * Eén minuut is de ondergrens, want dat is ook wat het cronschema aankan - vaker vragen dan
 * de taak langskomt heeft geen effect. Het is meteen wat Floriday adviseert: *"we recommend
 * syncing data such as supply lines at least every minute"*.
 */
export const MINIMUM_INTERVAL = 1;

/** Een etmaal. Wie langer wil wachten kan de synchronisatie beter uitzetten. */
export const MAXIMUM_INTERVAL = 1440;

export const STANDAARD_INTERVAL = 5;

export function isGeldigInterval(waarde: number): boolean {
  return (
    Number.isInteger(waarde) && waarde >= MINIMUM_INTERVAL && waarde <= MAXIMUM_INTERVAL
  );
}

/** "elke minuut", "elke 5 minuten", "elk uur", "elke 2 uur". */
export function beschrijfInterval(minuten: number): string {
  if (minuten === 1) return "elke minuut";
  if (minuten < 60) return `elke ${minuten} minuten`;
  if (minuten === 60) return "elk uur";
  if (minuten % 60 === 0) return `elke ${minuten / 60} uur`;
  return `elke ${minuten} minuten`;
}

/**
 * Speling omdat een cron zelden op de seconde afgaat.
 *
 * Zonder die marge zou een taak die 4 minuut 59 na de vorige binnenkomt overslaan en pas
 * bij de volgende slag aan de beurt zijn - waarmee een interval van vijf minuten er
 * stilzwijgend tien wordt. Nooit meer dan de helft van het interval, anders zou hij bij een
 * ingestelde minuut al na dertig seconden mogen en betekent de instelling niets meer.
 */
export const MARGE_SECONDEN = 30;

function marge(intervalMinuten: number): number {
  return Math.min(MARGE_SECONDEN, (intervalMinuten * 60) / 2);
}

export function magNuSynchroniseren(
  laatsteGeslaagdeRun: Date | null,
  intervalMinuten: number,
  nu: Date,
): boolean {
  if (laatsteGeslaagdeRun === null) return true;
  const secondenGeleden = (nu.getTime() - laatsteGeslaagdeRun.getTime()) / 1000;
  return secondenGeleden >= intervalMinuten * 60 - marge(intervalMinuten);
}

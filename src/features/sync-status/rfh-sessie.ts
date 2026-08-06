/**
 * The RFH session's health for the status page.
 *
 * Pure function, same shape as health.ts: an oordeel a test can pin down without touching the
 * database. This feed's failure mode is silence rather than an explicit error - it walks
 * auction days and has no max-sequence endpoint to prove it is caught up - so a session that
 * simply stopped refreshing needs its own state instead of quietly reading as healthy.
 */

import type { RfhSessie } from "@/features/rfh-preauction/client/session-store";

export type SessieToestand = "niet-beschikbaar" | "niet-gekoppeld" | "verlopen" | "verouderd" | "goed";

export interface SessieOordeel {
  toestand: SessieToestand;
  bericht: string;
}

/**
 * How long without a successful refresh before the session counts as stale.
 *
 * The sync runs every five minutes and refreshes at least hourly, so a day of silence means
 * something stopped - the cron, the environment, or the coupling - even though nothing has
 * reported an error yet. Silence is the failure mode this feed is most exposed to: a missed
 * auction day cannot be fetched again.
 */
const VEROUDERD_NA_UREN = 24;

export function beoordeelSessie(sessie: RfhSessie | null | undefined, nu: Date): SessieOordeel {
  // undefined - niet null - staat voor "de RfhSession-tabel bestaat hier nog niet". Dat is
  // geen ongekoppelde omgeving maar een omgeving die de schema-push nog moet krijgen; die
  // twee lopen door elkaar heen als hier niet expliciet onderscheiden wordt (zie
  // session-store.ts, leesSessie).
  if (sessie === undefined) {
    return {
      toestand: "niet-beschikbaar",
      bericht:
        "RFH Pre-Auction is hier nog niet beschikbaar: de database mist de RfhSession-tabel. " +
        "Draai `npm run db:push` voordat dit op deze omgeving uitgerold wordt.",
    };
  }

  if (!sessie) {
    return {
      toestand: "niet-gekoppeld",
      bericht: "RFH Pre-Auction is nog niet gekoppeld.",
    };
  }

  if (sessie.lastError) {
    return {
      toestand: "verlopen",
      bericht:
        "RFH-sessie verlopen, opnieuw koppelen. " +
        `Laatste fout: ${sessie.lastError}`,
    };
  }

  const laatst = sessie.lastRefreshedAt;
  if (!laatst || nu.getTime() - laatst.getTime() > VEROUDERD_NA_UREN * 3_600_000) {
    return {
      toestand: "verouderd",
      bericht: `Geen geslaagde vernieuwing sinds ${laatst?.toISOString() ?? "de koppeling"}.`,
    };
  }

  return { toestand: "goed", bericht: "RFH-sessie is in orde." };
}

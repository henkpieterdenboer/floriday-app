/**
 * Het stoplicht op de statuspagina.
 *
 * Pure functie, los van de database, zodat elk oordeel in een test vast te leggen is. De
 * pagina laat een kleur zien en die kleur moet kloppen ook als niemand hem naleest.
 */

export type Stoplicht = "groen" | "oranje" | "rood";

export interface SyncGezondheid {
  kleur: Stoplicht;
  /** Eén zin, bedoeld om zo op het scherm te zetten. */
  kop: string;
  /** Waarom het die kleur is. Leeg bij groen: dan spreekt de kop voor zich. */
  toelichting: string;
}

export interface GezondheidInvoer {
  /** Afronding van de laatste geslaagde run, of null als die er nooit was. */
  laatsteGeslaagdeRun: Date | null;
  /** Status van de meest recente run, ongeacht uitkomst. */
  laatsteStatus: "SUCCEEDED" | "FAILED" | "RUNNING" | null;
  /** Waarschuwing van de laatste run; een geslaagde run kan er een dragen. */
  waarschuwing: string | null;
  /**
   * Of de cursor de bovengrens van de feed haalde. `null` betekent niet gemeten - dat is
   * iets anders dan achterlopen en mag dus geen rood geven.
   */
  bijgewerkt: boolean | null;
  nu: Date;
}

/**
 * Hoe lang na de laatste geslaagde synchronisatie het nog groen is.
 *
 * De cron draait elke vijf minuten. Vier gemiste slagen is ruim genoeg om een trage run of
 * een enkele hapering niet als storing te tonen, en kort genoeg om een stilgevallen
 * synchronisatie binnen het halfuur te zien.
 */
export const GROEN_TOT_MINUTEN = 20;

/** Daarboven is het niet meer "loopt even achter" maar "er is iets mis". */
export const ROOD_VANAF_UREN = 3;

function minutenGeleden(vanaf: Date, nu: Date): number {
  return (nu.getTime() - vanaf.getTime()) / 60_000;
}

export function beoordeelSync(invoer: GezondheidInvoer): SyncGezondheid {
  const { laatsteGeslaagdeRun, laatsteStatus, waarschuwing, bijgewerkt, nu } = invoer;

  if (laatsteStatus === null || laatsteGeslaagdeRun === null) {
    return {
      kleur: "rood",
      kop: "Nog niet gesynchroniseerd",
      toelichting:
        "Er is nog geen geslaagde synchronisatie geweest. Controleer of de Floriday-gegevens " +
        "zijn ingesteld en of de geplande taak draait.",
    };
  }

  const minuten = minutenGeleden(laatsteGeslaagdeRun, nu);

  // Een mislukte laatste poging weegt zwaarder dan een geslaagde ervoor: het archief loopt
  // vanaf nu achter, ook al staat er iets recents in.
  if (laatsteStatus === "FAILED") {
    return {
      kleur: "rood",
      kop: "Laatste synchronisatie mislukt",
      toelichting:
        `De vorige geslaagde run was ${beschrijfDuur(minuten)} geleden. ` +
        "Zolang dit aanhoudt komt er geen nieuw aanbod binnen.",
    };
  }

  if (minuten > ROOD_VANAF_UREN * 60) {
    return {
      kleur: "rood",
      kop: "Synchronisatie ligt stil",
      toelichting:
        `De laatste geslaagde run was ${beschrijfDuur(minuten)} geleden, terwijl er elke ` +
        "vijf minuten een hoort te draaien.",
    };
  }

  if (minuten > GROEN_TOT_MINUTEN) {
    return {
      kleur: "oranje",
      kop: "Synchronisatie loopt achter",
      toelichting:
        `De laatste geslaagde run was ${beschrijfDuur(minuten)} geleden. ` +
        "Er hoort er elke vijf minuten een te draaien.",
    };
  }

  // Alleen een gemeten achterstand telt. Niet-gemeten (null) is geen achterstand.
  if (bijgewerkt === false) {
    return {
      kleur: "oranje",
      kop: "Nog niet volledig bijgewerkt",
      toelichting:
        "De laatste run is geslaagd, maar het archief staat nog niet op het hoogste " +
        "volgnummer van Floriday. De volgende run haalt dat normaal gesproken in.",
    };
  }

  if (waarschuwing !== null && waarschuwing !== "") {
    return {
      kleur: "oranje",
      kop: "Gesynchroniseerd, met een kanttekening",
      toelichting: waarschuwing,
    };
  }

  if (laatsteStatus === "RUNNING") {
    return {
      kleur: "groen",
      kop: "Synchronisatie loopt",
      toelichting: "",
    };
  }

  return {
    kleur: "groen",
    kop: "Synchronisatie werkt",
    toelichting: "",
  };
}

/** "3 minuten", "2 uur", "4 dagen" - genoeg om te oordelen, zonder schijnprecisie. */
export function beschrijfDuur(minuten: number): string {
  const afgerond = Math.floor(minuten);
  if (afgerond < 1) return "nog geen minuut";
  if (afgerond === 1) return "1 minuut";
  if (afgerond < 60) return `${afgerond} minuten`;

  const uren = Math.floor(afgerond / 60);
  if (uren === 1) return "ruim een uur";
  if (uren < 24) return `${uren} uur`;

  const dagen = Math.floor(uren / 24);
  return dagen === 1 ? "een dag" : `${dagen} dagen`;
}

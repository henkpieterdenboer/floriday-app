/**
 * Het stoplicht op de statuspagina.
 *
 * Pure functie, los van de database, zodat elk oordeel in een test vast te leggen is. De
 * pagina laat een kleur zien en die kleur moet kloppen ook als niemand hem naleest.
 */

import { beschrijfInterval } from "@/features/sync-status/interval";

export type Stoplicht = "groen" | "oranje" | "rood";

export interface SyncGezondheid {
  kleur: Stoplicht;
  /** Eén zin, bedoeld om zo op het scherm te zetten. */
  kop: string;
  /** Waarom het die kleur is. Leeg bij groen: dan spreekt de kop voor zich. */
  toelichting: string;
}

export interface GezondheidInvoer {
  /**
   * Staat de synchronisatie aan (SYNC_ENABLED)? Staat hij uit, dan slaat de geplande taak
   * over zonder iets te loggen - dan is een leeg overzicht geen storing maar een keuze.
   */
  synchronisatieAan: boolean;
  /** Floriday-instellingen die leeg zijn. Zonder die gegevens kan er niets opgehaald worden. */
  ontbrekendeInstellingen: string[];
  /** Het ingestelde aantal minuten tussen twee synchronisaties, voor in de melding. */
  intervalMinuten: number;
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
 * Bewust een vaste grens en niet een veelvoud van het ingestelde interval: bij een interval
 * van een minuut zou dat na twee minuten al alarm slaan, en dat is geen storing maar een
 * trage cyclus. Twintig minuten is ruim genoeg om een hapering te laten passeren en kort
 * genoeg om een stilgevallen synchronisatie binnen het halfuur te zien.
 */
export const GROEN_TOT_MINUTEN = 20;

/** Daarboven is het niet meer "loopt even achter" maar "er is iets mis". */
export const ROOD_VANAF_UREN = 3;

function minutenGeleden(vanaf: Date, nu: Date): number {
  return (nu.getTime() - vanaf.getTime()) / 60_000;
}

export function beoordeelSync(invoer: GezondheidInvoer): SyncGezondheid {
  const {
    synchronisatieAan,
    ontbrekendeInstellingen,
    intervalMinuten,
    laatsteGeslaagdeRun,
    laatsteStatus,
    waarschuwing,
    bijgewerkt,
    nu,
  } = invoer;

  // Eerst wat de instellingen zeggen, dan pas wat de runs zeggen. Een omgeving die niet is
  // ingericht hoort te lezen als "nog niet ingericht", niet als "kapot" - dat scheelt zoeken
  // in de verkeerde hoek.
  if (ontbrekendeInstellingen.length > 0) {
    const lijst = ontbrekendeInstellingen.join(", ");
    return {
      kleur: "rood",
      kop: "Floriday-gegevens ontbreken",
      toelichting:
        `Deze omgeving mist ${ontbrekendeInstellingen.length === 1 ? "de instelling" : "de instellingen"} ` +
        `${lijst}. Zonder die gegevens kan er niets opgehaald worden; de rest van de ` +
        `applicatie werkt wel.`,
    };
  }

  if (!synchronisatieAan) {
    return {
      kleur: "oranje",
      kop: "Synchronisatie staat uit",
      toelichting:
        "SYNC_ENABLED staat op false, dus de geplande taak slaat elke keer over zonder iets " +
        "te doen. Zet de variabele op true om weer op te halen.",
    };
  }

  if (laatsteStatus === null || laatsteGeslaagdeRun === null) {
    return {
      kleur: "rood",
      kop: "Nog niet gesynchroniseerd",
      toelichting:
        "De gegevens staan ingevuld en de synchronisatie staat aan, maar er is nog geen " +
        "geslaagde run geweest. Probeer het met de knop hiernaast.",
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
        `De laatste geslaagde run was ${beschrijfDuur(minuten)} geleden, terwijl er ` +
        `${beschrijfInterval(intervalMinuten)} een hoort te draaien.`,
    };
  }

  if (minuten > GROEN_TOT_MINUTEN) {
    return {
      kleur: "oranje",
      kop: "Synchronisatie loopt achter",
      toelichting:
        `De laatste geslaagde run was ${beschrijfDuur(minuten)} geleden. ` +
        `Er hoort er ${beschrijfInterval(intervalMinuten)} een te draaien.`,
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

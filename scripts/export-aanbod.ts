/**
 * Dumpt een steekproef uit het aanbodarchief naar Excel, met alle velden die Floriday
 * levert - niets weggelaten, niets samengevat.
 *
 * Bedoeld om zelf door de data te lopen en om vragen aan Floriday mee te onderbouwen.
 *
 * Gebruik:
 *   npm run export-aanbod
 *   npm run export-aanbod -- --rijen 2000
 *   npm run export-aanbod -- --selectie beschikbaar
 *   npm run export-aanbod -- --selectie mutaties
 *   npm run export-aanbod -- --maxgroep 100
 *   npm run export-aanbod -- --env .env.lokaal-productie
 *
 * Vijf manieren van selecteren:
 *
 *   reeksen (standaard) - dezelfde kweker met hetzelfde artikel, over meerdere
 *     veilingdatums, gesorteerd op datum. Zo zie je onder elkaar hoe prijs en aantal van
 *     één product zich over de tijd bewegen. Dit is de enige groepering waarin regels
 *     werkelijk bij elkaar horen; zie de opmerking over afleverbonnen hieronder.
 *
 *   bon - op afleverbon. Let op: een bonnummer is niet uniek. Van de 286.390 bonnen in het
 *     archief komen er 30.920 bij meer dan één kweker voor, en de combinatie
 *     bon + kweker + veilingdatum levert 478.605 groepen waarvan er maar 122 meer dan één
 *     regel hebben. Regels met hetzelfde bonnummer zijn dus meestal toeval, geen partij.
 *
 *   recent - de hoogste sequencenummers, oftewel de laatst gewijzigde regels.
 *
 *   beschikbaar - alleen wat nog te koop staat. Een kleine verzameling: het archief bestaat
 *     vrijwel geheel uit afgehandeld aanbod, want een regel wordt UNAVAILABLE zodra hij
 *     verkocht of verlopen is.
 *
 *   mutaties - regels waarvan meer dan één versie is gezien, met alle versies onder elkaar.
 *     Leest uit SupplyLineVersion in plaats van SupplyLine.
 *
 * De export komt uit onze eigen database, niet rechtstreeks uit de API. Dat is geen
 * beperking: gemeten op een verse pagina van duizend records levert de API precies de
 * vijfentwintig velden die wij ook opslaan, geen enkel veld meer. De database kan wél
 * kwekers- en artikelnamen aanhangen en gericht selecteren, en dat kan een losse API-call
 * niet.
 */
import "@/lib/load-env";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function readNumberFlag(name: string, fallback: number): number {
  const raw = readFlag(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`--${name} verwacht een positief geheel getal, kreeg "${raw}".`);
    process.exit(1);
  }
  return value;
}

/** Een aanbodregel zoals hij uit de database komt, met de naam van kweker en artikel erbij. */
interface ExportRij {
  supplyLineId: string;
  status: string;
  tradeItemId: string;
  tradeItemVersion: number | null;
  pricePerPiece: unknown;
  currency: string;
  numberOfPieces: number;
  deliveryNoteReference: string | null;
  deliveryNoteCode: string | null;
  deliveryNoteLetter: string | null;
  piecesPerPackage: number | null;
  vbnPackageCode: number | null;
  customPackageId: string | null;
  packagesPerLayer: number | null;
  layersPerLoadCarrier: number | null;
  loadCarrier: string | null;
  tradePeriodStart: Date;
  tradePeriodEnd: Date;
  supplierOrganizationId: string;
  sequenceNumber: bigint;
  creationDateTime: Date;
  lastModifiedDateTime: Date | null;
  auctionDate: Date;
  initialAuctionLocation: string;
  photoUrl: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  /** Alleen gevuld bij de selectie "mutaties": het hoeveelste beeld van deze regel dit is. */
  versieNr?: number;
  /** Alleen bij "mutaties": hoeveel versies deze regel in totaal heeft. */
  versiesTotaal?: number;
}

/**
 * Kolommen van het aanbodblad, in leesvolgorde: eerst waar je op zoekt, dan de details,
 * dan de sleutels. `bron` maakt zichtbaar wat rechtstreeks van Floriday komt en wat wij
 * eromheen hebben gezet - juist dat onderscheid gaat verloren zodra het in Excel staat.
 */
interface Kolom {
  kop: string;
  breedte: number;
  bron: "floriday" | "opgezocht" | "afgeleid";
  toelichting: string;
  waarde: (rij: ExportRij, extra: ExtraContext) => unknown;
}

interface ExtraContext {
  kwekers: Map<string, Kweker>;
  artikelen: Map<string, Artikel>;
  regelsPerBon: Map<string, number>;
  /** Sleutel: `${supplierOrganizationId}|${tradeItemId}` - hoe vaak die combinatie in het archief staat. */
  regelsPerReeks: Map<string, number>;
}

interface Kweker {
  name: string | null;
  commercialName: string | null;
  city: string | null;
  countryCode: string | null;
  companyGln: string | null;
  rfhRelationId: number | null;
  organizationType: string | null;
  endDate: Date | null;
  sequenceNumber: bigint;
}

interface Artikel {
  name: string;
  vbnProductCode: string | null;
  code: string | null;
  gtin: string | null;
  botanicalNames: string[];
  countryOfOriginIsoCodes: string[];
  characteristics: unknown;
  photos: unknown;
  packingConfigurations: unknown;
  tradeItemVersion: number | null;
  isDeleted: boolean;
  sequenceNumber: bigint;
  fetchedAt: Date;
}

interface Foto {
  url: string | null;
  type: string | null;
  primary: boolean;
}

interface Verpakking {
  package: { vbnPackageCode: number | null; customPackageId: string | null };
  isPrimary: boolean;
  loadCarrierType: string | null;
  packagesPerLayer: number | null;
  piecesPerPackage: number | null;
  layersPerLoadCarrier: number | null;
  additionalPricePerPiece: { value: number; currency: string } | null;
  floricodeVrsPackagingId: string | null;
}

function lijst<T>(rauw: unknown): T[] {
  return Array.isArray(rauw) ? (rauw as T[]) : [];
}

/** De verpakking die het artikel zelf als primair aanmerkt, anders de eerste die er is. */
function primaireVerpakking(artikel: Artikel | undefined): Verpakking | undefined {
  const alle = lijst<Verpakking>(artikel?.packingConfigurations);
  return alle.find((v) => v.isPrimary) ?? alle[0];
}

interface Kenmerk {
  vbnCode: string;
  vbnValueCode: string;
}

/**
 * De kenmerken van een artikel zijn een lijst VBN-code/waarde-paren; er is geen veld dat
 * "lengte" heet. Welke code welke betekenis heeft staat nergens in de API.
 *
 * S20 is de lengte in centimeters. Vastgesteld door de kenmerken te vergelijken met
 * artikelnamen die hun maat zelf noemen ("Roos GrandPrix 50cm"): van 129 zulke artikelen
 * kwam S20 er 124 keer exact mee overeen, oftewel 96%. De eerstvolgende kandidaat kwam niet
 * verder dan 49%. Over het hele archief zijn 80, 70, 60 en 50 cm de meest voorkomende
 * waarden, wat past bij hoe snijbloemen worden verhandeld.
 *
 * S98 is de kwaliteitsklasse: alleen A1, A2, B1 en NV komen voor.
 */
function kenmerken(artikel: Artikel | undefined): Kenmerk[] {
  const rauw = artikel?.characteristics;
  return Array.isArray(rauw) ? (rauw as Kenmerk[]) : [];
}

function kenmerk(artikel: Artikel | undefined, code: string): string | null {
  return kenmerken(artikel).find((k) => k.vbnCode === code)?.vbnValueCode ?? null;
}

/** Lege string en null betekenen bij Floriday allebei "niet ingevuld"; zo tonen we dat ook. */
function leeg(waarde: string | null | undefined): string | null {
  if (waarde === null || waarde === undefined) return null;
  const bijgeknipt = waarde.trim();
  return bijgeknipt === "" ? null : bijgeknipt;
}

function getal(waarde: unknown): number | null {
  if (waarde === null || waarde === undefined) return null;
  const n = Number(waarde);
  return Number.isFinite(n) ? n : null;
}

const KOLOMMEN: Kolom[] = [
  {
    kop: "Versie",
    breedte: 9,
    bron: "afgeleid",
    toelichting:
      "Alleen bij de selectie \"mutaties\": het hoeveelste beeld dit is van dezelfde aanbodregel, " +
      "als \"1 van 2\". De versies staan onder elkaar, oudste eerst.",
    waarde: (r) =>
      r.versieNr === undefined ? null : `${r.versieNr} van ${r.versiesTotaal ?? r.versieNr}`,
  },
  {
    kop: "Reeks (kweker + artikel)",
    breedte: 18,
    bron: "afgeleid",
    toelichting:
      "Hoe vaak deze kweker dit artikel in het hele archief aanbiedt. Bij de standaardselectie " +
      "staan die regels onder elkaar, op veilingdatum.",
    waarde: (r, x) => x.regelsPerReeks.get(`${r.supplierOrganizationId}|${r.tradeItemId}`) ?? 1,
  },
  {
    kop: "Afleverbon",
    breedte: 16,
    bron: "floriday",
    toelichting: "deliveryNoteReference - het bonnummer. Niet uniek; zie het blad Toelichting.",
    waarde: (r) => leeg(r.deliveryNoteReference),
  },
  {
    kop: "Regels met deze bon",
    breedte: 17,
    bron: "afgeleid",
    toelichting:
      "Aantal aanbodregels met hetzelfde bonnummer in het hele archief. Vaak van verschillende " +
      "kwekers op verschillende datums, dus geen maat voor partijgrootte.",
    waarde: (r, x) => (r.deliveryNoteReference ? x.regelsPerBon.get(r.deliveryNoteReference) ?? 1 : null),
  },
  {
    kop: "Kweker",
    breedte: 34,
    bron: "opgezocht",
    toelichting:
      "Organization.name bij supplierOrganizationId. Leeg als die kweker nog niet is opgehaald.",
    waarde: (r, x) => {
      const k = x.kwekers.get(r.supplierOrganizationId);
      return leeg(k?.name) ?? leeg(k?.commercialName);
    },
  },
  {
    kop: "Artikel",
    breedte: 40,
    bron: "opgezocht",
    toelichting: "TradeItem.name bij tradeItemId. Leeg als dat artikel nog niet is opgehaald.",
    waarde: (r, x) => leeg(x.artikelen.get(r.tradeItemId)?.name),
  },
  {
    kop: "Lengte (cm)",
    breedte: 12,
    bron: "opgezocht",
    toelichting:
      "TradeItem.characteristics, VBN-code S20. Er is geen veld dat lengte heet; deze code is " +
      "afgeleid uit de data - zie het blad Kenmerken. Leeg bij producten zonder lengte, zoals " +
      "potplanten.",
    waarde: (r, x) => {
      const waarde = kenmerk(x.artikelen.get(r.tradeItemId), "S20");
      return waarde === null ? null : Number(waarde);
    },
  },
  {
    kop: "Kwaliteit",
    breedte: 11,
    bron: "opgezocht",
    toelichting: "TradeItem.characteristics, VBN-code S98. Komt voor als A1, A2, B1 en NV.",
    waarde: (r, x) => kenmerk(x.artikelen.get(r.tradeItemId), "S98"),
  },
  {
    kop: "Veilingdatum",
    breedte: 14,
    bron: "floriday",
    toelichting: "auctionDate - de dag waarop deze partij op de klok komt.",
    waarde: (r) => r.auctionDate,
  },
  {
    kop: "Veilinglocatie",
    breedte: 15,
    bron: "floriday",
    toelichting: "initialAuctionLocation - AALSMEER, NAALDWIJK, RIJNSBURG, EELDE, PLANTION, RHEINMAAS of DIGITAL.",
    waarde: (r) => r.initialAuctionLocation,
  },
  {
    kop: "Status",
    breedte: 13,
    bron: "floriday",
    toelichting: "status - AVAILABLE of UNAVAILABLE.",
    waarde: (r) => r.status,
  },
  {
    kop: "Stuks",
    breedte: 10,
    bron: "floriday",
    toelichting: "numberOfPieces - aantal stuks in deze regel.",
    waarde: (r) => r.numberOfPieces,
  },
  {
    kop: "Prijs per stuk",
    breedte: 14,
    bron: "floriday",
    toelichting: "pricePerPiece.value - vier decimalen in de bron.",
    waarde: (r) => getal(r.pricePerPiece),
  },
  {
    kop: "Valuta",
    breedte: 9,
    bron: "floriday",
    toelichting: "pricePerPiece.currency.",
    waarde: (r) => r.currency,
  },
  {
    kop: "Totaalwaarde",
    breedte: 14,
    bron: "afgeleid",
    toelichting: "Stuks x prijs per stuk. Staat niet in de API; hier berekend om regels te kunnen wegen.",
    waarde: (r) => {
      const prijs = getal(r.pricePerPiece);
      return prijs === null ? null : Number((prijs * r.numberOfPieces).toFixed(4));
    },
  },
  {
    kop: "Bon-code",
    breedte: 12,
    bron: "floriday",
    toelichting: "deliveryNoteCode - de afleverbon zonder de letter erachter.",
    waarde: (r) => leeg(r.deliveryNoteCode),
  },
  {
    kop: "Bon-letter",
    breedte: 11,
    bron: "floriday",
    toelichting: "deliveryNoteLetter - onderscheidt regels binnen dezelfde bon.",
    waarde: (r) => leeg(r.deliveryNoteLetter),
  },
  {
    kop: "Stuks per verpakking",
    breedte: 19,
    bron: "floriday",
    toelichting: "packingConfiguration.piecesPerPackage.",
    waarde: (r) => r.piecesPerPackage,
  },
  {
    kop: "VBN-verpakkingscode",
    breedte: 19,
    bron: "floriday",
    toelichting: "packingConfiguration.package.vbnPackageCode.",
    waarde: (r) => r.vbnPackageCode,
  },
  {
    kop: "Eigen verpakking-id",
    breedte: 38,
    bron: "floriday",
    toelichting: "packingConfiguration.package.customPackageId - alternatief voor de VBN-code.",
    waarde: (r) => leeg(r.customPackageId),
  },
  {
    kop: "Verpakkingen per laag",
    breedte: 20,
    bron: "floriday",
    toelichting: "packingConfiguration.packagesPerLayer.",
    waarde: (r) => r.packagesPerLayer,
  },
  {
    kop: "Lagen per drager",
    breedte: 17,
    bron: "floriday",
    toelichting: "packingConfiguration.layersPerLoadCarrier.",
    waarde: (r) => r.layersPerLoadCarrier,
  },
  {
    kop: "Ladingdrager",
    breedte: 18,
    bron: "floriday",
    toelichting: "packingConfiguration.loadCarrier - bijvoorbeeld AUCTION_TROLLEY.",
    waarde: (r) => leeg(r.loadCarrier),
  },
  {
    kop: "Handelsperiode van",
    breedte: 20,
    bron: "floriday",
    toelichting: "tradePeriod.startDateTime - vanaf wanneer de regel verhandelbaar is.",
    waarde: (r) => r.tradePeriodStart,
  },
  {
    kop: "Handelsperiode tot",
    breedte: 20,
    bron: "floriday",
    toelichting: "tradePeriod.endDateTime - tot wanneer de regel verhandelbaar is.",
    waarde: (r) => r.tradePeriodEnd,
  },
  {
    kop: "Aangemaakt",
    breedte: 22,
    bron: "floriday",
    toelichting: "creationDateTime - wanneer Floriday deze regel aanmaakte.",
    waarde: (r) => r.creationDateTime,
  },
  {
    kop: "Laatst gewijzigd",
    breedte: 22,
    bron: "floriday",
    toelichting: "lastModifiedDateTime - leeg als de regel nooit is gewijzigd.",
    waarde: (r) => r.lastModifiedDateTime,
  },
  {
    kop: "Gewijzigd na (uur)",
    breedte: 17,
    bron: "afgeleid",
    toelichting:
      "Uren tussen aanmaken en laatste wijziging. Leeg als de regel nooit gewijzigd is. " +
      "Dit is de enige plek waar wijzigingen zichtbaar zijn: wij hebben van elke regel maar " +
      "één versie, want de backfill zag alleen de eindstand.",
    waarde: (r) => {
      if (!r.lastModifiedDateTime) return null;
      const uren = (r.lastModifiedDateTime.getTime() - r.creationDateTime.getTime()) / 3_600_000;
      return Number(uren.toFixed(1));
    },
  },
  {
    kop: "Artikelversie",
    breedte: 13,
    bron: "floriday",
    toelichting: "tradeItemVersion - welke versie van het artikel deze regel gebruikt.",
    waarde: (r) => r.tradeItemVersion,
  },
  {
    kop: "Foto",
    breedte: 46,
    bron: "floriday",
    toelichting: "photoUrl.",
    waarde: (r) => leeg(r.photoUrl),
  },
  {
    kop: "Volgnummer",
    breedte: 14,
    bron: "floriday",
    toelichting:
      "sequenceNumber - de teller waarop de synchronisatie loopt. Hoger is recenter gewijzigd.",
    waarde: (r) => Number(r.sequenceNumber),
  },
  {
    kop: "Kweker plaats",
    breedte: 20,
    bron: "opgezocht",
    toelichting: "Organization.city.",
    waarde: (r, x) => leeg(x.kwekers.get(r.supplierOrganizationId)?.city),
  },
  {
    kop: "Kweker land",
    breedte: 12,
    bron: "opgezocht",
    toelichting: "Organization.countryCode.",
    waarde: (r, x) => leeg(x.kwekers.get(r.supplierOrganizationId)?.countryCode),
  },
  {
    kop: "Kweker GLN",
    breedte: 16,
    bron: "opgezocht",
    toelichting: "Organization.companyGln.",
    waarde: (r, x) => leeg(x.kwekers.get(r.supplierOrganizationId)?.companyGln),
  },
  {
    kop: "Kweker RFH-relatie",
    breedte: 18,
    bron: "opgezocht",
    toelichting: "Organization.rfhRelationId.",
    waarde: (r, x) => x.kwekers.get(r.supplierOrganizationId)?.rfhRelationId ?? null,
  },
  {
    kop: "Kweker type",
    breedte: 16,
    bron: "opgezocht",
    toelichting: "Organization.organizationType.",
    waarde: (r, x) => leeg(x.kwekers.get(r.supplierOrganizationId)?.organizationType),
  },
  {
    kop: "VBN-productcode",
    breedte: 16,
    bron: "opgezocht",
    toelichting: "TradeItem.vbnProductCode - tekst, geen getal; de API stuurt het als string.",
    waarde: (r, x) => leeg(x.artikelen.get(r.tradeItemId)?.vbnProductCode),
  },
  {
    kop: "Artikelcode kweker",
    breedte: 18,
    bron: "opgezocht",
    toelichting: "TradeItem.code - de eigen code van de kweker.",
    waarde: (r, x) => leeg(x.artikelen.get(r.tradeItemId)?.code),
  },
  {
    kop: "GTIN",
    breedte: 16,
    bron: "opgezocht",
    toelichting: "TradeItem.gtin.",
    waarde: (r, x) => leeg(x.artikelen.get(r.tradeItemId)?.gtin),
  },
  {
    kop: "Botanische naam",
    breedte: 28,
    bron: "opgezocht",
    toelichting: "TradeItem.botanicalNames, samengevoegd met komma's.",
    waarde: (r, x) => x.artikelen.get(r.tradeItemId)?.botanicalNames.join(", ") || null,
  },
  {
    kop: "Herkomstland",
    breedte: 14,
    bron: "opgezocht",
    toelichting: "TradeItem.countryOfOriginIsoCodes, samengevoegd met komma's.",
    waarde: (r, x) => x.artikelen.get(r.tradeItemId)?.countryOfOriginIsoCodes.join(", ") || null,
  },
  {
    kop: "Alle kenmerken",
    breedte: 52,
    bron: "opgezocht",
    toelichting:
      "TradeItem.characteristics volledig, als code=waarde. Staat er zodat geen enkel kenmerk " +
      "verloren gaat, ook die waarvan de betekenis nog onbekend is. Het blad Kenmerken telt ze.",
    waarde: (r, x) =>
      kenmerken(x.artikelen.get(r.tradeItemId))
        .map((k) => `${k.vbnCode}=${k.vbnValueCode}`)
        .join(" ") || null,
  },
  {
    kop: "Artikel verwijderd",
    breedte: 17,
    bron: "opgezocht",
    toelichting:
      "TradeItem.isDeleted. In het archief staan 217 verwijderde artikelen; aanbodregels die " +
      "ernaar verwijzen blijven bestaan.",
    waarde: (r, x) => {
      const a = x.artikelen.get(r.tradeItemId);
      return a === undefined ? null : a.isDeleted ? "ja" : "nee";
    },
  },
  {
    kop: "Artikelversie (artikel)",
    breedte: 20,
    bron: "opgezocht",
    toelichting:
      "TradeItem.tradeItemVersion - de versie die wij van het artikel hebben. Kan afwijken van " +
      "de versie waar de aanbodregel naar verwijst.",
    waarde: (r, x) => x.artikelen.get(r.tradeItemId)?.tradeItemVersion ?? null,
  },
  {
    kop: "Aantal foto's",
    breedte: 13,
    bron: "opgezocht",
    toelichting: "TradeItem.photos - hoeveel foto's het artikel heeft.",
    waarde: (r, x) => lijst<Foto>(x.artikelen.get(r.tradeItemId)?.photos).length || null,
  },
  {
    kop: "Primaire artikelfoto",
    breedte: 46,
    bron: "opgezocht",
    toelichting: "TradeItem.photos - de url van de foto die als primair is aangemerkt.",
    waarde: (r, x) => {
      const fotos = lijst<Foto>(x.artikelen.get(r.tradeItemId)?.photos);
      return leeg((fotos.find((f) => f.primary) ?? fotos[0])?.url);
    },
  },
  {
    kop: "Verpakkingsopties",
    breedte: 17,
    bron: "opgezocht",
    toelichting:
      "TradeItem.packingConfigurations - hoeveel verpakkingsvormen het artikel kent. De " +
      "aanbodregel gebruikt er één; de kolommen hierna beschrijven de primaire.",
    waarde: (r, x) =>
      lijst<Verpakking>(x.artikelen.get(r.tradeItemId)?.packingConfigurations).length || null,
  },
  {
    kop: "Toeslag per stuk",
    breedte: 16,
    bron: "opgezocht",
    toelichting:
      "packingConfigurations[primair].additionalPricePerPiece.value - opslag bovenop de prijs " +
      "voor deze verpakkingsvorm. Staat niet op de aanbodregel zelf.",
    waarde: (r, x) => primaireVerpakking(x.artikelen.get(r.tradeItemId))?.additionalPricePerPiece?.value ?? null,
  },
  {
    kop: "Primaire verpakking",
    breedte: 40,
    bron: "opgezocht",
    toelichting:
      "packingConfigurations[primair], samengevat als VBN-code, drager en aantallen. Vergelijk " +
      "met de verpakkingskolommen van de aanbodregel zelf.",
    waarde: (r, x) => {
      const v = primaireVerpakking(x.artikelen.get(r.tradeItemId));
      if (!v) return null;
      const delen = [
        v.package?.vbnPackageCode !== null && v.package?.vbnPackageCode !== undefined
          ? `VBN ${v.package.vbnPackageCode}`
          : null,
        leeg(v.loadCarrierType),
        v.piecesPerPackage !== null ? `${v.piecesPerPackage} per verpakking` : null,
        v.packagesPerLayer !== null ? `${v.packagesPerLayer} per laag` : null,
        v.layersPerLoadCarrier !== null ? `${v.layersPerLoadCarrier} lagen` : null,
      ].filter(Boolean);
      return delen.join(", ") || null;
    },
  },
  {
    kop: "Kweker einddatum",
    breedte: 18,
    bron: "opgezocht",
    toelichting:
      "Organization.endDate. Gevuld bij 47.145 van de 67.342 organisaties - waarom dat er zoveel " +
      "zijn is een open vraag aan Floriday.",
    waarde: (r, x) => x.kwekers.get(r.supplierOrganizationId)?.endDate ?? null,
  },
  {
    kop: "Kweker handelsnaam",
    breedte: 30,
    bron: "opgezocht",
    toelichting: "Organization.commercialName - naast de statutaire naam in de kolom Kweker.",
    waarde: (r, x) => leeg(x.kwekers.get(r.supplierOrganizationId)?.commercialName),
  },
  {
    kop: "Artikel opgehaald op",
    breedte: 20,
    bron: "afgeleid",
    toelichting: "TradeItem.fetchedAt - wanneer wij dit artikel voor het laatst ophaalden.",
    waarde: (r, x) => x.artikelen.get(r.tradeItemId)?.fetchedAt ?? null,
  },
  {
    kop: "Volgnummer artikel",
    breedte: 17,
    bron: "opgezocht",
    toelichting: "TradeItem.sequenceNumber - eigen teller van de artikelenfeed.",
    waarde: (r, x) => {
      const s = x.artikelen.get(r.tradeItemId)?.sequenceNumber;
      return s === undefined ? null : Number(s);
    },
  },
  {
    kop: "Volgnummer kweker",
    breedte: 17,
    bron: "opgezocht",
    toelichting: "Organization.sequenceNumber - eigen teller van de organisatiefeed.",
    waarde: (r, x) => {
      const s = x.kwekers.get(r.supplierOrganizationId)?.sequenceNumber;
      return s === undefined ? null : Number(s);
    },
  },
  {
    kop: "Voor het eerst gezien",
    breedte: 22,
    bron: "afgeleid",
    toelichting: "firstSeenAt - wanneer onze synchronisatie deze regel voor het eerst zag.",
    waarde: (r) => r.firstSeenAt,
  },
  {
    kop: "Laatst gezien",
    breedte: 22,
    bron: "afgeleid",
    toelichting: "lastSeenAt - wanneer onze synchronisatie deze regel voor het laatst zag.",
    waarde: (r) => r.lastSeenAt,
  },
  {
    kop: "supplyLineId",
    breedte: 38,
    bron: "floriday",
    toelichting: "De sleutel van de aanbodregel.",
    waarde: (r) => r.supplyLineId,
  },
  {
    kop: "tradeItemId",
    breedte: 38,
    bron: "floriday",
    toelichting: "De sleutel van het artikel.",
    waarde: (r) => r.tradeItemId,
  },
  {
    kop: "supplierOrganizationId",
    breedte: 38,
    bron: "floriday",
    toelichting: "De sleutel van de kweker.",
    waarde: (r) => r.supplierOrganizationId,
  },
];

/**
 * Dezelfde kweker met hetzelfde artikel, op veilingdatum onder elkaar. De enige groepering
 * waarin opeenvolgende regels werkelijk over hetzelfde gaan: je ziet prijs en aantal van één
 * product over de tijd bewegen.
 *
 * De bovengrens houdt de export gevarieerd. Zonder die grens vult de langstlopende reeks in
 * zijn eentje het hele bestand en zie je één product in plaats van een patroon.
 */
async function selecteerOpReeksen(rijen: number, maxReeks: number): Promise<ExportRij[]> {
  return prisma.$queryRaw<ExportRij[]>`
    WITH reeksen AS (
      SELECT "supplierOrganizationId" AS kweker, "tradeItemId" AS artikel, count(*)::int AS regels
      FROM "SupplyLine"
      GROUP BY 1, 2
      HAVING count(*) BETWEEN 2 AND ${maxReeks}
    ),
    gekozen AS (
      SELECT kweker, artikel, regels,
             sum(regels) OVER (ORDER BY regels DESC, kweker, artikel ROWS UNBOUNDED PRECEDING) AS tot
      FROM reeksen
    )
    SELECT sl.*
    FROM "SupplyLine" sl
    JOIN gekozen g
      ON g.kweker = sl."supplierOrganizationId" AND g.artikel = sl."tradeItemId"
    WHERE g.tot <= ${rijen}
    ORDER BY g.regels DESC, sl."supplierOrganizationId", sl."tradeItemId", sl."auctionDate"
  `;
}

/**
 * Op afleverbon. Bewaard omdat de vraag "wat hoort bij dezelfde bon" legitiem is, maar het
 * bonnummer identificeert geen partij - zie de kop van dit bestand voor de meting.
 */
async function selecteerOpBon(rijen: number, maxBon: number): Promise<ExportRij[]> {
  return prisma.$queryRaw<ExportRij[]>`
    WITH bonnen AS (
      SELECT "deliveryNoteReference" AS bon, count(*)::int AS regels
      FROM "SupplyLine"
      WHERE "deliveryNoteReference" IS NOT NULL AND "deliveryNoteReference" <> ''
      GROUP BY 1
      HAVING count(*) BETWEEN 2 AND ${maxBon}
    ),
    gekozen AS (
      SELECT bon, regels,
             sum(regels) OVER (ORDER BY regels DESC, bon ROWS UNBOUNDED PRECEDING) AS tot
      FROM bonnen
    )
    SELECT sl.*
    FROM "SupplyLine" sl
    JOIN gekozen g ON g.bon = sl."deliveryNoteReference"
    WHERE g.tot <= ${rijen}
    ORDER BY g.regels DESC, sl."deliveryNoteReference", sl."auctionDate"
  `;
}

async function selecteerRecent(rijen: number): Promise<ExportRij[]> {
  return prisma.$queryRaw<ExportRij[]>`
    SELECT * FROM "SupplyLine"
    ORDER BY "sequenceNumber" DESC
    LIMIT ${rijen}
  `;
}

/**
 * Aanbodregels waarvan meer dan één versie is gezien, met alle versies onder elkaar.
 *
 * Leest uit SupplyLineVersion in plaats van SupplyLine, want die laatste bewaart alleen de
 * huidige stand. Elke versie wordt een eigen rij; firstSeenAt en lastSeenAt krijgen de
 * waarneemtijd van die versie, zodat de kolommen dezelfde betekenis houden.
 *
 * Wat er in de praktijk verandert, gemeten over de eerste 231 mutaties: de status springt van
 * AVAILABLE naar UNAVAILABLE (145 keer) en het aantal stuks valt terug naar nul (84 keer). De
 * prijs per stuk veranderde geen enkele keer.
 */
async function selecteerMutaties(rijen: number): Promise<ExportRij[]> {
  return prisma.$queryRaw<ExportRij[]>`
    WITH meervoud AS (
      SELECT "supplyLineId", count(*)::int AS versies
      FROM "SupplyLineVersion" GROUP BY 1 HAVING count(*) > 1
    ),
    gekozen AS (
      SELECT m.*, sum(m.versies) OVER (ORDER BY m."supplyLineId" ROWS UNBOUNDED PRECEDING) AS tot
      FROM meervoud m
    )
    SELECT
      v."supplyLineId", v.status, v."tradeItemId", v."tradeItemVersion", v."pricePerPiece",
      v.currency, v."numberOfPieces", v."deliveryNoteReference", v."deliveryNoteCode",
      v."deliveryNoteLetter", v."piecesPerPackage", v."vbnPackageCode", v."customPackageId",
      v."packagesPerLayer", v."layersPerLoadCarrier", v."loadCarrier", v."tradePeriodStart",
      v."tradePeriodEnd", v."supplierOrganizationId", v."sequenceNumber", v."creationDateTime",
      v."lastModifiedDateTime", v."auctionDate", v."initialAuctionLocation", v."photoUrl",
      v."observedAt" AS "firstSeenAt", v."observedAt" AS "lastSeenAt",
      row_number() OVER (PARTITION BY v."supplyLineId" ORDER BY v."sequenceNumber")::int AS "versieNr",
      g.versies AS "versiesTotaal"
    FROM "SupplyLineVersion" v
    JOIN gekozen g ON g."supplyLineId" = v."supplyLineId"
    WHERE g.tot <= ${rijen}
    ORDER BY v."supplyLineId", v."sequenceNumber"
  `;
}

/**
 * Alleen wat op het moment van de laatste synchronisatie nog te koop stond.
 *
 * Dat is een kleine verzameling: 543 van de 525.458 regels, oftewel een tiende procent. Een
 * regel wordt UNAVAILABLE zodra hij verkocht of verlopen is, en dat is meteen zijn laatste
 * wijziging - daarom bestaan de andere selecties vrijwel uitsluitend uit UNAVAILABLE regels.
 *
 * Op veilingdatum gesorteerd in plaats van op volgnummer: bij levend aanbod is de vraag
 * wanneer iets op de klok komt, niet wanneer het voor het laatst gewijzigd werd.
 */
async function selecteerBeschikbaar(rijen: number): Promise<ExportRij[]> {
  return prisma.$queryRaw<ExportRij[]>`
    SELECT * FROM "SupplyLine"
    WHERE status = 'AVAILABLE'
    ORDER BY "auctionDate", "supplierOrganizationId", "tradeItemId"
    LIMIT ${rijen}
  `;
}

async function haalContext(regels: ExportRij[]): Promise<ExtraContext> {
  const kwekerIds = [...new Set(regels.map((r) => r.supplierOrganizationId))];
  const artikelIds = [...new Set(regels.map((r) => r.tradeItemId))];
  const bonnen = [...new Set(regels.map((r) => r.deliveryNoteReference).filter((b): b is string => !!b))];

  const reeksen = [...new Set(regels.map((r) => `${r.supplierOrganizationId}|${r.tradeItemId}`))]
    .map((s) => s.split("|") as [string, string]);

  const [kwekerRijen, artikelRijen, bonRijen, reeksRijen] = await Promise.all([
    prisma.organization.findMany({
      where: { organizationId: { in: kwekerIds } },
      // Elk veld van Organization; er is er geen dat de export bewust weglaat.
      select: {
        organizationId: true, name: true, commercialName: true, city: true,
        countryCode: true, companyGln: true, rfhRelationId: true, organizationType: true,
        endDate: true, sequenceNumber: true,
      },
    }),
    prisma.tradeItem.findMany({
      where: { tradeItemId: { in: artikelIds } },
      // Elk veld van TradeItem, inclusief de drie json-kolommen. Die zijn er eerder uit
      // gebleven omdat ze niet zonder nadenken in een cel passen - en juist daar zat de
      // productlengte in.
      select: {
        tradeItemId: true, name: true, vbnProductCode: true, code: true, gtin: true,
        botanicalNames: true, countryOfOriginIsoCodes: true, characteristics: true,
        photos: true, packingConfigurations: true, tradeItemVersion: true, isDeleted: true,
        sequenceNumber: true, fetchedAt: true,
      },
    }),
    // Geteld over het hele archief, niet over deze export: de vraag is hoe groot een partij
    // werkelijk is, niet hoeveel er toevallig in de steekproef viel.
    bonnen.length === 0
      ? Promise.resolve([] as { bon: string; regels: number }[])
      : prisma.$queryRaw<{ bon: string; regels: number }[]>`
          SELECT "deliveryNoteReference" AS bon, count(*)::int AS regels
          FROM "SupplyLine"
          WHERE "deliveryNoteReference" = ANY(${bonnen})
          GROUP BY 1
        `,
    // Zelfde reden als hierboven: geteld over het hele archief, niet over de steekproef.
    prisma.$queryRaw<{ kweker: string; artikel: string; regels: number }[]>`
      SELECT "supplierOrganizationId" AS kweker, "tradeItemId" AS artikel, count(*)::int AS regels
      FROM "SupplyLine"
      WHERE "supplierOrganizationId" = ANY(${reeksen.map((r) => r[0])}::uuid[])
        AND "tradeItemId" = ANY(${reeksen.map((r) => r[1])}::uuid[])
      GROUP BY 1, 2
    `,
  ]);

  return {
    kwekers: new Map(kwekerRijen.map((k) => [k.organizationId, k])),
    artikelen: new Map(artikelRijen.map((a) => [a.tradeItemId, a])),
    regelsPerBon: new Map(bonRijen.map((b) => [b.bon, b.regels])),
    regelsPerReeks: new Map(reeksRijen.map((r) => [`${r.kweker}|${r.artikel}`, r.regels])),
  };
}

/**
 * Vulgraad per veld over het hele archief. Lege strings tellen als niet ingevuld: bij
 * Floriday betekent "" hetzelfde als afwezig, en een kolom die op papier voor 100% gevuld
 * is maar in de praktijk lege tekst bevat, leest anders als bruikbaar terwijl hij dat niet is.
 */
async function haalVulgraad(): Promise<{ veld: string; gevuld: number; totaal: number; uniek: number }[]> {
  const [rij] = await prisma.$queryRaw<Record<string, bigint>[]>`
    SELECT
      count(*) AS totaal,
      count("tradeItemVersion") AS "tradeItemVersion",
      count(NULLIF("deliveryNoteReference", '')) AS "deliveryNoteReference",
      count(NULLIF("deliveryNoteCode", '')) AS "deliveryNoteCode",
      count(NULLIF("deliveryNoteLetter", '')) AS "deliveryNoteLetter",
      count("piecesPerPackage") AS "piecesPerPackage",
      count("vbnPackageCode") AS "vbnPackageCode",
      count("customPackageId") AS "customPackageId",
      count("packagesPerLayer") AS "packagesPerLayer",
      count("layersPerLoadCarrier") AS "layersPerLoadCarrier",
      count(NULLIF("loadCarrier", '')) AS "loadCarrier",
      count("lastModifiedDateTime") AS "lastModifiedDateTime",
      count(NULLIF("photoUrl", '')) AS "photoUrl",
      count(DISTINCT "deliveryNoteReference") AS "u_deliveryNoteReference",
      count(DISTINCT "loadCarrier") AS "u_loadCarrier",
      count(DISTINCT "vbnPackageCode") AS "u_vbnPackageCode",
      count(DISTINCT "initialAuctionLocation") AS "u_initialAuctionLocation",
      count(DISTINCT "status") AS "u_status",
      count(DISTINCT "currency") AS "u_currency",
      count(DISTINCT "supplierOrganizationId") AS "u_supplierOrganizationId",
      count(DISTINCT "tradeItemId") AS "u_tradeItemId"
    FROM "SupplyLine"
  `;

  const totaal = Number(rij.totaal);
  const altijd = ["supplyLineId", "status", "tradeItemId", "pricePerPiece", "currency",
    "numberOfPieces", "tradePeriodStart", "tradePeriodEnd", "supplierOrganizationId",
    "sequenceNumber", "creationDateTime", "auctionDate", "initialAuctionLocation"];

  const uit: { veld: string; gevuld: number; totaal: number; uniek: number }[] = [];
  for (const veld of altijd) {
    uit.push({ veld, gevuld: totaal, totaal, uniek: Number(rij[`u_${veld}`] ?? 0) });
  }
  for (const [sleutel, waarde] of Object.entries(rij)) {
    if (sleutel === "totaal" || sleutel.startsWith("u_")) continue;
    uit.push({ veld: sleutel, gevuld: Number(waarde), totaal, uniek: Number(rij[`u_${sleutel}`] ?? 0) });
  }
  return uit.sort((a, b) => b.gevuld - a.gevuld || a.veld.localeCompare(b.veld));
}

function bouwAanbodblad(boek: ExcelJS.Workbook, regels: ExportRij[], extra: ExtraContext): void {
  const blad = boek.addWorksheet("Aanbod", { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });

  blad.columns = KOLOMMEN.map((k) => ({ header: k.kop, key: k.kop, width: k.breedte }));
  blad.getRow(1).font = { bold: true };
  blad.getRow(1).alignment = { vertical: "middle", wrapText: true };
  blad.getRow(1).height = 28;

  for (const regel of regels) {
    blad.addRow(KOLOMMEN.map((k) => k.waarde(regel, extra)));
  }

  // Formaten per kolom, na het vullen: Excel toont een datum anders als een getal.
  KOLOMMEN.forEach((k, index) => {
    const kolom = blad.getColumn(index + 1);
    if (k.kop === "Veilingdatum") kolom.numFmt = "dd-mm-yyyy";
    else if (k.toelichting.includes("DateTime") || k.kop.includes("gezien")) {
      kolom.numFmt = "dd-mm-yyyy hh:mm";
    } else if (k.kop === "Prijs per stuk" || k.kop === "Totaalwaarde") kolom.numFmt = "#,##0.0000";
    else if (k.kop === "Stuks") kolom.numFmt = "#,##0";
  });

  blad.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: KOLOMMEN.length } };
}

function bouwVeldenblad(
  boek: ExcelJS.Workbook,
  vulgraad: { veld: string; gevuld: number; totaal: number; uniek: number }[],
): void {
  const blad = boek.addWorksheet("Velden", { views: [{ state: "frozen", ySplit: 1 }] });
  blad.columns = [
    { header: "Veld", key: "veld", width: 26 },
    { header: "Gevuld", key: "gevuld", width: 12 },
    { header: "Van totaal", key: "totaal", width: 12 },
    { header: "Percentage", key: "pct", width: 12 },
    { header: "Unieke waarden", key: "uniek", width: 16 },
    { header: "Toelichting", key: "toelichting", width: 70 },
  ];
  blad.getRow(1).font = { bold: true };

  const perVeld = new Map(KOLOMMEN.map((k) => [k.toelichting.split(" ")[0].replace(/[.,]$/, ""), k.toelichting]));

  for (const v of vulgraad) {
    blad.addRow({
      veld: v.veld,
      gevuld: v.gevuld,
      totaal: v.totaal,
      pct: v.totaal === 0 ? 0 : v.gevuld / v.totaal,
      uniek: v.uniek || null,
      toelichting: perVeld.get(v.veld) ?? "",
    });
  }

  blad.getColumn("pct").numFmt = "0.0%";
  blad.getColumn("gevuld").numFmt = "#,##0";
  blad.getColumn("totaal").numFmt = "#,##0";
  blad.getColumn("uniek").numFmt = "#,##0";
}

interface KenmerkStatistiek {
  code: string;
  regels: number;
  unieke: number;
  waarden: string;
}

/**
 * Alle VBN-kenmerkcodes die in het archief voorkomen, geteld over aanbodregels in plaats van
 * over artikelen: een code die op duizend artikelen zit die nooit worden aangeboden is minder
 * interessant dan een code op honderd artikelen die dagelijks langskomen.
 */
async function haalKenmerkStatistiek(): Promise<KenmerkStatistiek[]> {
  return prisma.$queryRaw<KenmerkStatistiek[]>`
    SELECT
      c->>'vbnCode' AS code,
      count(*)::int AS regels,
      count(DISTINCT c->>'vbnValueCode')::int AS unieke,
      string_agg(DISTINCT c->>'vbnValueCode', ', ' ORDER BY c->>'vbnValueCode') AS waarden
    FROM "SupplyLine" sl
    JOIN "TradeItem" t ON t."tradeItemId" = sl."tradeItemId",
         jsonb_array_elements(t.characteristics::jsonb) AS c
    GROUP BY 1
    ORDER BY 2 DESC
  `;
}

const BEKENDE_CODES: Record<string, string> = {
  S20: "Lengte in cm. Afgeleid uit de data: van 129 artikelen met een cm-maat in hun naam kwam " +
    "S20 er 124 mee overeen (96%). Meest voorkomend: 80, 70, 60 en 50 cm.",
  S98: "Kwaliteitsklasse. Alleen A1, A2, B1 en NV komen voor.",
  S62: "Land van herkomst, als ISO-landcode.",
};

function bouwKenmerkenblad(boek: ExcelJS.Workbook, statistiek: KenmerkStatistiek[]): void {
  const blad = boek.addWorksheet("Kenmerken", { views: [{ state: "frozen", ySplit: 3 }] });
  blad.columns = [
    { header: "", width: 9 },
    { header: "", width: 13 },
    { header: "", width: 10 },
    { header: "", width: 46 },
    { header: "", width: 60 },
  ];

  const kop = blad.addRow([
    "Kenmerken van artikelen: VBN-code en waarde. De API levert geen namen bij deze codes.",
  ]);
  kop.font = { bold: true };
  blad.addRow([]);

  const rubriek = blad.addRow(["Code", "Aanbodregels", "Waarden", "Betekenis", "Waarden die voorkomen"]);
  rubriek.font = { bold: true };

  const totaal = statistiek.reduce((max, s) => Math.max(max, s.regels), 0);
  for (const s of statistiek) {
    const rij = blad.addRow([
      s.code,
      s.regels,
      s.unieke,
      BEKENDE_CODES[s.code] ?? "",
      s.waarden.length > 300 ? s.waarden.slice(0, 300) + " ..." : s.waarden,
    ]);
    rij.getCell(4).alignment = { wrapText: true, vertical: "top" };
    rij.getCell(5).alignment = { wrapText: true, vertical: "top" };
    if (BEKENDE_CODES[s.code]) rij.getCell(1).font = { bold: true };
    if (s.regels === totaal) rij.getCell(2).font = { bold: true };
  }
  blad.getColumn(2).numFmt = "#,##0";
}

function bouwToelichtingblad(
  boek: ExcelJS.Workbook,
  info: { selectie: string; rijen: number; maxGroep: number; database: string; bevindingen: string[] },
): void {
  const blad = boek.addWorksheet("Toelichting");
  blad.columns = [{ width: 26 }, { width: 100 }];

  const zet = (label: string, tekst: string, vet = false) => {
    const rij = blad.addRow([label, tekst]);
    rij.getCell(1).font = { bold: true };
    rij.getCell(2).alignment = { wrapText: true, vertical: "top" };
    if (vet) rij.getCell(2).font = { bold: true };
  };

  zet("Gemaakt op", new Date().toLocaleString("nl-NL"));
  zet("Database", info.database);
  zet("Selectie", info.selectie);
  zet("Rijen gevraagd", String(info.rijen));
  if (!info.selectie.startsWith("recent")) {
    zet("Grootste groep", `maximaal ${info.maxGroep} regels`);
  }
  blad.addRow([]);

  zet("Herkomst", "");
  blad.addRow(["", "De regels komen uit onze eigen database, gevuld vanuit de Floriday customers-API " +
    "(endpoint /auction/clock-presales-supply/sync). Gemeten op een verse pagina van duizend records " +
    "levert die API precies de vijfentwintig velden die wij ook opslaan; bij het opslaan van een " +
    "aanbodregel gaat niets verloren."]).getCell(2).alignment = { wrapText: true, vertical: "top" };
  blad.addRow(["", "Een aanbodregel staat echter niet alleen: er hangen een artikel (TradeItem) en " +
    "een kweker (Organization) aan, elk met eigen velden. Deze export bevat elk veld van alle drie " +
    "de tabellen. Twee daarvan zijn samengevat in plaats van uitgeschreven, omdat het lijsten zijn: " +
    "van de foto's staan het aantal en de primaire url erin, van de verpakkingsvormen het aantal " +
    "plus de primaire uitgesplitst. De kenmerken van het artikel staan wél volledig in de kolom " +
    "\"Alle kenmerken\", en het blad Kenmerken telt ze over het hele archief."])
    .getCell(2).alignment = { wrapText: true, vertical: "top" };
  blad.addRow([]);

  zet("Wat opvalt", "");
  for (const b of info.bevindingen) {
    blad.addRow(["", b]).getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
  blad.addRow([]);

  zet("Kolombron", "");
  for (const soort of ["floriday", "opgezocht", "afgeleid"] as const) {
    const uitleg = {
      floriday: "Rechtstreeks uit de API, veldnaam staat in de toelichting.",
      opgezocht: "Uit een andere tabel bijgezocht (kweker of artikel); leeg als die nog niet opgehaald is.",
      afgeleid: "Door ons berekend of bijgehouden, staat niet in de API.",
    }[soort];
    const kolommen = KOLOMMEN.filter((k) => k.bron === soort).map((k) => k.kop).join(", ");
    blad.addRow(["", `${soort}: ${uitleg}`]).getCell(2).font = { bold: true };
    blad.addRow(["", kolommen]).getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
}

async function main(): Promise<void> {
  const rijen = readNumberFlag("rijen", 1000);
  const maxGroep = readNumberFlag("maxgroep", 25);
  const selectieVlag = readFlag("selectie") ?? "reeksen";

  if (!["reeksen", "bon", "recent", "beschikbaar", "mutaties"].includes(selectieVlag)) {
    console.error(
      `--selectie verwacht "reeksen", "bon", "recent", "beschikbaar" of "mutaties", ` +
        `kreeg "${selectieVlag}".`,
    );
    process.exit(1);
  }

  const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const doel = readFlag("uit") ?? `export/aanbod-${selectieVlag}-${stempel}.xlsx`;

  console.log(`Selectie: ${selectieVlag}, maximaal ${rijen} rijen.`);

  const regels = selectieVlag === "reeksen"
    ? await selecteerOpReeksen(rijen, maxGroep)
    : selectieVlag === "bon"
      ? await selecteerOpBon(rijen, maxGroep)
      : selectieVlag === "beschikbaar"
        ? await selecteerBeschikbaar(rijen)
        : selectieVlag === "mutaties"
          ? await selecteerMutaties(rijen)
          : await selecteerRecent(rijen);

  if (regels.length === 0) {
    console.error("Geen regels gevonden. Is het archief gevuld?");
    process.exit(1);
  }

  console.log(`${regels.length} regels opgehaald; kwekers en artikelen erbij zoeken...`);
  const extra = await haalContext(regels);

  const zonderKweker = regels.filter((r) => !extra.kwekers.has(r.supplierOrganizationId)).length;
  const zonderArtikel = regels.filter((r) => !extra.artikelen.has(r.tradeItemId)).length;

  console.log("Vulgraad en kenmerken meten over het hele archief...");
  const [vulgraad, kenmerkStatistiek] = await Promise.all([haalVulgraad(), haalKenmerkStatistiek()]);

  const [tellingen] = await prisma.$queryRaw<
    { regels: bigint; versies: bigint; gewijzigd: bigint; bonnen: bigint; bonMeerKwekers: bigint }[]
  >`
    SELECT
      (SELECT count(*) FROM "SupplyLine") AS regels,
      (SELECT count(*) FROM "SupplyLineVersion") AS versies,
      (SELECT count(*) FROM "SupplyLine" WHERE "lastModifiedDateTime" IS NOT NULL) AS gewijzigd,
      (SELECT count(*) FROM (
        SELECT "deliveryNoteReference" FROM "SupplyLine"
        WHERE "deliveryNoteReference" IS NOT NULL AND "deliveryNoteReference" <> ''
        GROUP BY 1) t) AS bonnen,
      (SELECT count(*) FROM (
        SELECT "deliveryNoteReference" FROM "SupplyLine"
        WHERE "deliveryNoteReference" IS NOT NULL AND "deliveryNoteReference" <> ''
        GROUP BY 1 HAVING count(DISTINCT "supplierOrganizationId") > 1) t) AS "bonMeerKwekers"
  `;

  const [levend] = await prisma.$queryRaw<
    { av: bigint; van: Date | null; tot: Date | null; kwekers: bigint; artikelen: bigint; gezien: Date }[]
  >`
    SELECT
      count(*) FILTER (WHERE status = 'AVAILABLE') AS av,
      min("auctionDate") FILTER (WHERE status = 'AVAILABLE') AS van,
      max("auctionDate") FILTER (WHERE status = 'AVAILABLE') AS tot,
      count(DISTINCT "supplierOrganizationId") FILTER (WHERE status = 'AVAILABLE') AS kwekers,
      count(DISTINCT "tradeItemId") FILTER (WHERE status = 'AVAILABLE') AS artikelen,
      max("lastSeenAt") AS gezien
    FROM "SupplyLine"
  `;

  const nl = (n: bigint) => Number(n).toLocaleString("nl-NL");
  const dag = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "-");
  const pct = (deel: bigint, geheel: bigint) =>
    `${((Number(deel) / Number(geheel)) * 100).toFixed(1)}%`;

  const bevindingen = [
    `Bijna alles in dit archief staat op UNAVAILABLE: slechts ${nl(levend.av)} van de ` +
      `${nl(tellingen.regels)} regels is AVAILABLE, een tiende procent. Dat is geen fout in de ` +
      `selectie - een regel wordt UNAVAILABLE zodra hij verkocht of verlopen is, en het archief ` +
      `bestaat vrijwel geheel uit afgehandeld aanbod. Wie het levende aanbod wil zien, draait ` +
      `"npm run export-aanbod -- --selectie beschikbaar".`,
    `Dat levende aanbod is klein en smal: ${nl(levend.av)} regels van ${nl(levend.kwekers)} kwekers ` +
      `over ${nl(levend.artikelen)} artikelen, met veilingdatums van ${dag(levend.van)} tot ` +
      `${dag(levend.tot)}. Dat laatste is opvallend - er zit aanbod bij met een veilingdatum bijna ` +
      `een jaar vooruit. De laatste geslaagde synchronisatie was ${dag(levend.gezien)}, dus dit is ` +
      `de stand van toen en niet van vandaag.`,
    `Het archief bevat ${nl(tellingen.regels)} aanbodregels en ${nl(tellingen.versies)} versies - ` +
      `precies evenveel. Van geen enkele regel is ooit een tweede versie gezien. Dat komt doordat de ` +
      `backfill historische data ophaalde: die regels waren al klaar toen wij ze voor het eerst zagen.`,
    `Toch is ${nl(tellingen.gewijzigd)} regels (${pct(tellingen.gewijzigd, tellingen.regels)}) ná ` +
      `aanmaak nog gewijzigd - de mediaan ligt op zo'n 29 uur na aanmaken. Die wijzigingen hebben ` +
      `plaatsgevonden, wij hebben alleen de eindstand. De kolom "Gewijzigd na (uur)" laat per regel ` +
      `zien of en wanneer dat gebeurde.`,
    `Het bonnummer identificeert geen partij. Er zijn ${nl(tellingen.bonnen)} verschillende ` +
      `afleverbonnen, waarvan er ${nl(tellingen.bonMeerKwekers)} bij meer dan één kweker voorkomen. ` +
      `De combinatie bon + kweker + veilingdatum levert 478.605 groepen op waarvan er maar 122 meer ` +
      `dan één regel hebben: een partij is vrijwel altijd precies één aanbodregel. Regels met ` +
      `hetzelfde bonnummer zijn dus meestal onafhankelijk van elkaar.`,
    `Een verse pagina van duizend opeenvolgende records uit de API bevatte duizend verschillende ` +
      `aanbodregels, zonder enige herhaling - de synchronisatiestroom levert geen mutatiegeschiedenis.`,
    `Productlengte zit niet in de aanbodregel maar in de kenmerken van het artikel, als VBN-code ` +
      `S20. De API levert geen namen bij die codes; dat S20 de lengte in centimeters is, is ` +
      `afgeleid door de codes te vergelijken met artikelnamen die hun maat zelf noemen - 124 van ` +
      `129 kwamen exact overeen. Meest voorkomend zijn 80, 70, 60 en 50 cm. Van alle aanbodregels ` +
      `heeft 57,3% een lengte; de rest zijn producten waarvoor lengte niet geldt, zoals potplanten. ` +
      `Het blad Kenmerken toont alle codes die voorkomen, ook die waarvan wij de betekenis niet ` +
      `kennen - een goede lijst om bij Floriday langs te lopen.`,
  ];
  if (zonderKweker > 0) {
    bevindingen.push(`${zonderKweker} van de ${regels.length} regels verwijzen naar een kweker die ` +
      `nog niet in onze organisatietabel staat; die cellen zijn leeg.`);
  }
  if (zonderArtikel > 0) {
    bevindingen.push(`${zonderArtikel} van de ${regels.length} regels verwijzen naar een artikel dat ` +
      `nog niet is opgehaald; die cellen zijn leeg.`);
  }

  const boek = new ExcelJS.Workbook();
  boek.creator = "Floriday middleware";
  boek.created = new Date();

  bouwAanbodblad(boek, regels, extra);
  bouwVeldenblad(boek, vulgraad);
  bouwKenmerkenblad(boek, kenmerkStatistiek);
  const selectieTekst = {
    reeksen: `reeksen (dezelfde kweker + hetzelfde artikel, 2 t/m ${maxGroep} regels, langste eerst, ` +
      `op veilingdatum)`,
    bon: `bon (afleverbonnen met 2 t/m ${maxGroep} regels, grootste eerst)`,
    recent: "recent (hoogste volgnummers)",
    beschikbaar: "beschikbaar (alleen status AVAILABLE, op veilingdatum)",
    mutaties: "mutaties (regels met meer dan een versie, alle versies onder elkaar)",
  }[selectieVlag] as string;

  bouwToelichtingblad(boek, {
    selectie: selectieTekst,
    rijen,
    maxGroep,
    // Alleen de hostnaam: genoeg om te zien welke omgeving dit was, zonder gebruiker,
    // wachtwoord of verbindingsparameters mee te sturen in een bestand dat rondgemaild wordt.
    database: (() => {
      try {
        return new URL(process.env.DATABASE_URL ?? "").hostname;
      } catch {
        return "onbekend";
      }
    })(),
    bevindingen,
  });

  mkdirSync(dirname(doel), { recursive: true });
  const buffer = await boek.xlsx.writeBuffer();
  writeFileSync(doel, Buffer.from(buffer));

  const partijen = new Set(regels.map((r) => r.deliveryNoteReference).filter(Boolean)).size;
  console.log("");
  console.log(`Geschreven: ${doel}`);
  console.log(`  ${regels.length} regels over ${partijen} afleverbonnen`);
  console.log(`  ${KOLOMMEN.length} kolommen over ${boek.worksheets.length} tabbladen: ` +
    boek.worksheets.map((w) => w.name).join(", "));

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

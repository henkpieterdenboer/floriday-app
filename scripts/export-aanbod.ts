/**
 * Dumpt een steekproef uit het aanbodarchief naar Excel, met alle velden die Floriday
 * levert - niets weggelaten, niets samengevat.
 *
 * Bedoeld om zelf door de data te lopen en om vragen aan Floriday mee te onderbouwen.
 *
 * Gebruik:
 *   npm run export-aanbod
 *   npm run export-aanbod -- --rijen 2000
 *   npm run export-aanbod -- --selectie recent
 *   npm run export-aanbod -- --maxpartij 100
 *   npm run export-aanbod -- --env .env.lokaal-productie
 *
 * Drie manieren van selecteren:
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
}

interface Artikel {
  name: string;
  vbnProductCode: string | null;
  code: string | null;
  gtin: string | null;
  botanicalNames: string[];
  countryOfOriginIsoCodes: string[];
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

async function haalContext(regels: ExportRij[]): Promise<ExtraContext> {
  const kwekerIds = [...new Set(regels.map((r) => r.supplierOrganizationId))];
  const artikelIds = [...new Set(regels.map((r) => r.tradeItemId))];
  const bonnen = [...new Set(regels.map((r) => r.deliveryNoteReference).filter((b): b is string => !!b))];

  const reeksen = [...new Set(regels.map((r) => `${r.supplierOrganizationId}|${r.tradeItemId}`))]
    .map((s) => s.split("|") as [string, string]);

  const [kwekerRijen, artikelRijen, bonRijen, reeksRijen] = await Promise.all([
    prisma.organization.findMany({
      where: { organizationId: { in: kwekerIds } },
      select: {
        organizationId: true, name: true, commercialName: true, city: true,
        countryCode: true, companyGln: true, rfhRelationId: true, organizationType: true,
      },
    }),
    prisma.tradeItem.findMany({
      where: { tradeItemId: { in: artikelIds } },
      select: {
        tradeItemId: true, name: true, vbnProductCode: true, code: true, gtin: true,
        botanicalNames: true, countryOfOriginIsoCodes: true,
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
    "levert die API precies de vijfentwintig velden die wij ook opslaan - er wordt niets weggelaten " +
    "bij het opslaan."]).getCell(2).alignment = { wrapText: true, vertical: "top" };
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

  if (!["reeksen", "bon", "recent"].includes(selectieVlag)) {
    console.error(`--selectie verwacht "reeksen", "bon" of "recent", kreeg "${selectieVlag}".`);
    process.exit(1);
  }

  const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const doel = readFlag("uit") ?? `export/aanbod-${selectieVlag}-${stempel}.xlsx`;

  console.log(`Selectie: ${selectieVlag}, maximaal ${rijen} rijen.`);

  const regels = selectieVlag === "reeksen"
    ? await selecteerOpReeksen(rijen, maxGroep)
    : selectieVlag === "bon"
      ? await selecteerOpBon(rijen, maxGroep)
      : await selecteerRecent(rijen);

  if (regels.length === 0) {
    console.error("Geen regels gevonden. Is het archief gevuld?");
    process.exit(1);
  }

  console.log(`${regels.length} regels opgehaald; kwekers en artikelen erbij zoeken...`);
  const extra = await haalContext(regels);

  const zonderKweker = regels.filter((r) => !extra.kwekers.has(r.supplierOrganizationId)).length;
  const zonderArtikel = regels.filter((r) => !extra.artikelen.has(r.tradeItemId)).length;

  console.log("Vulgraad per veld meten over het hele archief...");
  const vulgraad = await haalVulgraad();

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

  const nl = (n: bigint) => Number(n).toLocaleString("nl-NL");
  const pct = (deel: bigint, geheel: bigint) =>
    `${((Number(deel) / Number(geheel)) * 100).toFixed(1)}%`;

  const bevindingen = [
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
  const selectieTekst = {
    reeksen: `reeksen (dezelfde kweker + hetzelfde artikel, 2 t/m ${maxGroep} regels, langste eerst, ` +
      `op veilingdatum)`,
    bon: `bon (afleverbonnen met 2 t/m ${maxGroep} regels, grootste eerst)`,
    recent: "recent (hoogste volgnummers)",
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
  console.log(`  ${KOLOMMEN.length} kolommen, drie tabbladen (Aanbod, Velden, Toelichting)`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

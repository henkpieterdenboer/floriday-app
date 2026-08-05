import { prisma } from "@/lib/db";
import { SUPPLY_RESOURCE, ORGANIZATION_RESOURCE } from "@/features/floriday/sync/cursor";
import { createCustomersClient } from "@/features/floriday/client";

export interface RunRegel {
  id: string;
  trigger: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  pagesProcessed: number;
  rowsProcessed: number;
  versionsAdded: number;
  errorMessage: string | null;
  warning: string | null;
}

export interface GewijzigdeRegel {
  supplyLineId: string;
  observedAt: Date;
  sequenceNumber: bigint;
  artikel: string | null;
  kweker: string | null;
  status: string;
  numberOfPieces: number;
  pricePerPiece: unknown;
  auctionDate: Date;
  /** Hoeveelste beeld van deze aanbodregel dit is; 1 betekent nieuw. */
  versie: number;
}

export interface ArchiefTelling {
  regels: number;
  versies: number;
  artikelen: number;
  organisaties: number;
  beschikbaar: number;
  oudsteVeildag: Date | null;
  nieuwsteVeildag: Date | null;
}

export async function haalLaatsteRuns(aantal = 10): Promise<RunRegel[]> {
  const runs = await prisma.syncRun.findMany({
    where: { resource: SUPPLY_RESOURCE },
    orderBy: { startedAt: "desc" },
    take: aantal,
  });
  return runs.map((r) => ({
    id: r.id.toString(),
    trigger: r.trigger,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    status: r.status,
    pagesProcessed: r.pagesProcessed,
    rowsProcessed: r.rowsProcessed,
    versionsAdded: r.versionsAdded,
    errorMessage: r.errorMessage,
    warning: r.warning,
  }));
}

/**
 * De laatst waargenomen wijzigingen, nieuwste eerst.
 *
 * Uit SupplyLineVersion en niet uit SupplyLine: die laatste bewaart alleen de huidige stand,
 * terwijl dit juist een logboek moet zijn van wat er binnenkwam. `versie` maakt zichtbaar of
 * een regel nieuw was of een bestaande die wijzigde - het onderscheid waar dit archief om
 * draait.
 */
export async function haalLaatsteWijzigingen(aantal = 50): Promise<GewijzigdeRegel[]> {
  return prisma.$queryRaw<GewijzigdeRegel[]>`
    SELECT
      v."supplyLineId", v."observedAt", v."sequenceNumber", v.status::text AS status,
      v."numberOfPieces", v."pricePerPiece", v."auctionDate",
      ti.name AS artikel, o.name AS kweker,
      (SELECT count(*)::int FROM "SupplyLineVersion" x
        WHERE x."supplyLineId" = v."supplyLineId" AND x."sequenceNumber" <= v."sequenceNumber"
      ) AS versie
    FROM "SupplyLineVersion" v
    LEFT JOIN "TradeItem" ti ON ti."tradeItemId" = v."tradeItemId"
    LEFT JOIN "Organization" o ON o."organizationId" = v."supplierOrganizationId"
    ORDER BY v."observedAt" DESC, v."sequenceNumber" DESC
    LIMIT ${aantal}
  `;
}

export async function haalArchiefTelling(): Promise<ArchiefTelling> {
  const [t] = await prisma.$queryRaw<
    {
      regels: bigint; versies: bigint; artikelen: bigint; organisaties: bigint;
      beschikbaar: bigint; oudste: Date | null; nieuwste: Date | null;
    }[]
  >`
    SELECT
      (SELECT count(*) FROM "SupplyLine") AS regels,
      (SELECT count(*) FROM "SupplyLineVersion") AS versies,
      (SELECT count(*) FROM "TradeItem") AS artikelen,
      (SELECT count(*) FROM "Organization") AS organisaties,
      (SELECT count(*) FROM "SupplyLine" WHERE status = 'AVAILABLE') AS beschikbaar,
      (SELECT min("auctionDate") FROM "SupplyLine") AS oudste,
      (SELECT max("auctionDate") FROM "SupplyLine") AS nieuwste
  `;
  return {
    regels: Number(t.regels),
    versies: Number(t.versies),
    artikelen: Number(t.artikelen),
    organisaties: Number(t.organisaties),
    beschikbaar: Number(t.beschikbaar),
    oudsteVeildag: t.oudste,
    nieuwsteVeildag: t.nieuwste,
  };
}

export async function haalCursors(): Promise<{ aanbod: bigint | null; organisaties: bigint | null }> {
  const rijen = await prisma.syncState.findMany({
    where: { resource: { in: [SUPPLY_RESOURCE, ORGANIZATION_RESOURCE] } },
  });
  return {
    aanbod: rijen.find((r) => r.resource === SUPPLY_RESOURCE)?.lastSequenceNumber ?? null,
    organisaties: rijen.find((r) => r.resource === ORGANIZATION_RESOURCE)?.lastSequenceNumber ?? null,
  };
}

export interface FeedStand {
  bovengrens: bigint | null;
  /** Waarom het niet lukte, als het niet lukte. Voor op het scherm, niet voor de logs. */
  fout: string | null;
}

/**
 * De bovengrens van de feed, live bij Floriday opgevraagd.
 *
 * Bewust een echte aanroep bij het laden van deze pagina en geen opgeslagen waarde: dit is
 * de enige plek waar iemand wil weten of wij nú gelijk lopen met Floriday. Eén verzoek per
 * paginabezoek, ruim binnen de limiet van 3,4 per seconde.
 *
 * Faalt netjes: zonder Floriday-gegevens - zoals op een omgeving die daar nog op wacht -
 * toont de pagina de rest gewoon.
 */
export async function haalFeedBovengrens(): Promise<FeedStand> {
  try {
    const client = createCustomersClient();
    const max = await client.getJson<number>("/auction/clock-presales-supply/max-sequence-number");
    return { bovengrens: BigInt(max), fout: null };
  } catch (error: unknown) {
    return { bovengrens: null, fout: error instanceof Error ? error.message : String(error) };
  }
}

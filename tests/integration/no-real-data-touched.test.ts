import "dotenv/config";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";

/**
 * Bewaakt dat de integratietests geen echte archiefrijen aanraken.
 *
 * Aanleiding: drie tests gebruikten de primaire sleutels uit de fixtures, en die fixtures
 * zijn echte API-antwoorden. Hun opruimstap verwijderde daardoor bij elke `npm test` 25
 * aanbodregels uit het archief. Dat is een keer echt gebeurd en niets waarschuwde ervoor -
 * het viel pas op doordat een teller 25 lager stond dan een uur eerder.
 *
 * Testrijen zijn te herkennen aan een id dat met ffffffff begint (zie
 * tests/helpers/test-ids.ts). Deze test telt alles wat daar *niet* mee begint en
 * vergelijkt dat aan het eind opnieuw. ClockSupplyLine en ClockSupplyLineVersion volgen
 * dezelfde conventie (zie write-clock-page.test.ts) en tellen hier op dezelfde manier mee.
 *
 * RfhSession is een aparte categorie: één rij met een vaste id ("default"), geen UUID, dus
 * er is geen testprefix op toe te passen. Wat hier wel telt is een credential die de
 * refresh token bevat en niet herstelbaar is zonder dat een mens opnieuw inlogt in een
 * browser (zie session-store.ts). Deze test bewaart daarom niet alleen of de rij bestaat,
 * maar ook een hash van de token, zodat een test die de sessie stilletjes overschrijft of
 * leegmaakt hier opvalt. De rauwe token wordt nooit gelogd, ook niet bij een falende
 * assertion.
 *
 * Twee dingen om te weten:
 *
 * - De telling gaat via rauwe SQL met een cast naar text. Prisma's `startsWith` werkt niet
 *   op een kolom van het type uuid.
 * - Vitest isoleert testbestanden, dus dit meet alleen wat er tijdens dit bestand gebeurt,
 *   niet wat andere bestanden in dezelfde run doen. Het vangt dus niet elk denkbaar geval
 *   af. Wat het wel doet is de aanname expliciet maken en vastleggen, zodat iemand die hier
 *   een deleteMany zonder testprefix neerzet, dat leest. De echte bescherming is de
 *   conventie; dit is de herinnering eraan.
 */

interface Counts {
  supplyLines: number;
  versions: number;
  tradeItems: number;
  organizations: number;
  clockSupplyLines: number;
  clockSupplyLineVersions: number;
}

async function countRealRows(): Promise<Counts> {
  const [row] = await prisma.$queryRaw<
    { l: bigint; v: bigint; t: bigint; o: bigint; c: bigint; cv: bigint }[]
  >`
    SELECT
      (SELECT count(*) FROM "SupplyLine"              WHERE "supplyLineId"::text      NOT LIKE 'ffffffff-%') AS l,
      (SELECT count(*) FROM "SupplyLineVersion"       WHERE "supplyLineId"::text      NOT LIKE 'ffffffff-%') AS v,
      (SELECT count(*) FROM "TradeItem"                WHERE "tradeItemId"::text       NOT LIKE 'ffffffff-%') AS t,
      (SELECT count(*) FROM "Organization"             WHERE "organizationId"::text    NOT LIKE 'ffffffff-%') AS o,
      (SELECT count(*) FROM "ClockSupplyLine"          WHERE "clockSupplyLineId"::text NOT LIKE 'ffffffff-%') AS c,
      (SELECT count(*) FROM "ClockSupplyLineVersion"   WHERE "clockSupplyLineId"::text NOT LIKE 'ffffffff-%') AS cv
  `;

  return {
    supplyLines: Number(row.l),
    versions: Number(row.v),
    tradeItems: Number(row.t),
    organizations: Number(row.o),
    clockSupplyLines: Number(row.c),
    clockSupplyLineVersions: Number(row.cv),
  };
}

/** Hasht de refresh token in plaats van hem te bewaren, zodat een falende assertion het
 * credential nooit in de testoutput of in CI-logs zet. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface SessieVingerafdruk {
  bestaat: boolean;
  tokenHash: string | null;
}

async function leesSessieVingerafdruk(): Promise<SessieVingerafdruk> {
  const rij = await prisma.rfhSession.findUnique({ where: { id: "default" } });
  return {
    bestaat: rij !== null,
    tokenHash: rij ? hashToken(rij.refreshToken) : null,
  };
}

async function countTestRows(): Promise<{ supplyLines: number; clockSupplyLines: number }> {
  const [row] = await prisma.$queryRaw<{ n: bigint; c: bigint }[]>`
    SELECT
      (SELECT count(*) FROM "SupplyLine"      WHERE "supplyLineId"::text      LIKE 'ffffffff-%') AS n,
      (SELECT count(*) FROM "ClockSupplyLine" WHERE "clockSupplyLineId"::text LIKE 'ffffffff-%') AS c
  `;
  return { supplyLines: Number(row.n), clockSupplyLines: Number(row.c) };
}

let before: Counts;
let sessieVoor: SessieVingerafdruk;

beforeAll(async () => {
  before = await countRealRows();
  sessieVoor = await leesSessieVingerafdruk();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("het archief blijft ongemoeid", () => {
  it("bevat echte data, zodat een lege database niet als succes telt", () => {
    expect(before.supplyLines).toBeGreaterThan(1000);
    expect(before.organizations).toBeGreaterThan(100);
    expect(before.clockSupplyLines).toBeGreaterThan(100);
  });

  it("telt evenveel echte rijen als aan het begin", async () => {
    expect(await countRealRows()).toEqual(before);
  });

  it("heeft geen testrijen laten staan van een eerdere run", async () => {
    // Nul is het doel: elke test ruimt zichzelf op. Blijft hier iets staan, dan is een
    // opruimstap ergens overgeslagen - hinderlijk, maar niet schadelijk.
    expect(await countTestRows()).toEqual({ supplyLines: 0, clockSupplyLines: 0 });
  });

  it("laat de RFH-sessie ongemoeid - dit credential is niet terug te halen zonder een mens in een browser", async () => {
    const sessieNa = await leesSessieVingerafdruk();
    expect(sessieNa).toEqual(sessieVoor);
  });
});

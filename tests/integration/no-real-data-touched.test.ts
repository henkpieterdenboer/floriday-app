import "dotenv/config";
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
 * vergelijkt dat aan het eind opnieuw.
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
}

async function countRealRows(): Promise<Counts> {
  const [row] = await prisma.$queryRaw<
    { l: bigint; v: bigint; t: bigint; o: bigint }[]
  >`
    SELECT
      (SELECT count(*) FROM "SupplyLine"        WHERE "supplyLineId"::text   NOT LIKE 'ffffffff-%') AS l,
      (SELECT count(*) FROM "SupplyLineVersion" WHERE "supplyLineId"::text   NOT LIKE 'ffffffff-%') AS v,
      (SELECT count(*) FROM "TradeItem"         WHERE "tradeItemId"::text    NOT LIKE 'ffffffff-%') AS t,
      (SELECT count(*) FROM "Organization"      WHERE "organizationId"::text NOT LIKE 'ffffffff-%') AS o
  `;

  return {
    supplyLines: Number(row.l),
    versions: Number(row.v),
    tradeItems: Number(row.t),
    organizations: Number(row.o),
  };
}

async function countTestRows(): Promise<number> {
  const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM "SupplyLine" WHERE "supplyLineId"::text LIKE 'ffffffff-%'
  `;
  return Number(row.n);
}

let before: Counts;

beforeAll(async () => {
  before = await countRealRows();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("het archief blijft ongemoeid", () => {
  it("bevat echte data, zodat een lege database niet als succes telt", () => {
    expect(before.supplyLines).toBeGreaterThan(1000);
    expect(before.organizations).toBeGreaterThan(100);
  });

  it("telt evenveel echte rijen als aan het begin", async () => {
    expect(await countRealRows()).toEqual(before);
  });

  it("heeft geen testrijen laten staan van een eerdere run", async () => {
    // Nul is het doel: elke test ruimt zichzelf op. Blijft hier iets staan, dan is een
    // opruimstap ergens overgeslagen - hinderlijk, maar niet schadelijk.
    expect(await countTestRows()).toBe(0);
  });
});

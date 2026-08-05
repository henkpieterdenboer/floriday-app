/**
 * Haalt één pagina op en drukt af welke records de validatie niet halen, en waarom.
 *
 * Bedoeld als onderzoeksgereedschap, niet als bewaking. De statuspagina meldt hoeveel er
 * zijn overgeslagen en bij welk volgnummer; dit script laat zien wát er precies mis was.
 * Gemiddeld gaat het om drie tot zeven records per duizend, en bij een herhaling van
 * dezelfde vraag waren ze eerder al eens verdwenen - vandaar dat het antwoord hier ook een
 * lege lijst kan zijn.
 *
 * Gebruik:
 *   npm run toon-afgekeurd -- --cursor 500520894
 *   npm run toon-afgekeurd -- --cursor 500520894 --volledig
 *   npm run toon-afgekeurd -- --env .env.lokaal-productie --cursor ...
 *
 * Het cursornummer staat in de waarschuwing bij de run op de statuspagina.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { createCustomersClient } from "@/features/floriday/client";
import { supplyLineSchema } from "@/features/floriday/schemas/supply-line";

function readFlag(naam: string): string | undefined {
  const i = process.argv.indexOf(`--${naam}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main(): Promise<void> {
  const cursor = readFlag("cursor");
  if (!cursor || !/^\d+$/.test(cursor)) {
    console.error("Gebruik: npm run toon-afgekeurd -- --cursor <volgnummer>");
    console.error("Het volgnummer staat in de waarschuwing bij de run op de statuspagina.");
    process.exit(1);
  }

  const volledig = process.argv.includes("--volledig");
  const client = createCustomersClient();

  console.log(`Pagina ophalen vanaf volgnummer ${cursor}...\n`);
  const page = await client.getJson<{ results: unknown[] }>(
    `/auction/clock-presales-supply/sync/${cursor}?limit=1000`,
  );

  const afgekeurd: { record: unknown; fouten: string[] }[] = [];
  for (const item of page.results) {
    const uitkomst = supplyLineSchema.safeParse(item);
    if (!uitkomst.success) {
      afgekeurd.push({
        record: item,
        fouten: uitkomst.error.issues.map((i) => `${i.path.join(".") || "(hele record)"}: ${i.message}`),
      });
    }
  }

  console.log(`${page.results.length} records opgehaald, ${afgekeurd.length} afgekeurd.\n`);

  if (afgekeurd.length === 0) {
    console.log("Niets afgekeurd op dit moment. Dat kan kloppen: eerder zagen we records die");
    console.log("bij een herhaling van dezelfde vraag gewoon geldig terugkwamen.");
    await prisma.$disconnect();
    return;
  }

  for (const [nummer, { record, fouten }] of afgekeurd.entries()) {
    const r = record as Record<string, unknown>;
    console.log(`--- ${nummer + 1} ---`);
    console.log(`  supplyLineId    ${String(r.supplyLineId ?? "(ontbreekt)")}`);
    console.log(`  sequenceNumber  ${String(r.sequenceNumber ?? "(ontbreekt)")}`);
    console.log(`  waarom afgekeurd:`);
    for (const f of fouten) console.log(`    - ${f}`);
    if (volledig) console.log(`  volledig record:\n${JSON.stringify(record, null, 4)}`);
    console.log("");
  }

  console.log("Geef --volledig mee om het hele record af te drukken.");
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

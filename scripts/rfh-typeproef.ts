/**
 * Measures the actual field types in clock-supply-search responses.
 *
 * Exists because the Zod schema in schemas/clock-supply.ts was first drafted from a single
 * observed record. A schema that guesses wrong fails at the worst moment - mid-run, on
 * production, on a field nobody looked at. Run this before trusting it, and after every
 * version bump of the API.
 *
 * Usage: npm run rfh-typeproef -- --dagen 20260806,20260807
 */
import "../src/lib/load-env";
import { createPreauctionClient } from "../src/features/rfh-preauction/client";
import {
  SNIJBLOEMEN_HOOFDGROEP,
  VEILLOCATIE_SLEUTELS,
} from "../src/features/rfh-preauction/sync/sneden";

function typeVan(waarde: unknown): string {
  if (waarde === null) return "null";
  if (Array.isArray(waarde)) {
    const binnen = [...new Set(waarde.map(typeVan))].sort();
    return `array<${binnen.join("|") || "leeg"}>`;
  }
  return typeof waarde;
}

async function main(): Promise<void> {
  const arg = process.argv.indexOf("--dagen");
  const dagen = arg === -1 ? ["20260807"] : process.argv[arg + 1].split(",");

  console.log(`Veildagen    : ${dagen.join(", ")}`);
  console.log(`Veillocaties : ${VEILLOCATIE_SLEUTELS.join(", ")}`);
  console.log("");

  const client = createPreauctionClient();
  const gezien = new Map<string, Set<string>>();
  let records = 0;

  for (const dag of dagen) {
    for (const locatie of VEILLOCATIE_SLEUTELS) {
      const pagina = await client.zoekKlokaanbod({
        auctionDate: dag,
        mainGroupKey: SNIJBLOEMEN_HOOFDGROEP,
        auctionLocationKey: locatie,
        skip: 0,
        take: 500,
      });

      for (const record of pagina.results as Record<string, unknown>[]) {
        records++;
        for (const [veld, waarde] of Object.entries(record)) {
          if (!gezien.has(veld)) gezien.set(veld, new Set());
          gezien.get(veld)!.add(typeVan(waarde));
        }
      }
      console.log(`${dag} ${locatie}: ${pagina.results.length} van ${pagina.totalDocuments}`);
    }
  }

  console.log(`\n${records} records, ${gezien.size} velden\n`);
  for (const veld of [...gezien.keys()].sort()) {
    const typen = [...gezien.get(veld)!].sort().join(" | ");
    console.log(`${veld.padEnd(34)} ${typen}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Measures the actual field types in clock-supply-search responses.
 *
 * Exists because the Zod schema in schemas/clock-supply.ts was first drafted from a single
 * observed record. A schema that guesses wrong fails at the worst moment - mid-run, on
 * production, on a field nobody looked at. Run this before trusting it, and after every
 * version bump of the API.
 *
 * Looks one level into plain nested objects - in practice just `organization` - and reports
 * those fields dotted, e.g. `organization.relationNumber`. That is the same blind spot that
 * let sequenceOnLoadCarrier and auctioningSequence sit in the schema as `number` for months
 * while the API sent strings: nobody had measured past the top level.
 *
 * `characteristics`, `positiveCharacteristics` and `negativeCharacteristics` are arrays of
 * objects and deliberately stay unexamined at `array<object>`, one level is not extended into
 * them. They are stored as Json and only ever displayed (schemas/clock-supply.ts explains
 * why), so their internal shape is not binding and is not worth the noise here.
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

function isPlainObject(waarde: unknown): waarde is Record<string, unknown> {
  return typeof waarde === "object" && waarde !== null && !Array.isArray(waarde);
}

/**
 * Records the type of one top-level field. A plain object - `organization` in practice - is
 * expanded one level into `veld.subveld` entries instead of being recorded as `object`; an
 * array stays whatever `typeVan` says, including `array<object>`, because arrays of objects
 * are exactly the characteristics fields the module comment above excludes from this.
 *
 * `magUitbreiden` caps the expansion at one level, on purpose: a second `organization`-shaped
 * field nested inside `organization` should show up as `organization.subveld: object`, not
 * silently keep unfolding. Nothing observed goes that deep, but the cap is what makes "one
 * level" a fact about this script rather than a hopeful description of the data.
 */
function verzamel(
  gezien: Map<string, Set<string>>,
  veld: string,
  waarde: unknown,
  magUitbreiden = true,
): void {
  if (magUitbreiden && isPlainObject(waarde)) {
    for (const [subveld, subwaarde] of Object.entries(waarde)) {
      verzamel(gezien, `${veld}.${subveld}`, subwaarde, false);
    }
    return;
  }
  if (!gezien.has(veld)) gezien.set(veld, new Set());
  gezien.get(veld)!.add(typeVan(waarde));
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
          verzamel(gezien, veld, waarde);
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

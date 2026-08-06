/**
 * One-off catch-up over the auction days RFH still holds.
 *
 * Roughly a month is available: 31 July 2026 answered with 16.729 rows while 1 July answered
 * with zero (spec §3.5). After that window the data is gone, and unlike the Floriday feed
 * there is no sequence number to come back for it with.
 *
 * The lines this fetches will mostly carry no presale link. RFH drops that reference once the
 * auction day has passed (spec §3.7), so history arrives unlinked by definition - that is
 * expected, not a bug, and it is exactly why the five-minute sync matters more than this
 * script: only the sync catches a line while its presale link still exists.
 *
 * One runClockSync per day rather than one run over all of them: each day gets its own
 * SyncRun row, so a failure halfway is visible per day instead of as one opaque failure, and
 * re-running a single day is a matter of narrowing the range.
 *
 * Usage:
 *   npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05
 *   npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05 --env .env.lokaal-productie
 *
 * Without --env this writes to the test database. The target is printed before anything
 * happens - see load-env.ts.
 *
 * The load-env import must stay first: imports run in declaration order, and both the
 * Prisma client and getRfhEnv() read their configuration at module load.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { runClockSync } from "@/features/rfh-preauction/sync/run-clock-sync";
import { veildagSleutel } from "@/features/rfh-preauction/sync/veildagen";

function argument(naam: string): string | undefined {
  const i = process.argv.indexOf(`--${naam}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function dagenTussen(vanaf: string, tot: string): string[] {
  const dagen: string[] = [];
  // Step from midday, for the same daylight-saving reason as veildagenVoorRun.
  let cursor = new Date(`${vanaf}T12:00:00.000Z`);
  const einde = new Date(`${tot}T12:00:00.000Z`);
  while (cursor <= einde) {
    dagen.push(veildagSleutel(cursor));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return dagen;
}

async function main(): Promise<void> {
  const vanaf = argument("vanaf");
  const tot = argument("tot");
  if (!vanaf || !tot) {
    console.error("Gebruik: npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05");
    process.exit(1);
  }

  const dagen = dagenTussen(vanaf, tot);
  console.log(`${dagen.length} veildagen, van ${dagen[0]} tot ${dagen.at(-1)}`);
  console.log("");

  // One run per day rather than one run over all of them: each day gets its own SyncRun row,
  // so a failure halfway is visible per day instead of as one opaque failure, and re-running
  // a single day is a matter of narrowing the range.
  let ietsMislukt = false;
  for (const dag of dagen) {
    const uit = await runClockSync({
      trigger: "BACKFILL",
      veildagen: [dag],
      onProgress: (bericht) => console.log(`  ${bericht}`),
    });
    if (uit.mislukteSneden.length > 0) ietsMislukt = true;
    console.log(
      `${dag}: ${uit.rowsProcessed} regels, ${uit.versionsAdded} versies` +
        (uit.onvolledigeSneden.length > 0
          ? `, ONVOLLEDIG: ${uit.onvolledigeSneden.map((s) => s.auctionLocationKey).join(", ")}`
          : "") +
        // Anders dan ONVOLLEDIG (wél data, niet compleet): dit zijn sneden waarvan het ophalen
        // zelf misging. runClockSync gaat door met de rest, maar deze dag is niet compleet.
        (uit.mislukteSneden.length > 0
          ? `, MISLUKT: ${uit.mislukteSneden.map((s) => `${s.auctionLocationKey} (${s.fout.message})`).join(", ")}`
          : ""),
    );
  }

  if (ietsMislukt) {
    console.error("\nEén of meer sneden zijn mislukt - zie MISLUKT hierboven.");
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/**
 * One-off catch-up from sequence zero. Runs locally so there is no serverless timeout;
 * it may take as long as it takes. Safe to interrupt and rerun: the cursor is stored
 * after every page and rewriting a page adds no duplicate versions.
 *
 * Usage:
 *   npm run backfill                 full run
 *   npm run backfill -- --pages 5    stop after five pages, for a first try
 *   npm run backfill -- --reset      start over from sequence zero
 *   npm run backfill -- --items-only only close gaps in the trade item lookup
 *   npm run backfill -- --env .env.lokaal-productie   run against another environment
 *
 * Without --env this writes to the test database. The target is printed before anything
 * happens, because this is the script where the wrong database does the most damage:
 * pointing staging credentials at the production database would fill the production
 * archive with test data, and the two cannot be separated again afterwards.
 *
 * The load-env import must stay first: imports run in declaration order, and both the
 * Prisma client and getEnv() read their configuration at module load.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { createCustomersClient } from "@/features/floriday/client";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { runOrganizationSync } from "@/features/floriday/sync/run-organization-sync";
import { fetchMissingTradeItems } from "@/features/floriday/sync/trade-items";
import {
  findKnownTradeItemIds,
  findSupplyLinesWithoutTradeItem,
  saveTradeItems,
} from "@/features/floriday/sync/trade-items-store";
import { SUPPLY_RESOURCE, ORGANIZATION_RESOURCE, writeCursor } from "@/features/floriday/sync/cursor";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
}

/**
 * A bare wall of "wrote page: N rows" lines is useless over a twenty minute run.
 * Instead accumulate counts from each page's progress message and only print a summary
 * every REPORT_INTERVAL_MS (or every REPORT_INTERVAL_PAGES pages, whichever comes first),
 * so a long run still proves it is alive without flooding the terminal.
 */
function createProgressReporter(label: string): (message: string) => void {
  const REPORT_INTERVAL_MS = 15_000;
  const REPORT_INTERVAL_PAGES = 25;

  const startedAt = Date.now();
  let pageCount = 0;
  let cumulativeRows = 0;
  let cumulativeVersions = 0;
  let sawVersions = false;
  let lastReportAt = startedAt;
  let lastReportPage = 0;

  return (message: string) => {
    pageCount += 1;

    const rowsMatch = /(\d+) rows/.exec(message);
    if (rowsMatch) cumulativeRows += Number(rowsMatch[1]);

    const versionsMatch = /(\d+) new versions/.exec(message);
    if (versionsMatch) {
      sawVersions = true;
      cumulativeVersions += Number(versionsMatch[1]);
    }

    const now = Date.now();
    const dueByTime = now - lastReportAt >= REPORT_INTERVAL_MS;
    const dueByPages = pageCount - lastReportPage >= REPORT_INTERVAL_PAGES;

    if (dueByTime || dueByPages) {
      const versionsPart = sawVersions ? `, ${cumulativeVersions} versions` : "";
      console.log(
        `  [${label}] ${pageCount} pages, ${cumulativeRows} rows${versionsPart}` +
          ` (${formatElapsed(now - startedAt)} elapsed)`,
      );
      lastReportAt = now;
      lastReportPage = pageCount;
    }
  };
}

/**
 * Fetches every trade item a stored supply line points at but the lookup table lacks.
 *
 * Deliberately driven by a database query rather than by what the sync run just touched.
 * A backfill of over a million rows gets interrupted - by a timeout, a laptop lid, a
 * network hiccup - and whatever ids that run was holding in memory die with it. Asking
 * the database instead means the gap is always visible and always closable, no matter how
 * many partial runs preceded this one.
 */
async function closeTradeItemGaps(): Promise<number> {
  const missing = await findSupplyLinesWithoutTradeItem();
  if (missing.length === 0) {
    console.log("  no gaps in the trade item lookup");
    return 0;
  }

  console.log(`  ${missing.length} referenced trade items not stored yet, fetching...`);

  const added = await fetchMissingTradeItems({
    client: createCustomersClient(),
    tradeItemIds: missing,
    findKnownIds: findKnownTradeItemIds,
    saveTradeItems,
    now: () => new Date(),
  });

  // A residue is normal and does not shrink on retry. Two causes seen against staging:
  // a placeholder all-zero id that returns 404, and ids that return 403 because they
  // belong to trade items this organisation has no rights to - customer-specific items
  // of other buyers. Roughly 0.09% of referenced items. Reported rather than left silent,
  // so a sudden jump is noticeable instead of looking like normal background noise.
  const unavailable = missing.length - added;
  if (unavailable > 0) {
    console.log(
      `  ${unavailable} could not be fetched (404 or 403 from Floriday) and will be` +
        ` reported again on the next run`,
    );
  }

  return added;
}

async function main(): Promise<void> {
  const startedAt = Date.now();

  if (process.argv.includes("--items-only")) {
    console.log("Closing gaps in the trade item lookup...");
    const added = await closeTradeItemGaps();
    console.log(`Done: ${added} trade items added in ${formatElapsed(Date.now() - startedAt)}`);
    await prisma.$disconnect();
    return;
  }

  if (process.argv.includes("--reset")) {
    await writeCursor(SUPPLY_RESOURCE, 0n);
    await writeCursor(ORGANIZATION_RESOURCE, 0n);
    console.log("Cursors reset to 0");
  }

  const pagesFlag = readFlag("pages");
  const maxPages = pagesFlag ? Number(pagesFlag) : undefined;

  console.log("Syncing organizations...");
  const organizations = await runOrganizationSync({
    trigger: "BACKFILL",
    maxPages,
    onProgress: createProgressReporter("organizations"),
  });
  console.log(`  ${organizations.rowsProcessed} rows in ${organizations.pagesProcessed} pages`);
  if (organizations.warning) console.log(`  warning: ${organizations.warning}`);

  console.log("Syncing clock presales supply...");
  const result = await runSupplySync({
    trigger: "BACKFILL",
    maxPages,
    onProgress: createProgressReporter("supply"),
  });

  // Runs regardless of how the supply sync ended, so an interrupted earlier run still
  // gets its trade items eventually.
  console.log("Closing gaps in the trade item lookup...");
  const gapsClosed = await closeTradeItemGaps();

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log("");
  console.log(`Done in ${seconds}s`);
  console.log(`  gap fill:     ${gapsClosed} trade items`);
  console.log(`  pages:        ${result.pagesProcessed}`);
  console.log(`  rows:         ${result.rowsProcessed}`);
  console.log(`  versions:     ${result.versionsAdded}`);
  console.log(`  duplicates:   ${result.duplicatesCollapsed}`);
  console.log(`  trade items:  ${result.tradeItemsAdded}`);
  console.log(`  cursor:       ${result.cursor}`);
  console.log(`  reached end:  ${result.reachedEnd}`);
  if (result.warning) console.log(`  warning:      ${result.warning}`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

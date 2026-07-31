/**
 * One-off catch-up from sequence zero. Runs locally so there is no serverless timeout;
 * it may take as long as it takes. Safe to interrupt and rerun: the cursor is stored
 * after every page and rewriting a page adds no duplicate versions.
 *
 * Usage:
 *   npm run backfill              full run
 *   npm run backfill -- --pages 5 stop after five pages, for a first try
 *   npm run backfill -- --reset   start over from sequence zero
 */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { runOrganizationSync } from "@/features/floriday/sync/run-organization-sync";
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

async function main(): Promise<void> {
  const startedAt = Date.now();

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

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log("");
  console.log(`Done in ${seconds}s`);
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

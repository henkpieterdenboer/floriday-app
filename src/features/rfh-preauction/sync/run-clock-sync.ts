import type { SyncTrigger } from "@prisma/client";
import { createPreauctionClient } from "@/features/rfh-preauction/client";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";
import { snedenVoor, type Snede } from "@/features/rfh-preauction/sync/sneden";
import { veildagenVoorRun } from "@/features/rfh-preauction/sync/veildagen";
import { syncSnede, type SyncSnedeResult } from "@/features/rfh-preauction/sync/clock-supply";
import { writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";

/** The resource name in SyncRun. Distinct from SUPPLY_RESOURCE so the status page can tell them apart. */
export const KLOK_RESOURCE = "rfh-clock-supply";

export interface RunClockSyncOptions {
  trigger: SyncTrigger;
  /** Overrides which auction days to walk. The backfill script passes an explicit list. */
  veildagen?: readonly string[];
  onProgress?: (message: string) => void;
}

export interface RunClockSyncResult {
  snedenVerwerkt: number;
  rowsProcessed: number;
  versionsAdded: number;
  onvolledigeSneden: Snede[];
}

export interface RunClockSyncDeps {
  syncSnede: (args: { snede: Snede }) => Promise<SyncSnedeResult>;
  startRun: (trigger: SyncTrigger) => Promise<bigint>;
  finishRun: typeof finishRun;
  now: () => Date;
}

/**
 * Walks every slice of every auction day in scope.
 *
 * Slices are walked in order and each one is written before the next is fetched, so a run
 * that dies halfway leaves everything it already committed intact. There is no cursor to
 * resume from - and none is needed, because the next run simply asks for the same days
 * again and upserts over its own work.
 *
 * **Sequential is a requirement, not a style choice.** http.ts deliberately has no rate
 * limiter, and the argument for leaving it out is that a run is a few dozen requests
 * spread over seconds. That argument only holds while slices go one at a time. Fan these
 * out with Promise.all and the justification evaporates, with nothing left to catch it -
 * against a partner's undocumented API, on a personal session. If this ever needs to be
 * faster, add the limiter first.
 *
 * An incomplete slice is a warning, not a failure. This feed has no max-sequence endpoint,
 * so "did we get everything" can only be answered by comparing against totalDocuments per
 * slice; reporting that comparison is the closest thing to a completeness proof available
 * (spec §9).
 */
export async function runClockSyncWith(
  options: RunClockSyncOptions,
  deps: RunClockSyncDeps,
): Promise<RunClockSyncResult> {
  const runId = await deps.startRun(options.trigger);

  const veildagen = options.veildagen ?? veildagenVoorRun(deps.now());
  const sneden = snedenVoor(veildagen);

  let rowsProcessed = 0;
  let versionsAdded = 0;
  const onvolledigeSneden: Snede[] = [];

  try {
    for (const snede of sneden) {
      // Verrijk de fout met de snede voordat hij naar boven gaat. postJson kent alleen het
      // pad, en dat is voor deze API altijd dezelfde literal - twee mislukkingen op
      // verschillende veildagen leveren anders bijna identieke tekst op in
      // SyncRun.errorMessage en op de statuspagina.
      const uit = await deps
        .syncSnede({ snede })
        .catch((fout: unknown) => {
          const bericht = fout instanceof Error ? fout.message : String(fout);
          throw new Error(
            `${snede.auctionDate} ${snede.auctionLocationKey}: ${bericht}`,
            { cause: fout },
          );
        });
      rowsProcessed += uit.rowsProcessed;
      versionsAdded += uit.versionsAdded;
      if (!uit.compleet) onvolledigeSneden.push(snede);

      options.onProgress?.(
        `${snede.auctionDate} ${snede.auctionLocationKey}: ` +
          `${uit.rowsProcessed} van ${uit.totalDocuments}, ${uit.versionsAdded} versies`,
      );
    }

    const warning =
      onvolledigeSneden.length > 0
        ? `Onvolledig opgehaald: ${onvolledigeSneden
            .map((s) => `${s.auctionDate}/${s.auctionLocationKey}`)
            .join(", ")}`
        : undefined;

    await deps.finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: sneden.length,
      rowsProcessed,
      versionsAdded,
      warning,
    });

    return { snedenVerwerkt: sneden.length, rowsProcessed, versionsAdded, onvolledigeSneden };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    try {
      await deps.finishRun(runId, { status: "FAILED", errorMessage });
    } catch {
      // Same reasoning as runSupplySyncWith: if the database is what failed, rethrowing here
      // would replace the informative error with a less useful one.
    }
    throw error;
  }
}

/** Production entry point. */
export async function runClockSync(options: RunClockSyncOptions): Promise<RunClockSyncResult> {
  const client = createPreauctionClient();
  return runClockSyncWith(options, {
    syncSnede: ({ snede }) =>
      syncSnede({ client, snede, writePage: writeClockPage, now: () => new Date() }),
    startRun: (trigger) => startRun(KLOK_RESOURCE, trigger),
    finishRun,
    now: () => new Date(),
  });
}

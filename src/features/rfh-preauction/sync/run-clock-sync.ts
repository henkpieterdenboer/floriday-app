import type { SyncTrigger } from "@prisma/client";
import { createPreauctionClient } from "@/features/rfh-preauction/client";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";
import { snedenVoor, type Snede } from "@/features/rfh-preauction/sync/sneden";
import { veildagenVoorRun } from "@/features/rfh-preauction/sync/veildagen";
import { syncSnede, type SnedeStopReden, type SyncSnedeResult } from "@/features/rfh-preauction/sync/clock-supply";
import { writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";

/** The resource name in SyncRun. Distinct from SUPPLY_RESOURCE so the status page can tell them apart. */
export const KLOK_RESOURCE = "rfh-clock-supply";

export interface RunClockSyncOptions {
  trigger: SyncTrigger;
  /** Overrides which auction days to walk. The backfill script passes an explicit list. */
  veildagen?: readonly string[];
  onProgress?: (message: string) => void;
}

/**
 * An incomplete slice plus why it stopped short - see SnedeStopReden in clock-supply.ts for
 * what the three reasons mean. Carrying the reason here, not just the slice, is the point:
 * without it a caller (the cron route) can only say *which* slice was incomplete, not whether
 * that is a shifting result set (unremarkable) or the server never reaching its own total
 * (worth looking at). SyncRun.warning already spells this out for whoever reads the database
 * row; this is the same information for whoever only reads the cron response.
 */
export interface OnvolledigeSnede extends Snede {
  stopReden: SnedeStopReden;
}

/**
 * A slice whose fetch threw, rather than one that came back short - see the module doc
 * comment on `runClockSyncWith` for why these are kept apart from OnvolledigeSnede. `fout`
 * carries the slice-prefixed Error with the original failure preserved via `cause`, the same
 * enrichment the old rethrow used to carry to the top - a caller that wants the original
 * stack or error type can still get it here, even though the run itself no longer aborts.
 */
export interface MislukteSnede extends Snede {
  fout: Error;
}

export interface RunClockSyncResult {
  snedenVerwerkt: number;
  rowsProcessed: number;
  versionsAdded: number;
  /** Real API pages fetched across every slice. See the field of the same name below for why. */
  pagesProcessed: number;
  onvolledigeSneden: OnvolledigeSnede[];
  /** Slices whose fetch threw. Empty on a clean run. See MislukteSnede for why this is not merged with onvolledigeSneden. */
  mislukteSneden: MislukteSnede[];
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
 *
 * A slice whose fetch throws does not abort the run either (spec §6: "Een mislukte snede
 * kost één snede, niet de hele veildag"). A structural problem on one location - a 403, a
 * record that breaks the Zod schema - must not take every later auction day down with it on
 * a feed where a missed day cannot be fetched again. The failure is recorded in
 * `mislukteSneden` and the loop moves on; the SyncRun this produces is `FAILED` if one or
 * more slices threw (never `SUCCEEDED` with a mere warning - a reader must not be able to
 * mistake "we lost a slice" for "all good"), but it still carries the rows and versions the
 * other slices actually wrote, because that work is real and already committed.
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
  // Real API pages fetched across every slice, not the number of slices walked. A slice of
  // 2000 rows at 500 per page is four real requests; SyncRun.pagesProcessed has to count the
  // same thing the Floriday sync counts under that column, or the status page shows two
  // numbers that look comparable but measure different things (spec review, task 14/17).
  let pagesProcessed = 0;
  // Carries the reason alongside the slice - see OnvolledigeSnede's doc comment for why that
  // matters. The warning string below is derived from this array rather than tracked
  // separately, so the two can never disagree about which slices were incomplete or why.
  const onvolledigeSneden: OnvolledigeSnede[] = [];
  // Slices whose fetch threw, kept apart from onvolledigeSneden - see MislukteSnede's doc
  // comment for why a slice that came back short is a different problem from one that never
  // came back at all.
  const mislukteSneden: MislukteSnede[] = [];

  try {
    for (const snede of sneden) {
      let uit: SyncSnedeResult;
      try {
        uit = await deps.syncSnede({ snede });
      } catch (fout: unknown) {
        // Verrijk de fout met de snede voordat hij bewaard wordt. postJson kent alleen het
        // pad, en dat is voor deze API altijd dezelfde literal - twee mislukkingen op
        // verschillende veildagen leveren anders bijna identieke tekst op in
        // SyncRun.errorMessage en op de statuspagina.
        const bericht = fout instanceof Error ? fout.message : String(fout);
        const verrijkt = new Error(
          `${snede.auctionDate} ${snede.auctionLocationKey}: ${bericht}`,
          { cause: fout },
        );
        mislukteSneden.push({ ...snede, fout: verrijkt });
        options.onProgress?.(`${snede.auctionDate} ${snede.auctionLocationKey}: mislukt - ${bericht}`);
        // Geen rethrow: spec §6 - een mislukte snede kost één snede, niet de rest van de run.
        continue;
      }

      rowsProcessed += uit.rowsProcessed;
      versionsAdded += uit.versionsAdded;
      pagesProcessed += uit.pagesFetched;
      if (!uit.compleet) {
        onvolledigeSneden.push({ ...snede, stopReden: uit.stopReden });
      }

      options.onProgress?.(
        `${snede.auctionDate} ${snede.auctionLocationKey}: ` +
          `${uit.rowsProcessed} van ${uit.totalDocuments}, ${uit.versionsAdded} versies`,
      );
    }

    const warning =
      onvolledigeSneden.length > 0
        ? `Onvolledig opgehaald: ${onvolledigeSneden
            .map((s) => `${s.auctionDate}/${s.auctionLocationKey} (${s.stopReden})`)
            .join(", ")}`
        : undefined;

    if (mislukteSneden.length > 0) {
      // Elke mislukking, of het er één is of allemaal: dit mag nooit als SUCCEEDED met een
      // kanttekening wegschrijven. Een kanttekening leest als "gesynchroniseerd, met een
      // detail"; dit is "een veildag die we nooit meer terugkrijgen". "Alle sneden mislukt"
      // is bewust geen apart geval - het is gewoon het uiterste van dezelfde regel, en de
      // tekst hieronder zegt vanzelf "alle X" wanneer dat zo uitkomt.
      const lijst = mislukteSneden.map((s) => s.fout.message).join("; ");
      const errorMessage =
        mislukteSneden.length === sneden.length
          ? `Alle ${sneden.length} sneden mislukt: ${lijst}`
          : `${mislukteSneden.length} van ${sneden.length} sneden mislukt, de rest is doorgegaan: ${lijst}`;

      await deps.finishRun(runId, {
        status: "FAILED",
        pagesProcessed,
        rowsProcessed,
        versionsAdded,
        errorMessage,
        warning,
      });

      return {
        snedenVerwerkt: sneden.length,
        rowsProcessed,
        versionsAdded,
        pagesProcessed,
        onvolledigeSneden,
        mislukteSneden,
      };
    }

    await deps.finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed,
      rowsProcessed,
      versionsAdded,
      warning,
    });

    return {
      snedenVerwerkt: sneden.length,
      rowsProcessed,
      versionsAdded,
      pagesProcessed,
      onvolledigeSneden,
      mislukteSneden,
    };
  } catch (error: unknown) {
    // Wordt alleen nog bereikt door iets onverwachts - finishRun zelf die faalt, of een bug
    // hierboven - niet meer door een snede die mislukte - zie de doc comment op deze functie.
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

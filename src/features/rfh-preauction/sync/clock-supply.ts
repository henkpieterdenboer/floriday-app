import type { PreauctionClient } from "@/features/rfh-preauction/client";
import { toClockSupplyLineRow, type ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";
import { SNIJBLOEMEN_HOOFDGROEP, type Snede } from "@/features/rfh-preauction/sync/sneden";
import type { ClockWriteResult } from "@/features/rfh-preauction/sync/write-clock-page";

/**
 * 500 is verified to work against the real API; the web app itself asks for 100. Larger
 * pages mean fewer requests and fewer transactions, and a slice of a single auction location
 * on a single day tops out around two thousand rows on production.
 */
export const STANDAARD_PAGINAGROOTTE = 500;

/**
 * A backstop, not a budget. A real slice is a couple of thousand rows at most, so five pages
 * is normal and fifty is already an order of magnitude of headroom.
 *
 * It exists because the loop's only other exit is agreement with `totalDocuments`. A server
 * that keeps handing out full pages against a total it never reaches would spin until Vercel
 * kills the function at 300 seconds - and then the run sits at RUNNING for ten minutes,
 * blocking every retry, on a feed where a missed auction day does not come back. Hitting
 * this bound is not a normal outcome, so it reports `compleet: false` rather than passing
 * quietly.
 */
export const MAX_PAGINAS_PER_SNEDE = 50;

export interface SyncSnedeOptions {
  client: PreauctionClient;
  snede: Snede;
  writePage: (rows: readonly ClockSupplyLineRow[], observedAt: Date) => Promise<ClockWriteResult>;
  now: () => Date;
  pageSize?: number;
  maxPages?: number;
}

/**
 * Why the walk over a slice stopped. Two of the three mean the slice is incomplete, and they
 * are not the same diagnosis:
 *
 * - "totaal-bereikt": every row RFH reported was retrieved. The only reason `compleet` is true.
 * - "korte-pagina": the server handed back fewer rows than asked for while the total was not
 *   yet reached - most likely a result set shifting under us mid-walk (rows sold and removed
 *   from the clock while paging, or a skip ceiling).
 * - "maxPaginas": MAX_PAGINAS_PER_SNEDE tripped. The server kept handing out full pages against
 *   a total it never reached. Unlike a shifting set, this points at something actually wrong -
 *   worth telling apart from "korte-pagina" in the warning a human reads.
 */
export type SnedeStopReden = "totaal-bereikt" | "korte-pagina" | "maxPaginas";

export interface SyncSnedeResult {
  rowsProcessed: number;
  versionsAdded: number;
  totalDocuments: number;
  /**
   * How many API pages this slice actually took. Distinct from "one slice, one unit of work" -
   * a slice of 2000 rows at 500 per page is four real requests, and SyncRun.pagesProcessed
   * should count the same thing the Floriday sync counts under that column, not the number of
   * slices walked.
   */
  pagesFetched: number;
  /** See SnedeStopReden. */
  stopReden: SnedeStopReden;
  /**
   * Whether we saw as many rows as the server said there were. Derived from stopReden rather
   * than tracked separately, so the two can never disagree: compleet is true exactly when
   * stopReden is "totaal-bereikt". Reported rather than thrown, because one incomplete slice
   * should not abandon the other twenty-seven, but it must never pass unnoticed either: this
   * feed has no sequence number to prove completeness with (spec §9).
   */
  compleet: boolean;
}

/**
 * Walks one slice - one auction day at one auction location - and writes every page.
 *
 * observedAt is taken once, at the start, and used for every page in the slice. That makes
 * the whole slice one moment in the archive rather than a smear across however long the
 * paging took, which is what a reader comparing two observations expects.
 */
export async function syncSnede(options: SyncSnedeOptions): Promise<SyncSnedeResult> {
  const {
    client,
    snede,
    writePage,
    now,
    pageSize = STANDAARD_PAGINAGROOTTE,
    maxPages = MAX_PAGINAS_PER_SNEDE,
  } = options;
  const observedAt = now();

  let skip = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let totalDocuments = 0;
  let pagesFetched = 0;
  let stopReden: SnedeStopReden;

  for (;;) {
    const pagina = await client.zoekKlokaanbod({
      auctionDate: snede.auctionDate,
      mainGroupKey: SNIJBLOEMEN_HOOFDGROEP,
      auctionLocationKey: snede.auctionLocationKey,
      skip,
      take: pageSize,
    });
    pagesFetched++;

    totalDocuments = pagina.totalDocuments;

    if (pagina.results.length > 0) {
      const rows = pagina.results.map((payload) =>
        toClockSupplyLineRow(payload, snede.auctionDate),
      );
      const geschreven = await writePage(rows, observedAt);
      rowsProcessed += geschreven.rowsProcessed;
      versionsAdded += geschreven.versionsAdded;
    }

    skip += pagina.results.length;

    if (rowsProcessed >= totalDocuments) {
      stopReden = "totaal-bereikt";
      break;
    }

    // A page shorter than requested while the total is not reached means the server stopped
    // handing rows out - a skip ceiling, or the result set shifting under us mid-walk.
    // Either way there is nothing to gain from asking again with a higher skip.
    if (pagina.results.length < pageSize) {
      stopReden = "korte-pagina";
      break;
    }

    // Safety net, not a normal exit: see MAX_PAGINAS_PER_SNEDE. rowsProcessed is still below
    // totalDocuments here, so compleet below comes out false on its own - no special case
    // needed for this branch.
    if (pagesFetched >= maxPages) {
      stopReden = "maxPaginas";
      break;
    }
  }

  return {
    rowsProcessed,
    versionsAdded,
    totalDocuments,
    pagesFetched,
    stopReden,
    compleet: stopReden === "totaal-bereikt",
  };
}

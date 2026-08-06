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
 * How many pages one call to syncSnede fetches before giving up on the slice.
 *
 * The loop's other two exits both depend on the server behaving: totalDocuments being
 * reached, or a page coming back shorter than asked. A server that keeps handing out full
 * pages while totalDocuments stays forever out of reach - a bug on RFH's side, or a result
 * set growing faster than this slice can consume it - would otherwise spin without end. The
 * cron route that calls this has a 300-second budget; a run stuck here does not fail
 * cleanly, it sits on RUNNING and blocks every later attempt for as long as it hangs, which
 * is worse than failing outright for a feed where a missed auction day cannot be recovered.
 *
 * 50 pages at STANDAARD_PAGINAGROOTTE is 25,000 rows, against a slice that tops out around
 * two thousand on production - roughly a tenfold margin above anything a real snede needs.
 * Hitting it is never a normal outcome, so it is not thrown: the run keeps walking the other
 * slices and the gap surfaces through compleet, the same as any other cut-short slice.
 */
export const STANDAARD_MAX_PAGINAS = 50;

export interface SyncSnedeOptions {
  client: PreauctionClient;
  snede: Snede;
  writePage: (rows: readonly ClockSupplyLineRow[], observedAt: Date) => Promise<ClockWriteResult>;
  now: () => Date;
  pageSize?: number;
  maxPages?: number;
}

export interface SyncSnedeResult {
  rowsProcessed: number;
  versionsAdded: number;
  totalDocuments: number;
  /**
   * Whether we saw as many rows as the server said there were. False means the slice was
   * cut short - a page came back shorter than asked for while the total was not yet reached.
   * Reported rather than thrown, because one incomplete slice should not abandon the other
   * twenty-seven, but it must never pass unnoticed either: this feed has no sequence number
   * to prove completeness with (spec §9).
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
    maxPages = STANDAARD_MAX_PAGINAS,
  } = options;
  const observedAt = now();

  let skip = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let totalDocuments = 0;

  for (let pageCount = 1; ; pageCount++) {
    const pagina = await client.zoekKlokaanbod({
      auctionDate: snede.auctionDate,
      mainGroupKey: SNIJBLOEMEN_HOOFDGROEP,
      auctionLocationKey: snede.auctionLocationKey,
      skip,
      take: pageSize,
    });

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

    if (rowsProcessed >= totalDocuments) break;

    // A page shorter than requested while the total is not reached means the server stopped
    // handing rows out - a skip ceiling, or the result set shifting under us mid-walk.
    // Either way there is nothing to gain from asking again with a higher skip.
    if (pagina.results.length < pageSize) break;

    // Safety net, not a normal exit: see STANDAARD_MAX_PAGINAS. rowsProcessed is still below
    // totalDocuments here, so compleet below comes out false on its own - no special case
    // needed for this branch.
    if (pageCount >= maxPages) break;
  }

  return {
    rowsProcessed,
    versionsAdded,
    totalDocuments,
    compleet: rowsProcessed >= totalDocuments,
  };
}

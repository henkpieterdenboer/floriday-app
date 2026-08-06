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

export interface SyncSnedeOptions {
  client: PreauctionClient;
  snede: Snede;
  writePage: (rows: readonly ClockSupplyLineRow[], observedAt: Date) => Promise<ClockWriteResult>;
  now: () => Date;
  pageSize?: number;
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
  const { client, snede, writePage, now, pageSize = STANDAARD_PAGINAGROOTTE } = options;
  const observedAt = now();

  let skip = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let totalDocuments = 0;

  for (;;) {
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
  }

  return {
    rowsProcessed,
    versionsAdded,
    totalDocuments,
    compleet: rowsProcessed >= totalDocuments,
  };
}

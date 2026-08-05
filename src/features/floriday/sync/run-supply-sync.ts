import type { SyncTrigger } from "@prisma/client";
import { createCustomersClient, type FloridayClient } from "@/features/floriday/client";
import { syncSupplyLines, type SyncSupplyLinesResult } from "@/features/floriday/sync/supply-lines";
import { writeSupplyPage, type WriteResult } from "@/features/floriday/sync/write-supply-page";
import { fetchMissingTradeItems } from "@/features/floriday/sync/trade-items";
import { findKnownTradeItemIds, saveTradeItems } from "@/features/floriday/sync/trade-items-store";
import { SUPPLY_RESOURCE, readCursor, writeCursor } from "@/features/floriday/sync/cursor";
import { startRun, finishRun } from "@/features/floriday/sync/run-log";
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

export interface RunSupplySyncOptions {
  trigger: SyncTrigger;
  /** Bounds one run. The cron route passes a small number; the backfill passes none. */
  maxPages?: number;
  onProgress?: (message: string) => void;
  /** Overrides the underlying sync's page size. Exists for tests; production never sets it. */
  pageSize?: number;
}

export type RunSupplySyncResult = SyncSupplyLinesResult & { tradeItemsAdded: number };

/**
 * Everything runSupplySync needs from the outside world, gathered in one place so the
 * orchestration below (trade-item collection, success/failure/warning handling) can be
 * unit tested with fakes instead of a real database and a real Floriday API - the same
 * dependency-injection shape syncSupplyLines itself already uses.
 */
export interface RunSupplySyncDeps {
  client: FloridayClient;
  /**
   * The feed's own highest sequence number. Optional so existing tests keep working with
   * fakes that do not provide it; production always passes it.
   */
  readMaxSequence?: () => Promise<bigint>;
  readCursor: () => Promise<bigint>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  writeSupplyPage: (rows: readonly SupplyLineRow[], observedAt: Date) => Promise<WriteResult>;
  startRun: (trigger: SyncTrigger) => Promise<bigint>;
  finishRun: typeof finishRun;
  findKnownTradeItemIds: (ids: readonly string[]) => Promise<Set<string>>;
  saveTradeItems: (items: TradeItemPayload[], fetchedAt: Date) => Promise<void>;
  now: () => Date;
}

/**
 * Runs one supply-line sync from the current cursor, then tops up the trade item lookup
 * table for whatever trade items this run's pages referenced.
 *
 * Trade item ids are collected from the pages as they are written, not re-queried from
 * SupplyLine afterwards by sequence-number window. SupplyLine holds only current state, so
 * a row re-observed later carries a new, higher sequenceNumber - a post-hoc window keyed on
 * this run's start/end cursor cannot reliably tell "touched by this run" apart from "touched
 * by some other run that happens to have left the cursor in this range". Collecting eagerly
 * also means a run that fails partway through still tops up trade items for the pages it did
 * manage to commit, instead of silently leaving them without a resolvable trade item.
 */
export async function runSupplySyncWith(
  options: RunSupplySyncOptions,
  deps: RunSupplySyncDeps,
): Promise<RunSupplySyncResult> {
  const { trigger, maxPages, onProgress, pageSize } = options;
  const runId = await deps.startRun(trigger);

  const touchedTradeItemIds = new Set<string>();

  const writePage = async (rows: SupplyLineRow[], observedAt: Date): Promise<WriteResult> => {
    const written = await deps.writeSupplyPage(rows, observedAt);
    for (const row of rows) touchedTradeItemIds.add(row.tradeItemId);
    onProgress?.(
      `wrote page: ${written.rowsProcessed} rows, ${written.versionsAdded} new versions`,
    );
    return written;
  };

  const topUpTradeItems = async (): Promise<number> => {
    if (touchedTradeItemIds.size === 0) return 0;
    return fetchMissingTradeItems({
      client: deps.client,
      tradeItemIds: [...touchedTradeItemIds],
      findKnownIds: deps.findKnownTradeItemIds,
      saveTradeItems: deps.saveTradeItems,
      now: deps.now,
    });
  };

  try {
    const startCursor = await deps.readCursor();

    const result = await syncSupplyLines({
      client: deps.client,
      startCursor,
      writePage,
      writeCursor: deps.writeCursor,
      now: deps.now,
      maxPages,
      pageSize,
      readMaxSequence: deps.readMaxSequence,
    });

    const tradeItemsAdded = await topUpTradeItems();

    await deps.finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      // Advisory only - see RunOutcome.warning. Never written to errorMessage: this run
      // reached here without throwing, so status is SUCCEEDED regardless of this text.
      warning: result.warning,
    });

    return { ...result, tradeItemsAdded };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Pages already written before the failure are already committed, and the cursor
    // already advanced past them (writeSupplyPage/writeCursor run per page, inside
    // syncSupplyLines's loop, before the next page is even fetched). Best-effort top up
    // whatever those pages referenced now; if this also fails, swallow it rather than
    // replace the original, more informative sync failure.
    try {
      await topUpTradeItems();
    } catch {
      // best effort only
    }

    try {
      await deps.finishRun(runId, { status: "FAILED", errorMessage });
    } catch {
      // If the database itself is what failed, finishRun rethrowing here would replace
      // the original error with a less informative one. The run is left stuck at RUNNING
      // in the log in that case - a known limitation, not silent data loss, and strictly
      // better than losing the reason the sync actually failed.
    }

    throw error;
  }
}

/** Production entry point: wires the real Floriday client and Prisma-backed stores. */
export async function runSupplySync(options: RunSupplySyncOptions): Promise<RunSupplySyncResult> {
  const client = createCustomersClient();
  return runSupplySyncWith(options, {
    client,
    // Bare number in the response body, not an object - verified against the real API.
    readMaxSequence: async () =>
      BigInt(await client.getJson<number>("/auction/clock-presales-supply/max-sequence-number")),
    readCursor: () => readCursor(SUPPLY_RESOURCE),
    writeCursor: (sequenceNumber) => writeCursor(SUPPLY_RESOURCE, sequenceNumber),
    writeSupplyPage,
    startRun: (trigger) => startRun(SUPPLY_RESOURCE, trigger),
    finishRun,
    findKnownTradeItemIds,
    saveTradeItems,
    now: () => new Date(),
  });
}

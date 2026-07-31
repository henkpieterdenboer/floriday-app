import type { SyncTrigger } from "@prisma/client";
import { createCustomersClient, type FloridayClient } from "@/features/floriday/client";
import { syncOrganizations, type SyncOrganizationsResult } from "@/features/floriday/sync/organizations";
import { writeOrganizationsPage, type WriteOrganizationsResult } from "@/features/floriday/sync/organizations-store";
import { ORGANIZATION_RESOURCE, readCursor, writeCursor } from "@/features/floriday/sync/cursor";
import { startRun, finishRun } from "@/features/floriday/sync/run-log";
import type { OrganizationRow } from "@/features/floriday/mappers/organization";

export interface RunOrganizationSyncOptions {
  trigger: SyncTrigger;
  /** Bounds one run. The cron route passes a small number; the backfill passes none. */
  maxPages?: number;
  onProgress?: (message: string) => void;
  /** Overrides the underlying sync's page size. Exists for tests; production never sets it. */
  pageSize?: number;
}

/**
 * Everything runOrganizationSync needs from the outside world - see RunSupplySyncDeps in
 * run-supply-sync.ts for why this is injected rather than hardcoded.
 */
export interface RunOrganizationSyncDeps {
  client: FloridayClient;
  readCursor: () => Promise<bigint>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  writeOrganizationsPage: (rows: readonly OrganizationRow[]) => Promise<WriteOrganizationsResult>;
  startRun: (trigger: SyncTrigger) => Promise<bigint>;
  finishRun: typeof finishRun;
}

/** Runs one organization sync from the current cursor. No trade item step: organizations
 * carry no reference that needs a separate lookup table topped up. */
export async function runOrganizationSyncWith(
  options: RunOrganizationSyncOptions,
  deps: RunOrganizationSyncDeps,
): Promise<SyncOrganizationsResult> {
  const { trigger, maxPages, onProgress, pageSize } = options;
  const runId = await deps.startRun(trigger);

  const writePage = async (rows: OrganizationRow[]): Promise<WriteOrganizationsResult> => {
    const written = await deps.writeOrganizationsPage(rows);
    onProgress?.(`wrote page: ${written.rowsProcessed} rows`);
    return written;
  };

  try {
    const startCursor = await deps.readCursor();

    const result = await syncOrganizations({
      client: deps.client,
      startCursor,
      writePage,
      writeCursor: deps.writeCursor,
      maxPages,
      pageSize,
    });

    await deps.finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      // Advisory only - see RunOutcome.warning in run-log.ts. Never written to
      // errorMessage: this run reached here without throwing, so status is SUCCEEDED
      // regardless of this text.
      warning: result.warning,
    });

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await deps.finishRun(runId, { status: "FAILED", errorMessage });
    } catch {
      // If the database itself is what failed, finishRun rethrowing here would replace
      // the original error with a less informative one. The run is left stuck at RUNNING
      // in the log in that case - a known limitation, not silent data loss.
    }

    throw error;
  }
}

/** Production entry point: wires the real Floriday client and Prisma-backed stores. */
export async function runOrganizationSync(
  options: RunOrganizationSyncOptions,
): Promise<SyncOrganizationsResult> {
  return runOrganizationSyncWith(options, {
    client: createCustomersClient(),
    readCursor: () => readCursor(ORGANIZATION_RESOURCE),
    writeCursor: (sequenceNumber) => writeCursor(ORGANIZATION_RESOURCE, sequenceNumber),
    writeOrganizationsPage,
    startRun: (trigger) => startRun(ORGANIZATION_RESOURCE, trigger),
    finishRun,
  });
}

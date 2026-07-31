import type { SyncStatus, SyncTrigger } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface RunOutcome {
  status: Extract<SyncStatus, "SUCCEEDED" | "FAILED">;
  pagesProcessed?: number;
  rowsProcessed?: number;
  /**
   * Left at its default (0) by both run-supply-sync.ts and run-organization-sync.ts:
   * writeSupplyPage/writeOrganizationsPage upsert with `ON CONFLICT DO UPDATE` and report
   * only a combined rowsProcessed, not which of those rows were a first-time insert versus
   * an update to an already-archived row. Telling the two apart would need new logic in the
   * upsert SQL (e.g. an `xmax = 0` check), which is out of scope for composing the existing
   * pieces - left here for whoever adds that distinction, deliberately unset until then.
   */
  rowsInserted?: number;
  versionsAdded?: number;
  errorMessage?: string;
  /**
   * Advisory context that does not mean the run failed - e.g. syncSupplyLines/syncOrganizations
   * report an empty page that does not by itself prove we are caught up. Kept separate from
   * errorMessage deliberately: that field is what tells a reader "this run failed", and a
   * SUCCEEDED run with errorMessage populated would contradict its own status.
   */
  warning?: string;
}

export async function startRun(resource: string, trigger: SyncTrigger): Promise<bigint> {
  const run = await prisma.syncRun.create({
    data: { resource, trigger, startedAt: new Date(), status: "RUNNING" },
  });
  return run.id;
}

export async function finishRun(runId: bigint, outcome: RunOutcome): Promise<void> {
  await prisma.syncRun.update({
    where: { id: runId },
    data: {
      finishedAt: new Date(),
      status: outcome.status,
      pagesProcessed: outcome.pagesProcessed ?? 0,
      rowsProcessed: outcome.rowsProcessed ?? 0,
      rowsInserted: outcome.rowsInserted ?? 0,
      versionsAdded: outcome.versionsAdded ?? 0,
      errorMessage: outcome.errorMessage ?? null,
      warning: outcome.warning ?? null,
    },
  });
}

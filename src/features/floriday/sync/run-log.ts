import type { SyncStatus, SyncTrigger } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface RunOutcome {
  status: Extract<SyncStatus, "SUCCEEDED" | "FAILED">;
  pagesProcessed?: number;
  rowsProcessed?: number;
  rowsInserted?: number;
  versionsAdded?: number;
  errorMessage?: string;
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
    },
  });
}

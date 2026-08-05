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

/**
 * Hoe lang een lopende run als lopend telt.
 *
 * De cron-route staat op maxDuration 300 seconden. Wordt een functie daarboven afgekapt,
 * dan komt finishRun nooit aan de beurt en blijft de run voor altijd op RUNNING staan. Die
 * zou dan elke volgende run tegenhouden - erger dan het probleem dat we oplossen. Na deze
 * grens beschouwen we hem als vastgelopen en mag er weer een beginnen.
 */
export const RUN_VASTGELOPEN_NA_MINUTEN = 10;

/**
 * Of er op dit moment al een synchronisatie loopt voor deze bron.
 *
 * Bestaat omdat de geplande taak elke minuut langskomt terwijl een run minuten kan duren.
 * Zonder deze controle stapelen ze op: op 5 augustus 2026 startte de eerste vulling op
 * productie en stonden er binnen drie minuten drie runs tegelijk open. Rijen raken daar niet
 * van in de war - de upserts zijn idempotent - maar de cursor kan achteruit springen en
 * gelijktijdige transacties lopen tegen elkaars sloten aan.
 */
export async function isErEenRunBezig(resource: string, nu: Date = new Date()): Promise<boolean> {
  const grens = new Date(nu.getTime() - RUN_VASTGELOPEN_NA_MINUTEN * 60_000);

  const lopende = await prisma.syncRun.findFirst({
    where: { resource, status: "RUNNING", startedAt: { gte: grens } },
    select: { id: true },
  });

  return lopende !== null;
}

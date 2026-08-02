import { prisma } from "@/lib/db";
import { SUPPLY_RESOURCE } from "@/features/floriday/sync/cursor";

/** "Ouder dan drie uur wordt het nadrukkelijk in plaats van terloops" - spec §6. */
export const STALE_THRESHOLD_HOURS = 3;

/** Most recent successful sync of the supply archive, or null if there has never been one. */
export async function getLastSuccessfulSyncAt(): Promise<Date | null> {
  const run = await prisma.syncRun.findFirst({
    where: { resource: SUPPLY_RESOURCE, status: "SUCCEEDED" },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });
  return run?.finishedAt ?? null;
}

/** No successful run at all counts as stale too - there is nothing fresher to point to. */
export function isStale(finishedAt: Date | null, now: Date): boolean {
  if (finishedAt === null) return true;
  const hours = (now.getTime() - finishedAt.getTime()) / (1000 * 60 * 60);
  return hours > STALE_THRESHOLD_HOURS;
}

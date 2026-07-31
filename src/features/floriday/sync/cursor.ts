import { prisma } from "@/lib/db";

export const SUPPLY_RESOURCE = "clock_presales_supply";
export const ORGANIZATION_RESOURCE = "organizations";

/**
 * Nothing here stops two runs against the same resource overlapping - e.g. a cron
 * invocation firing while a local backfill is mid-flight. Traced through deliberately
 * rather than assumed away:
 *
 * - Row writes are safe: writeSupplyPage/writeOrganizationsPage upsert on the natural id,
 *   and SupplyLineVersion has a unique(supplyLineId, sequenceNumber) constraint with
 *   skipDuplicates, so two runs observing the same row twice cannot corrupt or duplicate
 *   data, only repeat work.
 * - The cursor itself is not: each run reads it once and advances an in-memory copy per
 *   page, so a run that started earlier (lower cursor) but finishes writing a page later
 *   can overwrite a further-along cursor a concurrent run already wrote, moving it
 *   backwards. The next run then reprocesses an already-covered range - wasted Floriday
 *   requests and DB writes, self-correcting once it catches back up, not data loss.
 * - The real risk is contention: two transactions upserting overlapping supplyLineIds at
 *   the same time can lock-wait or fail against writeSupplyPage's 15s transaction timeout,
 *   surfacing as a FAILED run for whichever loses.
 *
 * Benign for correctness, wasteful and occasionally flaky under real overlap. Not solved
 * here; a resource-level advisory lock (e.g. pg_advisory_lock keyed on the resource name)
 * would be the fix if overlap turns out to happen in practice.
 */

export async function readCursor(resource: string): Promise<bigint> {
  const state = await prisma.syncState.findUnique({ where: { resource } });
  return state?.lastSequenceNumber ?? 0n;
}

export async function writeCursor(resource: string, sequenceNumber: bigint): Promise<void> {
  await prisma.syncState.upsert({
    where: { resource },
    create: { resource, lastSequenceNumber: sequenceNumber },
    update: { lastSequenceNumber: sequenceNumber },
  });
}

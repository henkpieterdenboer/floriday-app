import { prisma } from "@/lib/db";

export const SUPPLY_RESOURCE = "clock_presales_supply";
export const ORGANIZATION_RESOURCE = "organizations";

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

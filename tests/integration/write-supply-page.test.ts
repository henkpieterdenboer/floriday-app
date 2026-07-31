import "dotenv/config";
import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow } from "@/features/floriday/mappers/supply-line";
import { writeSupplyPage } from "@/features/floriday/sync/write-supply-page";

const page = supplyPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/supply-page.json", "utf8")),
);
const rows = page.results.map(toSupplyLineRow);
const ids = rows.map((r) => r.supplyLineId);

async function cleanup(): Promise<void> {
  await prisma.supplyLineVersion.deleteMany({ where: { supplyLineId: { in: ids } } });
  await prisma.supplyLine.deleteMany({ where: { supplyLineId: { in: ids } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("writeSupplyPage", () => {
  it("inserts lines and one version each on first write", async () => {
    const result = await writeSupplyPage(rows, new Date());

    expect(result.versionsAdded).toBe(rows.length);
    expect(await prisma.supplyLine.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
  });

  it("adds no versions when the same page is written twice", async () => {
    await writeSupplyPage(rows, new Date());
    const second = await writeSupplyPage(rows, new Date());

    expect(second.versionsAdded).toBe(0);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
  });

  it("adds one version when a piece count changes", async () => {
    await writeSupplyPage(rows, new Date());

    const changed = [
      { ...rows[0], numberOfPieces: rows[0].numberOfPieces - 40, sequenceNumber: rows[0].sequenceNumber + 1n },
      ...rows.slice(1),
    ];
    const second = await writeSupplyPage(changed, new Date());

    expect(second.versionsAdded).toBe(1);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: rows[0].supplyLineId } }))
      .toBe(2);
  });

  it("keeps firstSeenAt and moves lastSeenAt forward", async () => {
    const first = new Date("2026-07-30T08:00:00.000Z");
    const later = new Date("2026-07-30T09:00:00.000Z");

    await writeSupplyPage(rows, first);
    await writeSupplyPage(
      [{ ...rows[0], numberOfPieces: 1, sequenceNumber: rows[0].sequenceNumber + 1n }],
      later,
    );

    const stored = await prisma.supplyLine.findUniqueOrThrow({
      where: { supplyLineId: rows[0].supplyLineId },
    });
    expect(stored.firstSeenAt.toISOString()).toBe(first.toISOString());
    expect(stored.lastSeenAt.toISOString()).toBe(later.toISOString());
  });

  it("stores the price without losing precision", async () => {
    await writeSupplyPage(rows, new Date());
    const stored = await prisma.supplyLine.findUniqueOrThrow({
      where: { supplyLineId: rows[0].supplyLineId },
    });
    expect(stored.pricePerPiece.toFixed(4)).toBe(rows[0].pricePerPiece);
  });

  it("writes nothing and reports zero for an empty page", async () => {
    const result = await writeSupplyPage([], new Date());
    expect(result).toEqual({ rowsProcessed: 0, versionsAdded: 0 });
  });

  // The single raw multi-row upsert is hand-built SQL with per-column casts (see the
  // performance note in write-supply-page.ts). Every column must land exactly, not just
  // the ones the other tests happen to check.
  it("stores every column of every line correctly, not just the ones spot-checked elsewhere", async () => {
    await writeSupplyPage(rows, new Date());

    const stored = await prisma.supplyLine.findMany({ where: { supplyLineId: { in: ids } } });
    expect(stored).toHaveLength(rows.length);

    const storedById = new Map(stored.map((line) => [line.supplyLineId, line]));

    for (const row of rows) {
      const line = storedById.get(row.supplyLineId);
      expect(line).toBeDefined();
      if (!line) continue;

      expect(line.status).toBe(row.status);
      expect(line.tradeItemId).toBe(row.tradeItemId);
      expect(line.tradeItemVersion).toBe(row.tradeItemVersion);
      expect(line.pricePerPiece.toFixed(4)).toBe(row.pricePerPiece);
      expect(line.currency).toBe(row.currency);
      expect(line.numberOfPieces).toBe(row.numberOfPieces);
      expect(line.deliveryNoteReference).toBe(row.deliveryNoteReference);
      expect(line.deliveryNoteCode).toBe(row.deliveryNoteCode);
      expect(line.deliveryNoteLetter).toBe(row.deliveryNoteLetter);
      expect(line.piecesPerPackage).toBe(row.piecesPerPackage);
      expect(line.vbnPackageCode).toBe(row.vbnPackageCode);
      expect(line.customPackageId).toBe(row.customPackageId);
      expect(line.packagesPerLayer).toBe(row.packagesPerLayer);
      expect(line.layersPerLoadCarrier).toBe(row.layersPerLoadCarrier);
      expect(line.loadCarrier).toBe(row.loadCarrier);
      expect(line.tradePeriodStart.toISOString()).toBe(row.tradePeriodStart.toISOString());
      expect(line.tradePeriodEnd.toISOString()).toBe(row.tradePeriodEnd.toISOString());
      expect(line.supplierOrganizationId).toBe(row.supplierOrganizationId);
      expect(line.sequenceNumber).toBe(row.sequenceNumber);
      expect(line.creationDateTime.toISOString()).toBe(row.creationDateTime.toISOString());
      expect(line.lastModifiedDateTime?.toISOString() ?? null).toBe(
        row.lastModifiedDateTime?.toISOString() ?? null,
      );
      expect(line.auctionDate.toISOString()).toBe(row.auctionDate.toISOString());
      expect(line.initialAuctionLocation).toBe(row.initialAuctionLocation);
      expect(line.photoUrl).toBe(row.photoUrl);
    }
  });

  // Defense in depth: if a retry or an overlapping page ever attempts to insert the exact
  // same (supplyLineId, sequenceNumber) version twice, skipDuplicates must swallow the
  // conflict rather than throw. Proven directly against the unique constraint, independent
  // of writeSupplyPage's own change-detection (which would normally prevent this case from
  // arising at all).
  it("skipDuplicates absorbs a repeated (supplyLineId, sequenceNumber) version insert", async () => {
    await writeSupplyPage(rows, new Date());

    const duplicateVersion = {
      ...rows[0],
      observedAt: new Date(),
    };

    await expect(
      prisma.supplyLineVersion.createMany({
        data: [duplicateVersion],
        skipDuplicates: true,
      }),
    ).resolves.not.toThrow();

    expect(
      await prisma.supplyLineVersion.count({
        where: { supplyLineId: rows[0].supplyLineId, sequenceNumber: rows[0].sequenceNumber },
      }),
    ).toBe(1);
  });
});

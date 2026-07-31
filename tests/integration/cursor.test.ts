import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { readCursor, writeCursor } from "@/features/floriday/sync/cursor";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";

const RESOURCE = "test_resource";

beforeEach(async () => {
  await prisma.syncState.deleteMany({ where: { resource: RESOURCE } });
  await prisma.syncRun.deleteMany({ where: { resource: RESOURCE } });
});

afterAll(async () => {
  await prisma.syncState.deleteMany({ where: { resource: RESOURCE } });
  await prisma.syncRun.deleteMany({ where: { resource: RESOURCE } });
  await prisma.$disconnect();
});

describe("cursor", () => {
  it("starts at zero when the resource is unknown", async () => {
    expect(await readCursor(RESOURCE)).toBe(0n);
  });

  it("stores and reads back a cursor", async () => {
    await writeCursor(RESOURCE, 12345n);
    expect(await readCursor(RESOURCE)).toBe(12345n);
  });

  it("overwrites an existing cursor", async () => {
    await writeCursor(RESOURCE, 1n);
    await writeCursor(RESOURCE, 2n);
    expect(await readCursor(RESOURCE)).toBe(2n);
  });

  it("keeps a sequence number too large for a javascript integer intact", async () => {
    const huge = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2
    await writeCursor(RESOURCE, huge);
    expect(await readCursor(RESOURCE)).toBe(huge);
  });
});

describe("run log", () => {
  it("records a successful run", async () => {
    const runId = await startRun(RESOURCE, "MANUAL");
    await finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: 2,
      rowsProcessed: 1500,
      rowsInserted: 1500,
      versionsAdded: 1500,
    });

    const run = await prisma.syncRun.findUniqueOrThrow({ where: { id: runId } });
    expect(run.status).toBe("SUCCEEDED");
    expect(run.rowsProcessed).toBe(1500);
    expect(run.finishedAt).not.toBeNull();
  });

  it("records a failed run with its message", async () => {
    const runId = await startRun(RESOURCE, "CRON");
    await finishRun(runId, { status: "FAILED", errorMessage: "boom" });

    const run = await prisma.syncRun.findUniqueOrThrow({ where: { id: runId } });
    expect(run.status).toBe("FAILED");
    expect(run.errorMessage).toBe("boom");
  });

  it("leaves a started run visible as running until it finishes", async () => {
    const runId = await startRun(RESOURCE, "BACKFILL");

    const started = await prisma.syncRun.findUniqueOrThrow({ where: { id: runId } });
    expect(started.status).toBe("RUNNING");
    expect(started.finishedAt).toBeNull();

    await finishRun(runId, { status: "SUCCEEDED" });
  });
});

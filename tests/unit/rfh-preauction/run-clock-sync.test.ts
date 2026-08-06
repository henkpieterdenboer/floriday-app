import { describe, expect, it, vi } from "vitest";
import { runClockSyncWith, type RunClockSyncDeps } from "@/features/rfh-preauction/sync/run-clock-sync";
import type { Snede } from "@/features/rfh-preauction/sync/sneden";

/**
 * Builds fakes for every RunClockSyncDeps field, overridable per test - the same shape
 * fakeDeps uses for run-supply-sync.test.ts. Returned as a properly typed RunClockSyncDeps
 * rather than cast with `as never`: a `never`-typed fake would compile at the call site but
 * make every later `deps.syncSnede.mock.calls` access on the returned value a type error, and
 * would hide a shape drift between this fake and the real interface instead of failing here.
 * See the same reasoning in tests/unit/rfh-preauction/clock-supply.test.ts.
 */
function fakeDeps(overrides: Partial<RunClockSyncDeps> = {}): RunClockSyncDeps {
  return {
    syncSnede: vi.fn(async () => ({
      rowsProcessed: 10,
      versionsAdded: 2,
      totalDocuments: 10,
      pagesFetched: 1,
      stopReden: "totaal-bereikt" as const,
      compleet: true,
    })),
    startRun: vi.fn(async () => 1n),
    finishRun: vi.fn(async () => {}),
    now: () => new Date("2026-08-06T12:00:00.000Z"),
    ...overrides,
  };
}

describe("runClockSyncWith", () => {
  it("walks every slice and reports the totals", async () => {
    const syncSnede = vi.fn(async () => ({
      rowsProcessed: 10,
      versionsAdded: 2,
      totalDocuments: 10,
      // Two real API pages per slice, so pagesProcessed on the finished run must come out at
      // 56 (28 slices * 2), not 28 - that distinction is the point of this field: it has to
      // count what SyncRun.pagesProcessed counts for the Floriday sync, real page fetches, not
      // slices walked.
      pagesFetched: 2,
      stopReden: "totaal-bereikt" as const,
      compleet: true,
    }));
    const finishRun = vi.fn();
    const deps = fakeDeps({ syncSnede, finishRun });

    const uit = await runClockSyncWith({ trigger: "CRON" }, deps);

    // Vier veildagen maal zeven veillocaties.
    expect(syncSnede).toHaveBeenCalledTimes(28);
    expect(uit.rowsProcessed).toBe(280);
    expect(uit.versionsAdded).toBe(56);
    expect(uit.onvolledigeSneden).toEqual([]);
    expect(finishRun).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ status: "SUCCEEDED", pagesProcessed: 56 }),
    );
  });

  it("names the incomplete slices and their stop reason in the warning without failing the run", async () => {
    const finishRun = vi.fn();
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async ({ snede }: { snede: Snede }) => {
        const naaldwijk = snede.auctionLocationKey === "NAALDWIJK";
        return {
          rowsProcessed: 1,
          versionsAdded: 0,
          totalDocuments: naaldwijk ? 99 : 1,
          pagesFetched: 1,
          // The two ways a slice can come back incomplete get different reasons, and the
          // warning is only useful if a reader can tell them apart - see the type's doc
          // comment in clock-supply.ts for why "korte-pagina" and "maxPaginas" are not the
          // same diagnosis.
          stopReden: naaldwijk ? ("maxPaginas" as const) : ("totaal-bereikt" as const),
          compleet: !naaldwijk,
        };
      }),
    });

    const uit = await runClockSyncWith({ trigger: "CRON" }, deps);

    expect(uit.onvolledigeSneden).toHaveLength(4);
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.status).toBe("SUCCEEDED");
    expect(outcome.warning).toMatch(/NAALDWIJK/);
    expect(outcome.warning).toMatch(/maxPaginas/);
  });

  it("marks the run failed and rethrows when a slice throws", async () => {
    const finishRun = vi.fn();
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async () => {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }),
    });

    await expect(runClockSyncWith({ trigger: "CRON" }, deps)).rejects.toThrow(/503/);
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.status).toBe("FAILED");
    expect(outcome.errorMessage).toMatch(/503/);
  });

  // Not one of the plan's three named tests, but the plan's slice-naming wrapper is only
  // worth having if `{ cause }` actually carries the original error through to the top -
  // otherwise it is dead code that happens to also prefix a message. This pins both halves:
  // the rethrown error names the slice, and .cause is still the exact original error object
  // (not just its message), so a caller that wants the original stack or error type can get it.
  it("names the failing slice while preserving the original error via cause", async () => {
    const origineel = new Error("RFH request failed: POST /clock-supply-search -> 503");
    const deps = fakeDeps({
      finishRun: vi.fn(),
      syncSnede: vi.fn(async ({ snede }: { snede: Snede }) => {
        if (snede.auctionLocationKey === "NAALDWIJK") throw origineel;
        return {
          rowsProcessed: 0,
          versionsAdded: 0,
          totalDocuments: 0,
          pagesFetched: 1,
          stopReden: "totaal-bereikt" as const,
          compleet: true,
        };
      }),
    });

    await expect(runClockSyncWith({ trigger: "CRON" }, deps)).rejects.toMatchObject({
      message: expect.stringMatching(/NAALDWIJK.*503/s),
      cause: origineel,
    });
  });

  // Small, per the review: the try/catch around finishRun in the failure path already behaves
  // correctly (the original sync error is rethrown regardless), but nothing pinned that down.
  // A later refactor of that block could silently let a finishRun failure replace the sync
  // failure the caller actually needs to see. This locks in which one wins.
  it("rethrows the original sync failure, not a finishRun failure that happens while recording it", async () => {
    const finishRun = vi.fn(async () => {
      throw new Error("database is down");
    });
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async () => {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }),
    });

    await expect(runClockSyncWith({ trigger: "CRON" }, deps)).rejects.toThrow(/503/);
    expect(finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({ status: "FAILED" }));
  });
});

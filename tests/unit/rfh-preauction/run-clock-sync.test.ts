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
    expect(uit.pagesProcessed).toBe(56);
    expect(uit.onvolledigeSneden).toEqual([]);
    expect(uit.mislukteSneden).toEqual([]);
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
    // Elke onvolledige snede draagt zijn eigen reden, niet alleen dag en locatie - dat is
    // precies wat het cron-antwoord nodig heeft om zonder de SyncRun-rij te laten zien of het
    // om een onschuldige verschuiving gaat of om een server die zijn eigen totaal nooit haalt.
    for (const snede of uit.onvolledigeSneden) {
      expect(snede.auctionLocationKey).toBe("NAALDWIJK");
      expect(snede.stopReden).toBe("maxPaginas");
    }
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.status).toBe("SUCCEEDED");
    expect(outcome.warning).toMatch(/NAALDWIJK/);
    expect(outcome.warning).toMatch(/maxPaginas/);
  });

  // Het punt van spec §6: "Een mislukte snede kost één snede, niet de hele veildag." Eén
  // van de 28 sneden gooit; de overige 27, inclusief sneden die na de mislukte snede aan de
  // beurt komen (andere veillocaties op dezelfde dag, en latere veildagen), moeten gewoon
  // doorgaan. Dat is het gedrag dat de oude test ("marks the run failed and rethrows")
  // hiervoor juist niet toeliet - een for-loop die rethrowt breekt af, en alles ná de eerste
  // mislukking wordt dan overgeslagen.
  it("does not abort the run when a slice throws - later slices still run", async () => {
    const finishRun = vi.fn();
    const syncSnede = vi.fn(async ({ snede }: { snede: Snede }) => {
      if (snede.auctionLocationKey === "NAALDWIJK") {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }
      return {
        rowsProcessed: 10,
        versionsAdded: 2,
        totalDocuments: 10,
        pagesFetched: 1,
        stopReden: "totaal-bereikt" as const,
        compleet: true,
      };
    });
    const deps = fakeDeps({ finishRun, syncSnede });

    const uit = await runClockSyncWith({ trigger: "CRON" }, deps);

    // Alle 28 sneden zijn geprobeerd, ook de sneden ná NAALDWIJK op elke veildag.
    expect(syncSnede).toHaveBeenCalledTimes(28);
    // Vier veildagen, dus vier mislukte NAALDWIJK-sneden - en de andere 24 zijn wél verwerkt.
    expect(uit.mislukteSneden).toHaveLength(4);
    expect(uit.rowsProcessed).toBe(24 * 10);
    expect(uit.versionsAdded).toBe(24 * 2);
  });

  it("reports FAILED - not SUCCEEDED with a warning - when one or more slices threw", async () => {
    const finishRun = vi.fn();
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async ({ snede }: { snede: Snede }) => {
        if (snede.auctionLocationKey === "NAALDWIJK") {
          throw new Error("RFH request failed: POST /clock-supply-search -> 503");
        }
        return {
          rowsProcessed: 1,
          versionsAdded: 0,
          totalDocuments: 1,
          pagesFetched: 1,
          stopReden: "totaal-bereikt" as const,
          compleet: true,
        };
      }),
    });

    await runClockSyncWith({ trigger: "CRON" }, deps);

    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.status).toBe("FAILED");
    expect(outcome.errorMessage).toMatch(/4 van 28 sneden mislukt/);
    expect(outcome.errorMessage).toMatch(/NAALDWIJK/);
    expect(outcome.errorMessage).toMatch(/503/);
  });

  it("reports FAILED with a distinct message when every slice throws - not a successful run that accomplished nothing", async () => {
    const finishRun = vi.fn();
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async () => {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }),
    });

    const uit = await runClockSyncWith({ trigger: "CRON" }, deps);

    expect(uit.mislukteSneden).toHaveLength(28);
    expect(uit.rowsProcessed).toBe(0);
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.status).toBe("FAILED");
    expect(outcome.errorMessage).toMatch(/Alle 28 sneden mislukt/);
  });

  // De rethrow-wrapper bestaat om de snede aan de fout te plakken vóórdat die naar
  // SyncRun.errorMessage of de statuspagina gaat - zie de doc comment bij MislukteSnede.
  // Dit pint beide helften: het bericht noemt de snede, en .cause is nog steeds het
  // oorspronkelijke foutobject (niet alleen de tekst ervan), zodat een lezer die de originele
  // stack of het originele type nodig heeft die nog kan pakken.
  it("names the failing slice in mislukteSneden while preserving the original error via cause", async () => {
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

    const uit = await runClockSyncWith({ trigger: "CRON" }, deps);

    expect(uit.mislukteSneden).toHaveLength(4);
    for (const snede of uit.mislukteSneden) {
      expect(snede.auctionLocationKey).toBe("NAALDWIJK");
      expect(snede.fout.message).toMatch(/NAALDWIJK.*503/s);
      expect(snede.fout.cause).toBe(origineel);
    }
  });

  // Small, per the review: the try/catch around finishRun in the failure path already behaves
  // correctly (a genuinely unexpected failure - here, finishRun itself throwing - is rethrown
  // regardless), but nothing pinned that down. This locks in which error wins when even the
  // attempt to record the failure fails.
  it("rethrows when finishRun itself fails while recording a run that had mislukte sneden", async () => {
    const finishRun = vi.fn(async () => {
      throw new Error("database is down");
    });
    const deps = fakeDeps({
      finishRun,
      syncSnede: vi.fn(async () => {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }),
    });

    await expect(runClockSyncWith({ trigger: "CRON" }, deps)).rejects.toThrow(/database is down/);
    // De eerste poging (met de mislukte-sneden-tekst) faalde; de outer catch probeert het nog
    // eens met een kortere FAILED-melding voordat hij alsnog opgeeft.
    expect(finishRun).toHaveBeenCalledTimes(2);
  });
});

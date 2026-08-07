import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/rfh-preauction/sync/run-clock-sync", () => ({
  KLOK_RESOURCE: "rfh-clock-supply",
  runClockSync: vi.fn(async () => ({
    snedenVerwerkt: 28,
    rowsProcessed: 12000,
    versionsAdded: 340,
    pagesProcessed: 33,
    onvolledigeSneden: [],
    mislukteSneden: [],
  })),
}));
vi.mock("@/features/floriday/sync/run-log", () => ({ isErEenRunBezig: vi.fn(async () => false) }));

import { GET } from "@/app/api/cron/klok/route";
import { runClockSync } from "@/features/rfh-preauction/sync/run-clock-sync";
import { isErEenRunBezig } from "@/features/floriday/sync/run-log";
import { resetEnvCache } from "@/lib/env";

// getEnv() valideert het hele schema, niet alleen CRON_SECRET - zie tests/unit/api/cron-sync.test.ts
// voor hetzelfde patroon. Zonder de rest van deze velden faalt elke test al bij getEnv() zelf.
const validEnv = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  DIRECT_URL: "postgresql://user:pass@host/db?sslmode=require",
  CRON_SECRET: "geheim",
  APP_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "secret",
};

const originalEnv = process.env;

beforeEach(() => {
  resetEnvCache();
  process.env = { ...process.env, ...validEnv };
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

function verzoek(auth?: string) {
  return new Request("https://test/api/cron/klok", {
    headers: auth ? { authorization: auth } : {},
  });
}

describe("GET /api/cron/klok", () => {
  it("refuses a request without the cron secret", async () => {
    const res = await GET(verzoek());
    expect(res.status).toBe(401);
    expect(runClockSync).not.toHaveBeenCalled();
  });

  it("runs the sync and reports the totals", async () => {
    const res = await GET(verzoek("Bearer geheim"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      rowsProcessed: 12000,
      pagesProcessed: 33,
      onvolledigeSneden: [],
    });
  });

  // Het punt van deze wijziging: een lezer van het cron-antwoord moet kunnen zien waarom een
  // snede onvolledig was zonder eerst de SyncRun-rij op te zoeken. "korte-pagina" en
  // "maxPaginas" zijn geen technische details maar twee verschillende diagnoses.
  it("names the reason a slice was incomplete in the response", async () => {
    vi.mocked(runClockSync).mockResolvedValueOnce({
      snedenVerwerkt: 28,
      rowsProcessed: 11500,
      versionsAdded: 300,
      pagesProcessed: 40,
      onvolledigeSneden: [
        { auctionDate: "20260806", auctionLocationKey: "NAALDWIJK", stopReden: "maxPaginas" },
      ],
      mislukteSneden: [],
    });

    const res = await GET(verzoek("Bearer geheim"));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      onvolledigeSneden: [
        { auctionDate: "20260806", auctionLocationKey: "NAALDWIJK", stopReden: "maxPaginas" },
      ],
    });
  });

  // Anders dan onvolledigeSneden hierboven (wél data, niet compleet): dit zijn sneden
  // waarvan het ophalen zelf misging. Een reader van het cron-antwoord moet dat uit elkaar
  // kunnen houden zonder de SyncRun-rij te hoeven opzoeken - zie MislukteSnede in
  // run-clock-sync.ts.
  it("names the failed slice and its error in the response", async () => {
    vi.mocked(runClockSync).mockResolvedValueOnce({
      snedenVerwerkt: 28,
      rowsProcessed: 11000,
      versionsAdded: 290,
      pagesProcessed: 39,
      onvolledigeSneden: [],
      mislukteSneden: [
        {
          auctionDate: "20260806",
          auctionLocationKey: "NAALDWIJK",
          fout: new Error("20260806 NAALDWIJK: RFH request failed: POST /clock-supply-search -> 503"),
        },
      ],
    });

    const res = await GET(verzoek("Bearer geheim"));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      mislukteSneden: [
        {
          auctionDate: "20260806",
          auctionLocationKey: "NAALDWIJK",
          foutmelding: expect.stringMatching(/503/),
        },
      ],
    });
  });

  it("skips when a run is already going", async () => {
    vi.mocked(isErEenRunBezig).mockResolvedValueOnce(true);
    const res = await GET(verzoek("Bearer geheim"));
    expect(await res.json()).toMatchObject({ skipped: true });
    expect(runClockSync).not.toHaveBeenCalled();
  });

  it("skips the run entirely when CLOCK_SYNC_ENABLED is false", async () => {
    resetEnvCache();
    process.env = { ...process.env, ...validEnv, CLOCK_SYNC_ENABLED: "false" };

    const res = await GET(verzoek("Bearer geheim"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toMatch(/CLOCK_SYNC_ENABLED/);
    expect(runClockSync).not.toHaveBeenCalled();
  });

  // Het hele punt van twee losse schakelaars: de Floriday-schakelaar mag het klokaanbod niet
  // raken. Zonder deze test zou iemand de twee weer aan elkaar kunnen knopen (bijvoorbeeld
  // door de klok-route terug op isSyncEnabled() te zetten) zonder dat er iets rood wordt.
  it("still runs when SYNC_ENABLED (the Floriday switch) is false", async () => {
    resetEnvCache();
    process.env = { ...process.env, ...validEnv, SYNC_ENABLED: "false" };

    const res = await GET(verzoek("Bearer geheim"));

    expect(res.status).toBe(200);
    expect(runClockSync).toHaveBeenCalled();
    const body = await res.json();
    expect(body.skipped).toBeUndefined();
  });

  it("returns 500 with the message when the sync throws", async () => {
    vi.mocked(runClockSync).mockRejectedValueOnce(new Error("sessie verlopen"));
    const res = await GET(verzoek("Bearer geheim"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "sessie verlopen" });
  });
});

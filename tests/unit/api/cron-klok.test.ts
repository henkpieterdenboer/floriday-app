import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/rfh-preauction/sync/run-clock-sync", () => ({
  KLOK_RESOURCE: "rfh-clock-supply",
  runClockSync: vi.fn(async () => ({
    snedenVerwerkt: 28,
    rowsProcessed: 12000,
    versionsAdded: 340,
    onvolledigeSneden: [],
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
    expect(await res.json()).toMatchObject({ rowsProcessed: 12000, onvolledigeSneden: [] });
  });

  it("skips when a run is already going", async () => {
    vi.mocked(isErEenRunBezig).mockResolvedValueOnce(true);
    const res = await GET(verzoek("Bearer geheim"));
    expect(await res.json()).toMatchObject({ skipped: true });
    expect(runClockSync).not.toHaveBeenCalled();
  });

  it("returns 500 with the message when the sync throws", async () => {
    vi.mocked(runClockSync).mockRejectedValueOnce(new Error("sessie verlopen"));
    const res = await GET(verzoek("Bearer geheim"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "sessie verlopen" });
  });
});

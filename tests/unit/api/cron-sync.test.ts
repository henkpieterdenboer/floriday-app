import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runSupplySyncMock = vi.fn();

vi.mock("@/features/floriday/sync/run-supply-sync", () => ({
  runSupplySync: runSupplySyncMock,
}));

const { GET } = await import("@/app/api/cron/sync/route");
const { resetEnvCache } = await import("@/lib/env");

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  DIRECT_URL: "postgresql://user:pass@host/db?sslmode=require",
  FLORIDAY_TOKEN_URL: "https://idm.staging.floriday.io/oauth2/x/v1/token",
  FLORIDAY_CUSTOMERS_API_BASE_URL: "https://api.staging.floriday.io/customers-api-2026v1",
  FLORIDAY_CUSTOMERS_CLIENT_ID: "abc",
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: "secret",
  FLORIDAY_CUSTOMERS_API_KEY: "key",
  CRON_SECRET: "the-real-secret",
  APP_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "secret",
};

function request(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://example.com/api/cron/sync", { headers });
}

describe("GET /api/cron/sync", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
    process.env = { ...process.env, ...validEnv };
    runSupplySyncMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects a request with no authorization header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(runSupplySyncMock).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(runSupplySyncMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing the Bearer prefix", async () => {
    const response = await GET(request("the-real-secret"));

    expect(response.status).toBe(401);
    expect(runSupplySyncMock).not.toHaveBeenCalled();
  });

  it("runs the sync and returns 200 for a correctly authorized request", async () => {
    runSupplySyncMock.mockResolvedValue({
      pagesProcessed: 3,
      rowsProcessed: 2500,
      versionsAdded: 100,
      duplicatesCollapsed: 0,
      cursor: 123456789012345678901234567890n,
      reachedEnd: true,
      warning: undefined,
      tradeItemsAdded: 4,
    });

    const response = await GET(request("Bearer the-real-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      pagesProcessed: 3,
      rowsProcessed: 2500,
      versionsAdded: 100,
      tradeItemsAdded: 4,
      cursor: "123456789012345678901234567890",
      reachedEnd: true,
      warning: null,
    });
    expect(runSupplySyncMock).toHaveBeenCalledWith({ trigger: "CRON", maxPages: 20 });
  });

  it("serializes a bigint cursor to a string rather than throwing", async () => {
    runSupplySyncMock.mockResolvedValue({
      pagesProcessed: 0,
      rowsProcessed: 0,
      versionsAdded: 0,
      duplicatesCollapsed: 0,
      cursor: 0n,
      reachedEnd: false,
      warning: undefined,
      tradeItemsAdded: 0,
    });

    const response = await GET(request("Bearer the-real-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cursor).toBe("0");
  });

  it("returns a 500 with the error message when the sync throws", async () => {
    runSupplySyncMock.mockRejectedValue(new Error("Floriday request failed: boom"));

    const response = await GET(request("Bearer the-real-secret"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Floriday request failed: boom" });
  });

  it("returns a 500 naming the missing field when CRON_SECRET is not configured", async () => {
    resetEnvCache();
    const { CRON_SECRET, ...withoutSecret } = validEnv;
    process.env = { ...process.env, ...withoutSecret };
    delete process.env.CRON_SECRET;

    const response = await GET(request("Bearer anything"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/CRON_SECRET/);
    expect(runSupplySyncMock).not.toHaveBeenCalled();
  });
});

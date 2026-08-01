import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runOrganizationSyncMock = vi.fn();

vi.mock("@/features/floriday/sync/run-organization-sync", () => ({
  runOrganizationSync: runOrganizationSyncMock,
}));

const { GET } = await import("@/app/api/cron/organizations/route");
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
  return new Request("https://example.com/api/cron/organizations", { headers });
}

describe("GET /api/cron/organizations", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
    process.env = { ...process.env, ...validEnv };
    runOrganizationSyncMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects a request with no authorization header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(runOrganizationSyncMock).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(runOrganizationSyncMock).not.toHaveBeenCalled();
  });

  it("runs the sync and returns 200 for a correctly authorized request, without a trade item field", async () => {
    runOrganizationSyncMock.mockResolvedValue({
      pagesProcessed: 2,
      rowsProcessed: 1500,
      cursor: 987654321098765432109876543210n,
      reachedEnd: false,
      warning: undefined,
    });

    const response = await GET(request("Bearer the-real-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      pagesProcessed: 2,
      rowsProcessed: 1500,
      cursor: "987654321098765432109876543210",
      reachedEnd: false,
      warning: null,
    });
    expect(body).not.toHaveProperty("tradeItemsAdded");
    expect(runOrganizationSyncMock).toHaveBeenCalledWith({ trigger: "CRON", maxPages: 20 });
  });

  it("returns a 500 with the error message when the sync throws", async () => {
    runOrganizationSyncMock.mockRejectedValue(new Error("Floriday request failed: boom"));

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
    expect(runOrganizationSyncMock).not.toHaveBeenCalled();
  });
});

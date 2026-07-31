import { describe, expect, it, vi } from "vitest";
import { createFloridayClient } from "@/features/floriday/client/http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const baseOptions = {
  baseUrl: "https://api.example.test/customers-api",
  apiKey: "test-key",
  tokenCache: { getToken: async () => "test-token", invalidate: () => {} },
  rateLimiter: { acquire: async () => {} },
  sleep: async () => {},
};

describe("createFloridayClient", () => {
  it("sends both required headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await client.getJson("/thing");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/customers-api/thing");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("test-key");
  });

  it("retries on 429 and then succeeds", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("refreshes the token once on 401", async () => {
    const invalidate = vi.fn();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("nope", { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({
      ...baseOptions,
      tokenCache: { getToken: async () => "test-token", invalidate },
      fetchImpl,
    });

    await expect(client.getJson("/thing")).resolves.toEqual({ ok: true });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("gives up after the maximum number of attempts", async () => {
    // A fresh Response per call, because a body can only be read once and real fetch
    // never hands back the same object twice.
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl, maxAttempts: 3 });

    await expect(client.getJson("/thing")).rejects.toThrow(/500/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 403, because that signals a permission problem", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ title: "There are no connected suppliers." }, 403),
    );
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).rejects.toThrow(/no connected suppliers/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("asks the rate limiter before every attempt", async () => {
    const acquire = vi.fn(async () => {});
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({
      ...baseOptions,
      rateLimiter: { acquire },
      fetchImpl,
    });

    await client.getJson("/thing");
    expect(acquire).toHaveBeenCalledTimes(2);
  });

  it("stops retrying a 401 after the token refresh also fails", async () => {
    const invalidate = vi.fn();
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 401 }));
    const client = createFloridayClient({
      ...baseOptions,
      tokenCache: { getToken: async () => "test-token", invalidate },
      fetchImpl,
    });

    await expect(client.getJson("/thing")).rejects.toThrow(/401/);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports a diagnosable error when a 200 carries invalid json", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>oops</html>", { status: 200 }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).rejects.toThrow(/invalid json.*\/thing/i);
  });
});

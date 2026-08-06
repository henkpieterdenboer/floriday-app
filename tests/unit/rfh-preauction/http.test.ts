import { describe, expect, it, vi } from "vitest";
import { createPreauctionHttp } from "@/features/rfh-preauction/client/http";

function tokenCacheStub(tokens: string[] = ["t1"]) {
  let i = 0;
  return {
    getToken: vi.fn(async () => tokens[Math.min(i, tokens.length - 1)]),
    invalidate: vi.fn(() => {
      i++;
    }),
  };
}

const noSleep = async () => {};

describe("createPreauctionHttp", () => {
  it("posts the body as json with a bearer token", async () => {
    // `vi.fn()` without an initial implementation, then `.mockResolvedValue(...)`: passing an
    // inline no-argument implementation straight into `vi.fn(...)` narrows its inferred call
    // signature to zero parameters, which turns `mock.calls[0]` into an empty tuple and every
    // destructured element into `never`.
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: noSleep,
    });

    const out = await http.postJson<{ ok: boolean }>("/clock-supply-search", { take: 1 });

    expect(out).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.test/v16.0/clock-supply-search");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer t1");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect((init?.headers as Record<string, string>).Accept).toBe("application/json");
    expect((init?.headers as Record<string, string>)["X-Language-Code"]).toBe("nl");
    expect(JSON.parse(init?.body as string)).toEqual({ take: 1 });
  });

  it("retries once with a fresh token after a 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const cache = tokenCacheStub(["t1", "t2"]);
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: cache,
      fetchImpl,
      sleep: noSleep,
    });

    await http.postJson("/clock-supply-search", {});

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [, secondInit] = fetchImpl.mock.calls[1];
    expect((secondInit?.headers as Record<string, string>).Authorization).toBe("Bearer t2");
  });

  it("retries a 503 and gives up after maxAttempts", async () => {
    const fetchImpl = vi.fn(async () => new Response("stuk", { status: 503 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: noSleep,
      maxAttempts: 3,
    });

    await expect(http.postJson("/clock-supply-search", {})).rejects.toThrow(/after 3 attempts/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 403", async () => {
    const fetchImpl = vi.fn(async () => new Response("verboden", { status: 403 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: noSleep,
    });

    await expect(http.postJson("/clock-supply-search", {})).rejects.toThrow(/403/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  // Not one of the plan's four tests. Added because the catch branch for a network-level
  // throw (a reset socket, a DNS blip - the request never reaching RFH at all) was otherwise
  // never exercised. The mirrored branch in the Floriday client is the one that let a real
  // backfill die on ECONNRESET after twelve minutes, so it earns a test here too.
  it("retries a dropped connection and then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: noSleep,
    });

    await expect(http.postJson("/clock-supply-search", {})).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  // Not one of the plan's four tests. The `continue` on a 401 sits inside a C-style `for`
  // loop, so it still runs the loop's increment - the 401 recovery spends one slot of
  // maxAttempts, it is not "free". This pins down that the budget still works out: with the
  // default of 5, a 401 followed by four 503s means every one of those four 503s still gets
  // its own retry, and the run only gives up once the budget is actually exhausted.
  it("still retries four 503s after a 401 recovery, within the default attempt budget", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 401 }))
      .mockResolvedValue(new Response("stuk", { status: 503 }));
    const cache = tokenCacheStub(["t1", "t2"]);
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: cache,
      fetchImpl,
      sleep: noSleep,
    });

    await expect(http.postJson("/clock-supply-search", {})).rejects.toThrow(/after 5 attempts/);
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });
});

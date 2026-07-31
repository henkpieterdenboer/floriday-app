import { describe, expect, it, vi } from "vitest";
import { createTokenCache } from "@/features/floriday/client/token-cache";

describe("createTokenCache", () => {
  it("fetches once and reuses the token", async () => {
    const fetchToken = vi.fn().mockResolvedValue("token-1");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    expect(await cache.getToken()).toBe("token-1");
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it("fetches again once the token has expired", async () => {
    vi.useFakeTimers();
    const fetchToken = vi.fn()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    vi.advanceTimersByTime(3541 * 1000);
    expect(await cache.getToken()).toBe("token-2");

    vi.useRealTimers();
  });

  it("discards the cached token on invalidate", async () => {
    const fetchToken = vi.fn()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    cache.invalidate();
    expect(await cache.getToken()).toBe("token-2");
  });

  it("does not fetch twice when two callers ask at the same time", async () => {
    let resolveFetch: (value: string) => void = () => {};
    const fetchToken = vi.fn(() => new Promise<string>((resolve) => {
      resolveFetch = resolve;
    }));
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    const first = cache.getToken();
    const second = cache.getToken();
    resolveFetch("token-1");

    expect(await first).toBe("token-1");
    expect(await second).toBe("token-1");
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });
});

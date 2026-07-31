import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/features/floriday/client/rate-limiter";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

/** Reports whether a promise has settled, without hanging if it has not. */
async function hasSettled(promise: Promise<void>): Promise<boolean> {
  let settled = false;
  void promise.then(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(0);
  return settled;
}

describe("createRateLimiter", () => {
  it("lets the first request through without waiting", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    expect(await hasSettled(limiter.acquire())).toBe(true);
  });

  it("spaces the next request by a third of a second", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    let settled = false;
    void limiter.acquire().then(() => { settled = true; });

    await vi.advanceTimersByTimeAsync(300);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(50);
    expect(settled).toBe(true);
  });

  it("makes the delay cumulative across queued requests", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    void limiter.acquire();
    let thirdSettled = false;
    void limiter.acquire().then(() => { thirdSettled = true; });

    await vi.advanceTimersByTimeAsync(600);
    expect(thirdSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    expect(thirdSettled).toBe(true);
  });

  it("does not wait when enough time has already passed", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    await vi.advanceTimersByTimeAsync(1000);

    expect(await hasSettled(limiter.acquire())).toBe(true);
  });
});

export interface RateLimiter {
  /** Resolves as soon as another request may be sent. */
  acquire(): Promise<void>;
}

export interface RateLimiterOptions {
  requestsPerSecond: number;
}

/**
 * Spaces requests evenly instead of allowing bursts. Floriday allows 3.4 requests per
 * second; we run at 3 to keep a margin for clock drift between our host and theirs.
 *
 * Only the very first request is immediate; every later request waits for its own
 * slot, `intervalMs` after the previous one. There is no burst allowance beyond that
 * first call — predictable, even pacing matters more here than a fast start, since a
 * backfill run makes over a thousand consecutive requests.
 */
export function createRateLimiter({ requestsPerSecond }: RateLimiterOptions): RateLimiter {
  const intervalMs = 1000 / requestsPerSecond;
  let nextSlot = 0;

  return {
    async acquire(): Promise<void> {
      const now = Date.now();
      const slot = Math.max(now, nextSlot);
      nextSlot = slot + intervalMs;

      const waitMs = slot - now;
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    },
  };
}

import { getEnv } from "@/lib/env";
import { createFloridayClient, type FloridayClient } from "@/features/floriday/client/http";
import { createRateLimiter } from "@/features/floriday/client/rate-limiter";
import { createTokenCache } from "@/features/floriday/client/token-cache";
import { fetchAccessToken } from "@/features/floriday/client/token-request";

/**
 * Builds the client used against the customers API (clock pre-sales supply,
 * organizations, trade items). One rate limiter and one token cache per client instance -
 * callers that need to share request pacing across an entire run should build this once
 * and reuse it, not call this per page.
 */
export function createCustomersClient(): FloridayClient {
  const env = getEnv();

  return createFloridayClient({
    baseUrl: env.FLORIDAY_CUSTOMERS_API_BASE_URL,
    apiKey: env.FLORIDAY_CUSTOMERS_API_KEY,
    tokenCache: createTokenCache({
      fetchToken: () => fetchAccessToken(env),
      ttlSeconds: 3540,
    }),
    rateLimiter: createRateLimiter({ requestsPerSecond: 3 }),
  });
}

export type { FloridayClient };

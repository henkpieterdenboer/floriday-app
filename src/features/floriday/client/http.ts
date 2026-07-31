import type { RateLimiter } from "@/features/floriday/client/rate-limiter";
import type { TokenCache } from "@/features/floriday/client/token-cache";

export interface FloridayClient {
  getJson<T>(path: string): Promise<T>;
}

export interface FloridayClientOptions {
  baseUrl: string;
  apiKey: string;
  tokenCache: TokenCache;
  rateLimiter: RateLimiter;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createFloridayClient(options: FloridayClientOptions): FloridayClient {
  const {
    baseUrl,
    apiKey,
    tokenCache,
    rateLimiter,
    fetchImpl = fetch,
    maxAttempts = 5,
    sleep = defaultSleep,
  } = options;

  /** Reads the body once, for an error we are about to throw. */
  async function describe(response: Response): Promise<string> {
    const body = await response.text();
    return `${response.status} ${body.slice(0, 300)}`;
  }

  async function getJson<T>(path: string): Promise<T> {
    let refreshedToken = false;
    let lastFailure: Response | null = null;
    let lastNetworkError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await rateLimiter.acquire();

      const token = await tokenCache.getToken();

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": apiKey,
            Accept: "application/json",
          },
        });
      } catch (error: unknown) {
        // fetch throws rather than returning a response when the connection itself
        // fails: a reset socket, a DNS blip, a dropped TLS handshake. Over a backfill
        // that makes hundreds of consecutive calls this is not exotic - it killed a run
        // at ECONNRESET after twelve minutes. Treat it like a 5xx: worth retrying,
        // because the request never reached Floriday and nothing was consumed.
        lastNetworkError = error instanceof Error ? error.message : String(error);
        lastFailure = null;

        if (attempt < maxAttempts) {
          await sleep(Math.min(2 ** (attempt - 1) * 500, 8000));
          continue;
        }
        break;
      }

      lastNetworkError = null;

      if (response.ok) {
        // Not response.json(): a proxy or error page returning HTML with a 200 would
        // otherwise surface as a bare SyntaxError with no clue which call produced it.
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(
            `Floriday returned invalid json: GET ${path} -> ${text.slice(0, 300)}`,
          );
        }
      }

      // A stale token is worth exactly one retry; beyond that it is a real problem.
      if (response.status === 401 && !refreshedToken) {
        tokenCache.invalidate();
        refreshedToken = true;
        continue;
      }

      // 403 means the organisation lacks permission. Retrying cannot fix that, and
      // silently looping would hide a change on the Floriday side.
      if (!RETRYABLE_STATUSES.has(response.status)) {
        throw new Error(`Floriday request failed: GET ${path} -> ${await describe(response)}`);
      }

      // Keep the response, do not read it yet: attempts that end up succeeding should
      // not pay for reading a body nobody will look at.
      lastFailure = response;

      if (attempt < maxAttempts) {
        await sleep(Math.min(2 ** (attempt - 1) * 500, 8000));
      }
    }

    const detail = lastFailure
      ? await describe(lastFailure)
      : (lastNetworkError ?? "no response");
    throw new Error(
      `Floriday request failed after ${maxAttempts} attempts: GET ${path} -> ${detail}`,
    );
  }

  return { getJson };
}

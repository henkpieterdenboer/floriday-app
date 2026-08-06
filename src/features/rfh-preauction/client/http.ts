import type { TokenCache } from "@/features/floriday/client/token-cache";

export interface PreauctionHttp {
  postJson<T>(path: string, body: unknown): Promise<T>;
}

export interface PreauctionHttpOptions {
  baseUrl: string;
  tokenCache: TokenCache;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The same shape as the Floriday client's getJson, for the same reasons: bounded retries on
 * transient failures, exactly one retry on a stale token, and no retry at all on a status
 * that retrying cannot fix.
 *
 * No rate limiter here. Floriday publishes 3.4 requests per second and we honour it; RFH
 * publishes nothing, and one sync run of this feed is a few dozen requests spread over
 * seconds - well under what the web app itself produces when a buyer scrolls a filter list.
 * Add one the moment that stops being true.
 */
export function createPreauctionHttp(options: PreauctionHttpOptions): PreauctionHttp {
  const {
    baseUrl,
    tokenCache,
    fetchImpl = fetch,
    maxAttempts = 5,
    sleep = defaultSleep,
  } = options;

  /** Reads the body once, for an error we are about to throw. */
  async function describe(response: Response): Promise<string> {
    const body = await response.text();
    return `${response.status} ${body.slice(0, 300)}`;
  }

  async function postJson<T>(path: string, body: unknown): Promise<T> {
    let refreshedToken = false;
    let lastFailure: Response | null = null;
    let lastNetworkError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const token = await tokenCache.getToken();

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Language-Code": "nl",
          },
          body: JSON.stringify(body),
        });
      } catch (error: unknown) {
        // fetch throws rather than returning a response when the connection itself
        // fails: a reset socket, a DNS blip, a dropped TLS handshake. Treat it like a
        // 5xx: worth retrying, because the request never reached RFH.
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
          throw new Error(`RFH returned invalid json: POST ${path} -> ${text.slice(0, 300)}`);
        }
      }

      // A stale token is worth exactly one retry; beyond that it is a real problem.
      if (response.status === 401 && !refreshedToken) {
        tokenCache.invalidate();
        refreshedToken = true;
        continue;
      }

      // 403 means the organisation lacks permission. Retrying cannot fix that, and
      // silently looping would hide a change on the RFH side.
      if (!RETRYABLE_STATUSES.has(response.status)) {
        throw new Error(`RFH request failed: POST ${path} -> ${await describe(response)}`);
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
      `RFH request failed after ${maxAttempts} attempts: POST ${path} -> ${detail}`,
    );
  }

  return { postJson };
}

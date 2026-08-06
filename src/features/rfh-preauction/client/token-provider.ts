import type { TokenCache } from "@/features/floriday/client/token-cache";
import { getRfhEnv } from "@/lib/env";
import { requestAccessToken } from "@/features/rfh-preauction/client/token-request";
import { vernieuwOnderSlot } from "@/features/rfh-preauction/client/session-store";

/**
 * How much of the token's life we refuse to use. A 60-minute token refreshed at 55 minutes
 * leaves five minutes of slack, which is more than a whole sync run of the size this feed
 * produces needs to finish.
 */
const MARGE_SECONDEN = 300;

export interface RfhTokenProviderOptions {
  /** Returns a fresh access token. Injected so the cache logic is testable without a database. */
  vernieuw: () => Promise<{ accessToken: string; expiresInSeconds: number }>;
  now?: () => number;
}

/**
 * Caches the access token for the life of the process.
 *
 * Reuses the TokenCache shape from the Floriday client so the HTTP layer below can stay
 * identical in structure, but the refresh underneath is a very different animal: it spends
 * a stored, rotating credential rather than re-presenting a client secret. That is why the
 * cache matters more here than there - every avoided refresh is an avoided rotation, and
 * every rotation is a chance to lose the session.
 *
 * A rejected `vernieuw()` is never cached: `onderweg` is cleared in `.finally()` on both
 * the success and the failure path, so every concurrent caller sees the same rejection and
 * the very next call gets a fresh attempt rather than a permanently poisoned promise.
 */
export function createRfhTokenProvider(options: RfhTokenProviderOptions): TokenCache {
  const { vernieuw, now = () => Date.now() } = options;

  let token: string | null = null;
  let verlooptOp = 0;
  let onderweg: Promise<string> | null = null;

  return {
    async getToken(): Promise<string> {
      if (token && now() < verlooptOp) return token;
      if (onderweg) return onderweg;

      onderweg = vernieuw()
        .then(({ accessToken, expiresInSeconds }) => {
          token = accessToken;
          // If the lifetime is shorter than the margin, `expiresInSeconds - MARGE_SECONDEN`
          // goes negative and a naive Math.max(..., 0) would make the token expire the
          // instant it arrives - every next getToken() would then refresh again, which is
          // the exact loop this cache exists to prevent, and on a rotating credential every
          // extra refresh is an extra chance to lose the session. Falling back to half the
          // lifetime keeps a usable window instead: shorter than usual, but never zero for
          // as long as expiresInSeconds is positive. Nothing observed from Okta triggers
          // this today (it hands back ~3600, and requestAccessToken falls back to 3600 when
          // expires_in is missing), but the fallback should hold regardless of what Okta
          // happens to send.
          const bruikbareSeconden =
            expiresInSeconds > MARGE_SECONDEN ? expiresInSeconds - MARGE_SECONDEN : expiresInSeconds / 2;
          verlooptOp = now() + Math.max(bruikbareSeconden, 0) * 1000;
          return accessToken;
        })
        .finally(() => {
          onderweg = null;
        });

      return onderweg;
    },

    // Deliberately does not touch `onderweg`. If a refresh is already under way when this
    // is called, that refresh is a real round trip to Okta that has not resolved yet - its
    // result is by construction fresher than whatever this invalidate() is trying to
    // discard, so a caller that lands on it afterwards is not getting a stale token. Task 6
    // relies on exactly this: on a 401 it calls invalidate() and immediately retries via
    // getToken(); if a refresh happens to already be in flight at that moment, the retry
    // rides along on it instead of forcing a second, redundant rotation. Clearing `onderweg`
    // here "for tidiness" would remove that benefit without fixing anything - the in-flight
    // promise still resolves and still gets used by whoever awaited it before.
    invalidate(): void {
      token = null;
      verlooptOp = 0;
    },
  };
}

/** Production wiring: refreshes against Okta and persists the rotated token. */
export function createProductieTokenProvider(): TokenCache {
  return createRfhTokenProvider({
    vernieuw: () =>
      vernieuwOnderSlot(async (huidige) => {
        const env = getRfhEnv();
        const resultaat = await requestAccessToken({
          tokenUrl: env.RFH_PREAUCTION_TOKEN_URL,
          clientId: env.RFH_PREAUCTION_CLIENT_ID,
          refreshToken: huidige,
        });
        return {
          nieuweRefreshToken: resultaat.refreshToken,
          waarde: {
            accessToken: resultaat.accessToken,
            expiresInSeconds: resultaat.expiresInSeconds,
          },
        };
      }),
  });
}

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
          verlooptOp = now() + Math.max(expiresInSeconds - MARGE_SECONDEN, 0) * 1000;
          return accessToken;
        })
        .finally(() => {
          onderweg = null;
        });

      return onderweg;
    },

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

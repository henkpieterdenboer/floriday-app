export interface TokenCache {
  getToken(): Promise<string>;
  /** Drops the cached token so the next call fetches a fresh one. */
  invalidate(): void;
}

export interface TokenCacheOptions {
  fetchToken: () => Promise<string>;
  /** Royal FloraHolland recommends 3540 seconds for a token valid for 3600. */
  ttlSeconds: number;
}

export function createTokenCache({ fetchToken, ttlSeconds }: TokenCacheOptions): TokenCache {
  let token: string | null = null;
  let expiresAt = 0;
  let inFlight: Promise<string> | null = null;

  return {
    async getToken(): Promise<string> {
      if (token && Date.now() < expiresAt) return token;
      if (inFlight) return inFlight;

      inFlight = fetchToken()
        .then((fresh) => {
          token = fresh;
          expiresAt = Date.now() + ttlSeconds * 1000;
          return fresh;
        })
        .finally(() => {
          inFlight = null;
        });

      return inFlight;
    },

    invalidate(): void {
      token = null;
      expiresAt = 0;
    },
  };
}

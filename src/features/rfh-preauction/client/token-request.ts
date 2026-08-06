/**
 * The scopes the Pre-Auction web app itself requests, verified against a live token on
 * 6 August 2026. Asking for fewer would work for reading supply, but a token whose scopes
 * differ from the app's is a token whose behaviour we can no longer predict from what the
 * app does - and the app is our only documentation for this API.
 */
const SCOPES = ["role:customer", "openid", "offline_access", "role:app", "profile"];

/**
 * `typeof value === "string"` is true for `""`, and Okta returning an empty
 * access_token or refresh_token would otherwise be treated as valid - silently
 * corrupting the stored session in the refresh_token case. The length check is what
 * turns "technically a string" into "actually usable".
 */
function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export interface RequestAccessTokenOptions {
  tokenUrl: string;
  clientId: string;
  refreshToken: string;
  fetchImpl?: typeof fetch;
}

export interface AccessTokenResult {
  accessToken: string;
  /**
   * The refresh token to store for next time. Okta rotates on every use, so this is
   * normally a new value; when the server returns none, the one we sent is still current.
   * Storing the wrong one here kills the session permanently, which is why this is never
   * left implicit.
   */
  refreshToken: string;
  expiresInSeconds: number;
}

/**
 * Exchanges a refresh token for an access token.
 *
 * Deliberately knows nothing about storage or caching: the rotation makes persistence the
 * delicate part, and that belongs in session-store.ts where it can be wrapped in a lock.
 */
export async function requestAccessToken(
  options: RequestAccessTokenOptions,
): Promise<AccessTokenResult> {
  const { tokenUrl, clientId, refreshToken, fetchImpl = fetch } = options;

  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      scope: SCOPES.join(" "),
    }),
  });

  // Not response.json(): an HTML error page (proxy, gateway) returning a non-JSON body
  // would otherwise surface as a bare SyntaxError with no clue which call produced it.
  const text = await response.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // text here is the response body, never the request body, so it cannot contain the
    // refresh token we sent.
    throw new Error(
      `RFH token request returned invalid json: ${response.status} ${text.slice(0, 200)}`,
    );
  }

  const accessToken = nonEmptyString(payload.access_token);

  if (!response.ok || !accessToken) {
    // Never include the request body in this message: it carries the refresh token, and
    // this error ends up in RfhSession.lastError and on the status page. `payload` and
    // `text` are both derived from the response body, which cannot echo it back.
    const errorCode = typeof payload.error === "string" ? payload.error : String(response.status);
    const description =
      typeof payload.error_description === "string"
        ? payload.error_description
        : text.slice(0, 200);
    throw new Error(`RFH token request failed: ${errorCode} - ${description}`);
  }

  return {
    accessToken,
    refreshToken: nonEmptyString(payload.refresh_token) ?? refreshToken,
    expiresInSeconds: typeof payload.expires_in === "number" ? payload.expires_in : 3600,
  };
}

import type { Env } from "@/lib/env";

const SCOPES = [
  "role:app",
  "catalog:read",
  "organization:read",
  "supply:read",
  "sales-order:read",
  "delivery-conditions:read",
].join(" ");

export async function fetchAccessToken(env: Env): Promise<string> {
  const response = await fetch(env.FLORIDAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.FLORIDAY_CUSTOMERS_CLIENT_ID,
      client_secret: env.FLORIDAY_CUSTOMERS_CLIENT_SECRET,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

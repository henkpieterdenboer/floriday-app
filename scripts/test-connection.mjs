/**
 * Connection test against the Floriday staging API.
 *
 * Fetches an OAuth2 token and, if an API key is configured, calls the clock
 * presales supply endpoints. Without an API key it stops after the token and
 * reports what is still missing.
 *
 * Usage: node scripts/test-connection.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    console.error("No .env found - copy .env.example to .env first.");
    process.exit(1);
  }
}

const SCOPES = [
  "role:app",
  "catalog:read",
  "organization:read",
  "supply:read",
  "sales-order:read",
  "delivery-conditions:read",
].join(" ");

async function getToken(tokenUrl, clientId, clientSecret) {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  loadEnv();

  const tokenUrl = process.env.FLORIDAY_TOKEN_URL;
  const apiBaseUrl = process.env.FLORIDAY_CUSTOMERS_API_BASE_URL;
  const clientId = process.env.FLORIDAY_CUSTOMERS_CLIENT_ID;
  const clientSecret = process.env.FLORIDAY_CUSTOMERS_CLIENT_SECRET;
  const apiKey = process.env.FLORIDAY_CUSTOMERS_API_KEY;

  if (!tokenUrl || !apiBaseUrl || !clientId || !clientSecret) {
    console.error("Missing required environment variables. See .env.example.");
    process.exit(1);
  }

  console.log("1. Requesting access token...");
  const token = await getToken(tokenUrl, clientId, clientSecret);
  console.log(`   OK - expires in ${token.expires_in}s`);
  console.log(`   scopes: ${token.scope}`);

  if (!apiKey) {
    console.log("\n2. Skipped - FLORIDAY_CUSTOMERS_API_KEY is not set yet.");
    console.log("   Generate it in the Floriday UI:");
    console.log("   Settings > Apps & integrations > Integrations > Add application.");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    "X-Api-Key": apiKey,
    Accept: "application/json",
  };

  console.log("\n2. Fetching max sequence number for clock presales supply...");
  const maxSequenceResponse = await fetch(
    `${apiBaseUrl}/auction/clock-presales-supply/max-sequence-number`,
    { headers },
  );
  if (!maxSequenceResponse.ok) {
    throw new Error(`${maxSequenceResponse.status} ${await maxSequenceResponse.text()}`);
  }
  console.log(`   OK - ${await maxSequenceResponse.text()}`);

  console.log("\n3. Fetching first page of clock presales supply lines...");
  const syncResponse = await fetch(
    `${apiBaseUrl}/auction/clock-presales-supply/sync/0?limit=50`,
    { headers },
  );
  if (!syncResponse.ok) {
    throw new Error(`${syncResponse.status} ${await syncResponse.text()}`);
  }
  const page = await syncResponse.json();
  console.log(`   OK - ${page.results.length} lines, max sequence ${page.maximumSequenceNumber}`);
  if (page.results.length > 0) {
    console.log("\n   First line:");
    console.log(JSON.stringify(page.results[0], null, 2));
  }
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});

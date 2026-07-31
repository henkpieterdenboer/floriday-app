/**
 * Stores real Floriday responses as test input, so unit tests run against reality
 * instead of hand-written JSON. Fixtures are gitignored; rerun this to recreate them.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { getEnv } from "@/lib/env";
import { createFloridayClient } from "@/features/floriday/client/http";
import { createRateLimiter } from "@/features/floriday/client/rate-limiter";
import { createTokenCache } from "@/features/floriday/client/token-cache";
import { fetchAccessToken } from "@/features/floriday/client/token-request";

const OUTPUT_DIR = "tests/fixtures";

async function main(): Promise<void> {
  const env = getEnv();
  const client = createFloridayClient({
    baseUrl: env.FLORIDAY_CUSTOMERS_API_BASE_URL,
    apiKey: env.FLORIDAY_CUSTOMERS_API_KEY,
    tokenCache: createTokenCache({ fetchToken: () => fetchAccessToken(env), ttlSeconds: 3540 }),
    rateLimiter: createRateLimiter({ requestsPerSecond: 3 }),
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const supplyPage = await client.getJson<{ results: { tradeItemId: string }[] }>(
    "/auction/clock-presales-supply/sync/501390000?limit=25",
  );
  writeFileSync(`${OUTPUT_DIR}/supply-page.json`, JSON.stringify(supplyPage, null, 2));

  const tradeItemIds = [...new Set(supplyPage.results.map((r) => r.tradeItemId))].slice(0, 5);
  const tradeItems = await client.getJson(`/trade-items?tradeItemIds=${tradeItemIds.join(",")}`);
  writeFileSync(`${OUTPUT_DIR}/trade-items.json`, JSON.stringify(tradeItems, null, 2));

  const organizations = await client.getJson("/organizations/sync/0?limit=25");
  writeFileSync(`${OUTPUT_DIR}/organizations.json`, JSON.stringify(organizations, null, 2));

  console.log(`Wrote fixtures to ${OUTPUT_DIR}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

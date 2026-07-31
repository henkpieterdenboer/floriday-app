/**
 * Explores what the clock presales supply sync actually returns.
 *
 * Walks a number of sync pages from sequence 0 and aggregates auction dates,
 * locations, statuses and suppliers. Use this to sanity check the scope of the
 * feed - in particular whether it is filtered on our connections.
 *
 * Usage: node scripts/explore-clock-supply.mjs [pages] [limit]
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}

const PAGES = Number(process.argv[2] ?? 12);
const LIMIT = Number(process.argv[3] ?? 1000);

const SCOPES = [
  "role:app",
  "catalog:read",
  "organization:read",
  "supply:read",
  "sales-order:read",
  "delivery-conditions:read",
].join(" ");

const tokenResponse = await fetch(process.env.FLORIDAY_TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.FLORIDAY_CUSTOMERS_CLIENT_ID,
    client_secret: process.env.FLORIDAY_CUSTOMERS_CLIENT_SECRET,
    scope: SCOPES,
  }),
});
if (!tokenResponse.ok) {
  throw new Error(`Token request failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
}
const { access_token: accessToken } = await tokenResponse.json();

const baseUrl = process.env.FLORIDAY_CUSTOMERS_API_BASE_URL;
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "X-Api-Key": process.env.FLORIDAY_CUSTOMERS_API_KEY,
  Accept: "application/json",
};

const maxSequence = Number(
  await (await fetch(`${baseUrl}/auction/clock-presales-supply/max-sequence-number`, { headers })).text(),
);
console.log(`max sequence: ${maxSequence}`);

const auctionDates = new Map();
const locations = new Map();
const statuses = new Map();
const suppliers = new Set();
let total = 0;
let sequence = 0;

for (let page = 0; page < PAGES; page++) {
  const response = await fetch(
    `${baseUrl}/auction/clock-presales-supply/sync/${sequence}?limit=${LIMIT}`,
    { headers },
  );
  if (!response.ok) {
    console.log(`page ${page}: ${response.status} ${await response.text()}`);
    break;
  }

  const body = await response.json();
  const rows = body.results;
  if (rows.length === 0) {
    console.log(`page ${page}: empty (our sequence ${sequence}, api max ${body.maximumSequenceNumber})`);
    break;
  }

  total += rows.length;
  for (const row of rows) {
    auctionDates.set(row.auctionDate, (auctionDates.get(row.auctionDate) ?? 0) + 1);
    locations.set(row.initialAuctionLocation, (locations.get(row.initialAuctionLocation) ?? 0) + 1);
    statuses.set(row.status, (statuses.get(row.status) ?? 0) + 1);
    suppliers.add(row.supplierOrganizationId);
  }

  sequence = rows[rows.length - 1].sequenceNumber;
  console.log(`page ${page}: ${rows.length} rows, sequence now ${sequence}`);
  if (sequence >= maxSequence) break;
}

const sortByCount = (map) => Object.fromEntries([...map].sort((a, b) => b[1] - a[1]));

console.log(`\ntotal rows: ${total}`);
console.log(`unique suppliers: ${suppliers.size}`);
console.log("status:", sortByCount(statuses));
console.log("location:", sortByCount(locations));
console.log("auction dates:", Object.fromEntries([...auctionDates].sort()));

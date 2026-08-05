/**
 * Applies prisma/schema.prisma to the database over Neon's WebSocket driver.
 *
 * Why this exists instead of `prisma db push`:
 * outbound TCP 5432 is blocked on this network, so Prisma's schema engine cannot
 * reach Neon at all. The serverless driver talks WebSocket over 443, which does get
 * through. Routing the schema engine through the driver adapter does not help either:
 * introspection reads pg_catalog, and @prisma/adapter-neon has no mapping for Postgres
 * OID 19 (`name`), so it fails while deserialising.
 *
 * The way around both: generate the DDL with `prisma migrate diff`, which needs no
 * database connection, then apply that DDL over the WebSocket driver.
 *
 * To diff incrementally we need to know what is already applied. prisma/applied.prisma
 * is that record: a copy of the schema as last pushed. Do not edit it by hand.
 *
 * BEWARE: applied.prisma records one state for both databases. Push to test and it will
 * report "already up to date" for production, while production has not seen the change at
 * all. Push to both in the same sitting, or check the target yourself - to_regclass on the
 * new table is enough.
 *
 * Usage:
 *   node scripts/db-push.mjs             apply pending changes to the test database
 *   node scripts/db-push.mjs --env .env.lokaal-productie   ... to another environment
 *   node scripts/db-push.mjs --dry-run   print the DDL without applying it
 *   node scripts/db-push.mjs --from-empty  rebuild from nothing (destructive on drift)
 *
 * THERE ARE TWO DATABASES. A schema change is only done once it has been applied to both.
 * Deploying a change to production without pushing it there gives a 500 on every page that
 * touches the new table - which is exactly what happened when AppSetting was added, on
 * 5 August 2026. The target host is printed before anything is applied.
 *
 * --env is read here by hand rather than through DOTENV_CONFIG_PATH: the installed dotenv
 * ignores that variable, which would silently point this at the wrong database.
 */

import { config as loadEnv } from "dotenv";

const envIndex = process.argv.indexOf("--env");
loadEnv(envIndex === -1 ? undefined : { path: process.argv[envIndex + 1] });
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Relative paths on purpose: the project directory contains a space, and the CLI
// mangles quoted absolute paths when run through a shell on Windows.
const SCHEMA = "prisma/schema.prisma";
const APPLIED = "prisma/applied.prisma";
const APPLIED_PATH = join(root, APPLIED);
const SCHEMA_PATH = join(root, SCHEMA);

const dryRun = process.argv.includes("--dry-run");
const fromEmpty = process.argv.includes("--from-empty") || !existsSync(APPLIED_PATH);

function generateDdl() {
  const from = fromEmpty
    ? ["--from-empty"]
    : ["--from-schema-datamodel", APPLIED];

  // shell:true is needed because npx is a .cmd on Windows and recent Node refuses to
  // launch that through execFile directly. Every argument here is a literal defined in
  // this file, so there is nothing user-supplied to escape.
  return execFileSync(
    "npx",
    ["prisma", "migrate", "diff", ...from, "--to-schema-datamodel", SCHEMA, "--script"],
    { cwd: root, encoding: "utf8", shell: true },
  );
}

async function main() {
  if (fromEmpty && existsSync(APPLIED_PATH)) {
    console.log("Rebuilding from empty - existing tables will conflict unless dropped.");
  }

  const ddl = generateDdl().trim();

  // Prisma emits this comment when there is nothing to do.
  if (!ddl || ddl.startsWith("-- This is an empty migration")) {
    console.log("Schema is already up to date.");
    return;
  }

  if (dryRun) {
    console.log(ddl);
    return;
  }

  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set. See .env.example.");

  // De host erbij, want dit is het script waar de verkeerde database het meeste kost.
  console.log(`Target: ${new URL(connectionString).hostname}`);

  const pool = new Pool({ connectionString });
  try {
    console.log(`Applying ${ddl.split(";").filter((s) => s.trim()).length} statements...`);
    await pool.query(ddl);
    copyFileSync(SCHEMA_PATH, APPLIED_PATH);
    console.log("Database is now in sync with prisma/schema.prisma.");
    console.log("Run `npx prisma generate` to refresh the client.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});

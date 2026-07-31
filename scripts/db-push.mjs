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
 * Usage:
 *   node scripts/db-push.mjs             apply pending changes
 *   node scripts/db-push.mjs --dry-run   print the DDL without applying it
 *   node scripts/db-push.mjs --from-empty  rebuild from nothing (destructive on drift)
 */

import "dotenv/config";
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

# Floriday ingest en database — implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Het klokvoorverkoop-aanbod uit Floriday elk uur binnenhalen en met volledige
versiehistorie vastleggen in een Neon-database, met een eenmalige inhaalslag vanaf
sequencenummer nul.

**Architecture:** Eén sync-module met drie lagen (client, resource, schrijflaag) en twee
aanroepers: een lokaal backfill-script zonder timeout en een uurlijkse cron-route in de
Next.js-app. Alle beslislogica zit in pure functies zonder netwerk of database, zodat het
grootste deel met gewone unittests af te dekken is.

**Tech Stack:** Next.js (App Router) · TypeScript strict · Prisma 6 met
`@prisma/adapter-neon` · Neon Postgres · Zod · Vitest · tsx

**Spec:** `docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`

---

## Bestandsstructuur

Wat er ontstaat en waar elk bestand verantwoordelijk voor is. Files die samen veranderen
staan bij elkaar, gesplitst op verantwoordelijkheid en niet op technische laag.

```
prisma/
  schema.prisma                          datamodel, zes tabellen en vier enums

src/lib/
  env.ts                                 omgevingsvariabelen, gevalideerd met Zod
  db.ts                                  Prisma-client singleton met Neon-adapter

src/features/floriday/client/
  rate-limiter.ts                        drie verzoeken per seconde, puur
  token-cache.ts                         token vasthouden tot 3540 seconden
  http.ts                                fetch met beide headers, retry en backoff

src/features/floriday/schemas/
  supply-line.ts                         Zod-schema van ClockPresalesSupplyLine
  trade-item.ts                          Zod-schema van TradeItem
  organization.ts                        Zod-schema van Organization

src/features/floriday/mappers/
  supply-line.ts                         API-payload naar databasekolommen
  trade-item.ts
  organization.ts

src/features/floriday/sync/
  changed-lines.ts                       welke regels wijken af — pure functie
  write-supply-page.ts                   transactie: versies, upsert, cursor
  cursor.ts                              SyncState lezen en schrijven
  run-log.ts                             SyncRun openen en afsluiten
  supply-lines.ts                        pagineerlus over het klokaanbod
  trade-items.ts                         ontbrekende artikelen ophalen per honderd
  organizations.ts                       pagineerlus over organisaties

src/app/api/cron/sync/route.ts           uurlijkse aanroep, beveiligd met CRON_SECRET

scripts/
  backfill.ts                            inhaalslag, hervatbaar
  capture-fixtures.ts                    echte API-antwoorden opslaan als testinvoer

tests/
  fixtures/                              opgeslagen API-antwoorden
  unit/                                  pure functies, geen netwerk
  integration/                           tegen een aparte Neon-branch
```

---

## Taak 1: Git en projectskelet

**Files:**
- Create: `.gitattributes`
- Modify: `.gitignore`

- [ ] **Stap 1: Git initialiseren en identiteit zetten**

De projectafspraak is dat Vercel alleen dit account herkent; de Windows-hostnaam-email
wordt geweigerd.

```bash
cd "C:/HPProjects/floriday api"
git init
git config user.email "henkpieterdenboer@gmail.com"
git config user.name "Henk Pieter den Boer"
git checkout -b develop
```

- [ ] **Stap 2: `.gitignore` aanvullen**

Vervang de inhoud van `.gitignore` door:

```
.env
.env.*
!.env.example
node_modules/
input/
.next/
dist/
*.log
coverage/
prisma/generated/
tests/fixtures/*.json
!tests/fixtures/.gitkeep
```

De fixtures blijven buiten git omdat het echte Floriday-data is; ze worden opnieuw
opgehaald met `npm run capture-fixtures`.

- [ ] **Stap 3: `.gitattributes` aanmaken**

```
* text=auto eol=lf
```

- [ ] **Stap 4: Eerste commit**

```bash
git add .gitignore .gitattributes docs scripts .env.example
git commit -m "chore: initialise repository with docs and exploration scripts"
```

Verwacht: commit slaagt, `.env` staat er niet bij. Controleer met `git show --stat HEAD`.

---

## Taak 2: Next.js, TypeScript en Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `tests/fixtures/.gitkeep`

- [ ] **Stap 1: Project initialiseren**

```bash
npm init -y
npm install next react react-dom
npm install -D typescript @types/node @types/react @types/react-dom vitest tsx dotenv
```

- [ ] **Stap 2: `package.json` scripts vervangen**

```json
{
  "name": "floriday-middleware",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --webpack",
    "build": "prisma generate && next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "backfill": "tsx scripts/backfill.ts",
    "capture-fixtures": "tsx scripts/capture-fixtures.ts",
    "db:push": "prisma db push"
  }
}
```

`next dev --webpack` staat er omdat Turbopack op Windows crasht met `0xc0000142`.

- [ ] **Stap 3: `tsconfig.json` aanmaken**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Stap 4: `next.config.ts` aanmaken**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
```

- [ ] **Stap 5: `vitest.config.ts` aanmaken**

```typescript
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Stap 6: Minimale app-bestanden aanmaken**

`src/app/layout.tsx`:

```tsx
export const metadata = { title: "Floriday middleware" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function Home() {
  return <main>Floriday middleware</main>;
}
```

`tests/fixtures/.gitkeep`: leeg bestand.

- [ ] **Stap 7: Controleren dat het bouwt**

Run: `npx tsc --noEmit`
Verwacht: geen uitvoer, exitcode 0.

Run: `npm test`
Verwacht: `No test files found` — dat is goed, Vitest draait.

- [ ] **Stap 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts src tests
git commit -m "chore: scaffold next.js app with typescript and vitest"
```

---

## Taak 3: Omgevingsvariabelen valideren

**Files:**
- Create: `src/lib/env.ts`
- Test: `tests/unit/env.test.ts`
- Modify: `.env.example`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/env.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  DIRECT_URL: "postgresql://user:pass@host/db?sslmode=require",
  FLORIDAY_TOKEN_URL: "https://idm.staging.floriday.io/oauth2/x/v1/token",
  FLORIDAY_CUSTOMERS_API_BASE_URL: "https://api.staging.floriday.io/customers-api-2026v1",
  FLORIDAY_CUSTOMERS_CLIENT_ID: "abc",
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: "secret",
  FLORIDAY_CUSTOMERS_API_KEY: "key",
  CRON_SECRET: "cron",
};

describe("envSchema", () => {
  it("accepts a complete configuration", () => {
    const result = envSchema.parse(valid);
    expect(result.FLORIDAY_CUSTOMERS_API_KEY).toBe("key");
  });

  it("rejects a missing api key", () => {
    const { FLORIDAY_CUSTOMERS_API_KEY, ...incomplete } = valid;
    expect(() => envSchema.parse(incomplete)).toThrow();
  });

  it("rejects an api base url that is not a url", () => {
    expect(() => envSchema.parse({ ...valid, FLORIDAY_CUSTOMERS_API_BASE_URL: "nope" }))
      .toThrow();
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

```bash
npm install zod
npm test -- tests/unit/env.test.ts
```

Verwacht: FAIL, `Failed to resolve import "@/lib/env"`.

- [ ] **Stap 3: Schrijf de implementatie**

`src/lib/env.ts`:

```typescript
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  FLORIDAY_TOKEN_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_API_BASE_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_CLIENT_ID: z.string().min(1),
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: z.string().min(1),
  FLORIDAY_CUSTOMERS_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Reads and validates the environment once. Throws with a readable message if invalid. */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${missing}. See .env.example.`);
  }

  cached = parsed.data;
  return cached;
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/env.test.ts`
Verwacht: PASS, 3 tests.

- [ ] **Stap 5: `.env.example` aanvullen**

Voeg onderaan toe:

```
# Neon
DATABASE_URL=
DIRECT_URL=

# Beveiligt de cron-route. Vercel stuurt deze mee als Authorization: Bearer <waarde>.
CRON_SECRET=
```

- [ ] **Stap 6: Commit**

```bash
git add src/lib/env.ts tests/unit/env.test.ts .env.example package.json package-lock.json
git commit -m "feat: validate environment configuration with zod"
```

---

## Taak 4: Prisma-schema en Neon-verbinding

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Modify: `.env`

- [ ] **Stap 1: Neon-project aanmaken**

Maak in de Neon-console een nieuw project aan met de naam `floriday-middleware-test`.
Neem twee verbindingsstrings over naar `.env`:

```
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
DIRECT_URL=postgresql://.../neondb?sslmode=require
CRON_SECRET=<willekeurige lange string>
```

`DATABASE_URL` bevat `-pooler`, `DIRECT_URL` niet. Productie krijgt later een eigen
Neon-project, geen branch van dit project.

- [ ] **Stap 2: Prisma installeren**

```bash
npm install @prisma/client @prisma/adapter-neon @neondatabase/serverless
npm install -D prisma
```

- [ ] **Stap 3: `prisma/schema.prisma` aanmaken**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum SupplyStatus {
  AVAILABLE
  UNAVAILABLE
}

enum AuctionLocation {
  AALSMEER
  NAALDWIJK
  RIJNSBURG
  EELDE
  PLANTION
  RHEINMAAS
  DIGITAL
}

enum SyncTrigger {
  BACKFILL
  CRON
  MANUAL
}

enum SyncStatus {
  RUNNING
  SUCCEEDED
  FAILED
}

model SupplyLine {
  supplyLineId           String          @id @db.Uuid
  status                 SupplyStatus
  tradeItemId            String          @db.Uuid
  tradeItemVersion       Int?
  pricePerPiece          Decimal         @db.Decimal(12, 4)
  currency               String          @db.VarChar(3)
  numberOfPieces         Int
  deliveryNoteReference  String?
  deliveryNoteCode       String?
  deliveryNoteLetter     String?
  piecesPerPackage       Int?
  vbnPackageCode         Int?
  customPackageId        String?         @db.Uuid
  packagesPerLayer       Int?
  layersPerLoadCarrier   Int?
  loadCarrier            String?
  tradePeriodStart       DateTime        @db.Timestamptz
  tradePeriodEnd         DateTime        @db.Timestamptz
  supplierOrganizationId String          @db.Uuid
  sequenceNumber         BigInt
  creationDateTime       DateTime        @db.Timestamptz
  lastModifiedDateTime   DateTime?       @db.Timestamptz
  auctionDate            DateTime        @db.Date
  initialAuctionLocation AuctionLocation
  photoUrl               String?

  firstSeenAt            DateTime        @db.Timestamptz
  lastSeenAt             DateTime        @db.Timestamptz

  versions               SupplyLineVersion[]

  @@index([auctionDate, initialAuctionLocation])
  @@index([supplierOrganizationId])
  @@index([tradeItemId])
  @@index([status])
  @@index([sequenceNumber])
}

model SupplyLineVersion {
  id                     BigInt          @id @default(autoincrement())
  supplyLineId           String          @db.Uuid
  sequenceNumber         BigInt
  observedAt             DateTime        @db.Timestamptz

  status                 SupplyStatus
  tradeItemId            String          @db.Uuid
  tradeItemVersion       Int?
  pricePerPiece          Decimal         @db.Decimal(12, 4)
  currency               String          @db.VarChar(3)
  numberOfPieces         Int
  deliveryNoteReference  String?
  deliveryNoteCode       String?
  deliveryNoteLetter     String?
  piecesPerPackage       Int?
  vbnPackageCode         Int?
  customPackageId        String?         @db.Uuid
  packagesPerLayer       Int?
  layersPerLoadCarrier   Int?
  loadCarrier            String?
  tradePeriodStart       DateTime        @db.Timestamptz
  tradePeriodEnd         DateTime        @db.Timestamptz
  supplierOrganizationId String          @db.Uuid
  creationDateTime       DateTime        @db.Timestamptz
  lastModifiedDateTime   DateTime?       @db.Timestamptz
  auctionDate            DateTime        @db.Date
  initialAuctionLocation AuctionLocation
  photoUrl               String?

  supplyLine             SupplyLine      @relation(fields: [supplyLineId], references: [supplyLineId])

  @@unique([supplyLineId, sequenceNumber])
  @@index([supplyLineId, observedAt])
}

model TradeItem {
  tradeItemId             String   @id @db.Uuid
  supplierOrganizationId  String   @db.Uuid
  name                    String
  vbnProductCode          Int?
  code                    String?
  gtin                    String?
  botanicalNames          String[]
  countryOfOriginIsoCodes String[]
  tradeItemVersion        Int?
  isDeleted               Boolean  @default(false)
  sequenceNumber          BigInt

  characteristics         Json?
  photos                  Json?
  packingConfigurations   Json?

  fetchedAt               DateTime @db.Timestamptz

  @@index([name])
  @@index([vbnProductCode])
  @@index([supplierOrganizationId])
}

model Organization {
  organizationId   String    @id @db.Uuid
  name             String?
  commercialName   String?
  companyGln       String?
  rfhRelationId    String?
  organizationType String?
  city             String?
  countryCode      String?   @db.VarChar(2)
  endDate          DateTime? @db.Timestamptz
  sequenceNumber   BigInt

  @@index([name])
  @@index([companyGln])
}

model SyncState {
  resource           String   @id
  lastSequenceNumber BigInt   @default(0)
  updatedAt          DateTime @updatedAt @db.Timestamptz
}

model SyncRun {
  id             BigInt      @id @default(autoincrement())
  resource       String
  trigger        SyncTrigger
  startedAt      DateTime    @db.Timestamptz
  finishedAt     DateTime?   @db.Timestamptz
  pagesProcessed Int         @default(0)
  rowsProcessed  Int         @default(0)
  rowsInserted   Int         @default(0)
  versionsAdded  Int         @default(0)
  status         SyncStatus
  errorMessage   String?

  @@index([resource, startedAt])
}
```

- [ ] **Stap 4: Schema naar de database duwen**

Projectafspraak: `db push`, niet `migrate dev`.

```bash
npx prisma db push
npx prisma generate
```

Verwacht: `Your database is now in sync with your Prisma schema.`

Loopt `prisma generate` vast met een EPERM-melding op Windows, stop dan eerst de dev-server.

- [ ] **Stap 5: `src/lib/db.ts` aanmaken**

```typescript
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: getEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Stap 6: Verbinding controleren**

```bash
npx tsx -e "import 'dotenv/config'; import { prisma } from './src/lib/db'; console.log(await prisma.syncState.count());"
```

Verwacht: `0`.

- [ ] **Stap 7: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts package.json package-lock.json
git commit -m "feat: add prisma schema and neon client"
```

---

## Taak 5: Rate limiter

Drie verzoeken per seconde, met marge onder de limiet van 3,4.

**Files:**
- Create: `src/features/floriday/client/rate-limiter.ts`
- Test: `tests/unit/rate-limiter.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/rate-limiter.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/features/floriday/client/rate-limiter";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

/** Reports whether a promise has settled, without hanging if it has not. */
async function hasSettled(promise: Promise<void>): Promise<boolean> {
  let settled = false;
  void promise.then(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(0);
  return settled;
}

describe("createRateLimiter", () => {
  it("lets the first request through without waiting", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    expect(await hasSettled(limiter.acquire())).toBe(true);
  });

  it("spaces the next request by a third of a second", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    let settled = false;
    void limiter.acquire().then(() => { settled = true; });

    await vi.advanceTimersByTimeAsync(300);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(50);
    expect(settled).toBe(true);
  });

  it("makes the delay cumulative across queued requests", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    void limiter.acquire();
    let thirdSettled = false;
    void limiter.acquire().then(() => { thirdSettled = true; });

    await vi.advanceTimersByTimeAsync(600);
    expect(thirdSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    expect(thirdSettled).toBe(true);
  });

  it("does not wait when enough time has already passed", async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 3 });
    await limiter.acquire();

    await vi.advanceTimersByTimeAsync(1000);

    expect(await hasSettled(limiter.acquire())).toBe(true);
  });
});
```

Let op: dit limiteert door **gelijkmatig te spreiden**, niet door een burst toe te staan. Elk
verzoek na het eerste wacht tot zijn eigen tijdslot, en die slots liggen 333 milliseconden
uit elkaar. Dat is bewust: bij een burst van drie direct achter elkaar zit je in dezelfde
seconde al op de rand van de limiet, en een backfill doet meer dan duizend verzoeken achter
elkaar. Gelijkmatig spreiden houdt het tempo voorspelbaar.

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/rate-limiter.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/client/rate-limiter.ts`:

```typescript
export interface RateLimiter {
  /** Resolves as soon as another request may be sent. */
  acquire(): Promise<void>;
}

export interface RateLimiterOptions {
  requestsPerSecond: number;
}

/**
 * Spaces requests evenly instead of allowing bursts. Floriday allows 3.4 requests per
 * second; we run at 3 to keep a margin for clock drift between our host and theirs.
 */
export function createRateLimiter({ requestsPerSecond }: RateLimiterOptions): RateLimiter {
  const intervalMs = 1000 / requestsPerSecond;
  let nextSlot = 0;

  return {
    async acquire(): Promise<void> {
      const now = Date.now();
      const slot = Math.max(now, nextSlot);
      nextSlot = slot + intervalMs;

      const waitMs = slot - now;
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    },
  };
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/rate-limiter.test.ts`
Verwacht: PASS, 2 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/client/rate-limiter.ts tests/unit/rate-limiter.test.ts
git commit -m "feat: add rate limiter for floriday api"
```

---

## Taak 6: Token-cache

**Files:**
- Create: `src/features/floriday/client/token-cache.ts`
- Test: `tests/unit/token-cache.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/token-cache.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { createTokenCache } from "@/features/floriday/client/token-cache";

describe("createTokenCache", () => {
  it("fetches once and reuses the token", async () => {
    const fetchToken = vi.fn().mockResolvedValue("token-1");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    expect(await cache.getToken()).toBe("token-1");
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it("fetches again once the token has expired", async () => {
    vi.useFakeTimers();
    const fetchToken = vi.fn()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    vi.advanceTimersByTime(3541 * 1000);
    expect(await cache.getToken()).toBe("token-2");

    vi.useRealTimers();
  });

  it("discards the cached token on invalidate", async () => {
    const fetchToken = vi.fn()
      .mockResolvedValueOnce("token-1")
      .mockResolvedValueOnce("token-2");
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    expect(await cache.getToken()).toBe("token-1");
    cache.invalidate();
    expect(await cache.getToken()).toBe("token-2");
  });

  it("does not fetch twice when two callers ask at the same time", async () => {
    let resolveFetch: (value: string) => void = () => {};
    const fetchToken = vi.fn(() => new Promise<string>((resolve) => {
      resolveFetch = resolve;
    }));
    const cache = createTokenCache({ fetchToken, ttlSeconds: 3540 });

    const first = cache.getToken();
    const second = cache.getToken();
    resolveFetch("token-1");

    expect(await first).toBe("token-1");
    expect(await second).toBe("token-1");
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/token-cache.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/client/token-cache.ts`:

```typescript
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
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/token-cache.test.ts`
Verwacht: PASS, 4 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/client/token-cache.ts tests/unit/token-cache.test.ts
git commit -m "feat: add token cache with single-flight fetching"
```

---

## Taak 7: HTTP-client

**Files:**
- Create: `src/features/floriday/client/http.ts`
- Test: `tests/unit/http.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/http.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { createFloridayClient } from "@/features/floriday/client/http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const baseOptions = {
  baseUrl: "https://api.example.test/customers-api",
  apiKey: "test-key",
  tokenCache: { getToken: async () => "test-token", invalidate: () => {} },
  rateLimiter: { acquire: async () => {} },
  sleep: async () => {},
};

describe("createFloridayClient", () => {
  it("sends both required headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await client.getJson("/thing");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/customers-api/thing");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("test-key");
  });

  it("retries on 429 and then succeeds", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("refreshes the token once on 401", async () => {
    const invalidate = vi.fn();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("nope", { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({
      ...baseOptions,
      tokenCache: { getToken: async () => "test-token", invalidate },
      fetchImpl,
    });

    await expect(client.getJson("/thing")).resolves.toEqual({ ok: true });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("gives up after the maximum number of attempts", async () => {
    // A fresh Response per call, because a body can only be read once and real fetch
    // never hands back the same object twice.
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl, maxAttempts: 3 });

    await expect(client.getJson("/thing")).rejects.toThrow(/500/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 403, because that signals a permission problem", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ title: "There are no connected suppliers." }, 403),
    );
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).rejects.toThrow(/no connected suppliers/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("asks the rate limiter before every attempt", async () => {
    const acquire = vi.fn(async () => {});
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createFloridayClient({ ...baseOptions, rateLimiter: { acquire }, fetchImpl });

    await client.getJson("/thing");
    expect(acquire).toHaveBeenCalledTimes(2);
  });

  it("stops retrying a 401 after the token refresh also fails", async () => {
    const invalidate = vi.fn();
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 401 }));
    const client = createFloridayClient({
      ...baseOptions,
      tokenCache: { getToken: async () => "test-token", invalidate },
      fetchImpl,
    });

    await expect(client.getJson("/thing")).rejects.toThrow(/401/);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports a diagnosable error when a 200 carries invalid json", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>oops</html>", { status: 200 }));
    const client = createFloridayClient({ ...baseOptions, fetchImpl });

    await expect(client.getJson("/thing")).rejects.toThrow(/invalid json.*\/thing/i);
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/http.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/client/http.ts`:

```typescript
import type { RateLimiter } from "@/features/floriday/client/rate-limiter";
import type { TokenCache } from "@/features/floriday/client/token-cache";

export interface FloridayClient {
  getJson<T>(path: string): Promise<T>;
}

export interface FloridayClientOptions {
  baseUrl: string;
  apiKey: string;
  tokenCache: TokenCache;
  rateLimiter: RateLimiter;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createFloridayClient(options: FloridayClientOptions): FloridayClient {
  const {
    baseUrl,
    apiKey,
    tokenCache,
    rateLimiter,
    fetchImpl = fetch,
    maxAttempts = 5,
    sleep = defaultSleep,
  } = options;

  /** Reads the body once, for an error we are about to throw. */
  async function describe(response: Response): Promise<string> {
    const body = await response.text();
    return `${response.status} ${body.slice(0, 300)}`;
  }

  async function getJson<T>(path: string): Promise<T> {
    let refreshedToken = false;
    let lastFailure: Response | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await rateLimiter.acquire();

      const token = await tokenCache.getToken();
      const response = await fetchImpl(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        // Not response.json(): a proxy or error page returning HTML with a 200 would
        // otherwise surface as a bare SyntaxError with no clue which call produced it.
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(
            `Floriday returned invalid json: GET ${path} -> ${text.slice(0, 300)}`,
          );
        }
      }

      // A stale token is worth exactly one retry; beyond that it is a real problem.
      if (response.status === 401 && !refreshedToken) {
        tokenCache.invalidate();
        refreshedToken = true;
        continue;
      }

      // 403 means the organisation lacks permission. Retrying cannot fix that, and
      // silently looping would hide a change on the Floriday side.
      if (!RETRYABLE_STATUSES.has(response.status)) {
        throw new Error(`Floriday request failed: GET ${path} -> ${await describe(response)}`);
      }

      // Keep the response, do not read it yet: attempts that end up succeeding should
      // not pay for reading a body nobody will look at.
      lastFailure = response;

      if (attempt < maxAttempts) {
        await sleep(Math.min(2 ** (attempt - 1) * 500, 8000));
      }
    }

    const detail = lastFailure ? await describe(lastFailure) : "no response";
    throw new Error(
      `Floriday request failed after ${maxAttempts} attempts: GET ${path} -> ${detail}`,
    );
  }

  return { getJson };
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/http.test.ts`
Verwacht: PASS, 5 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/client/http.ts tests/unit/http.test.ts
git commit -m "feat: add floriday http client with retry and token refresh"
```

---

## Taak 8: Zod-schemas en fixtures

**Files:**
- Create: `src/features/floriday/schemas/supply-line.ts`
- Create: `src/features/floriday/schemas/trade-item.ts`
- Create: `src/features/floriday/schemas/organization.ts`
- Create: `scripts/capture-fixtures.ts`
- Test: `tests/unit/schemas.test.ts`

- [ ] **Stap 1: Schrijf het fixture-script**

`scripts/capture-fixtures.ts`:

```typescript
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

  const supplyPage = await client.getJson<{ results: { tradeItemId: string; supplierOrganizationId: string }[] }>(
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
```

- [ ] **Stap 2: Het ontbrekende token-verzoek toevoegen**

`src/features/floriday/client/token-request.ts`:

```typescript
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
```

- [ ] **Stap 3: Fixtures ophalen**

Run: `npm run capture-fixtures`
Verwacht: `Wrote fixtures to tests/fixtures` en drie bestanden in die map.

Krijg je `Cannot find module '@/lib/env'`, dan leest tsx de `paths` uit `tsconfig.json`
niet. Installeer dan `tsconfig-paths` en pas beide scripts in `package.json` aan:

```bash
npm install -D tsconfig-paths
```

```json
"backfill": "tsx -r tsconfig-paths/register scripts/backfill.ts",
"capture-fixtures": "tsx -r tsconfig-paths/register scripts/capture-fixtures.ts"
```

- [ ] **Stap 4: Schrijf de falende test**

`tests/unit/schemas.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { tradeItemSchema } from "@/features/floriday/schemas/trade-item";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";

const readFixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/${name}.json`, "utf8")) as unknown;

describe("floriday response schemas", () => {
  it("parses a real supply page", () => {
    const page = supplyPageSchema.parse(readFixture("supply-page"));
    expect(page.results.length).toBeGreaterThan(0);
    expect(page.maximumSequenceNumber).toBeGreaterThan(0);
  });

  it("parses real trade items", () => {
    const items = tradeItemSchema.array().parse(readFixture("trade-items"));
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toBeTypeOf("string");
  });

  it("parses a real organization page", () => {
    const page = organizationPageSchema.parse(readFixture("organizations"));
    expect(page.results.length).toBeGreaterThan(0);
  });

  it("rejects an unknown auction location", () => {
    const page = readFixture("supply-page") as { results: Record<string, unknown>[] };
    const broken = {
      ...page,
      results: [{ ...page.results[0], initialAuctionLocation: "MARS" }],
    };
    expect(() => supplyPageSchema.parse(broken)).toThrow();
  });
});
```

- [ ] **Stap 5: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/schemas.test.ts`
Verwacht: FAIL, modules niet gevonden.

- [ ] **Stap 6: Schrijf de schemas**

`src/features/floriday/schemas/supply-line.ts`:

```typescript
import { z } from "zod";

export const supplyStatusSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const auctionLocationSchema = z.enum([
  "AALSMEER",
  "NAALDWIJK",
  "RIJNSBURG",
  "EELDE",
  "PLANTION",
  "RHEINMAAS",
  "DIGITAL",
]);

export const supplyLineSchema = z.object({
  supplyLineId: z.string().uuid(),
  status: supplyStatusSchema,
  tradeItemId: z.string().uuid(),
  tradeItemVersion: z.number().int().nullable(),
  pricePerPiece: z.object({
    currency: z.string(),
    value: z.number(),
  }),
  deliveryNoteReference: z.string().nullable(),
  deliveryNoteCode: z.string().nullable(),
  deliveryNoteLetter: z.string().nullable(),
  numberOfPieces: z.number().int(),
  packingConfiguration: z.object({
    piecesPerPackage: z.number().int().nullable(),
    package: z.object({
      vbnPackageCode: z.number().int().nullable(),
      customPackageId: z.string().uuid().nullable(),
    }),
    packagesPerLayer: z.number().int().nullable(),
    layersPerLoadCarrier: z.number().int().nullable(),
    loadCarrier: z.string().nullable(),
  }),
  tradePeriod: z.object({
    startDateTime: z.string(),
    endDateTime: z.string(),
  }),
  supplierOrganizationId: z.string().uuid(),
  sequenceNumber: z.number().int(),
  creationDateTime: z.string(),
  lastModifiedDateTime: z.string().nullable(),
  auctionDate: z.string(),
  initialAuctionLocation: auctionLocationSchema,
  photoUrl: z.string().nullable(),
});

export const supplyPageSchema = z.object({
  maximumSequenceNumber: z.number().int(),
  results: supplyLineSchema.array(),
});

export type SupplyLinePayload = z.infer<typeof supplyLineSchema>;
export type SupplyPage = z.infer<typeof supplyPageSchema>;
```

`src/features/floriday/schemas/trade-item.ts`:

```typescript
import { z } from "zod";

export const tradeItemSchema = z.object({
  tradeItemId: z.string().uuid(),
  supplierOrganizationId: z.string().uuid(),
  name: z.string(),
  vbnProductCode: z.number().int().nullable(),
  code: z.string().nullable(),
  gtin: z.string().nullable(),
  botanicalNames: z.string().array().nullable(),
  countryOfOriginIsoCodes: z.string().array().nullable(),
  tradeItemVersion: z.number().int().nullable(),
  isDeleted: z.boolean(),
  sequenceNumber: z.number().int(),
  characteristics: z.unknown().nullable(),
  photos: z.unknown().nullable(),
  packingConfigurations: z.unknown().nullable(),
});

export type TradeItemPayload = z.infer<typeof tradeItemSchema>;
```

`src/features/floriday/schemas/organization.ts`:

```typescript
import { z } from "zod";

const addressSchema = z.object({
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  countryCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  stateOrProvince: z.string().nullable(),
}).nullable();

export const organizationSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().nullable(),
  commercialName: z.string().nullable(),
  companyGln: z.string().nullable(),
  rfhRelationId: z.string().nullable(),
  organizationType: z.string().nullable(),
  endDate: z.string().nullable(),
  sequenceNumber: z.number().int(),
  physicalAddress: addressSchema,
  mailingAddress: addressSchema,
});

export const organizationPageSchema = z.object({
  maximumSequenceNumber: z.number().int(),
  results: organizationSchema.array(),
});

export type OrganizationPayload = z.infer<typeof organizationSchema>;
```

- [ ] **Stap 7: Draai de test opnieuw**

Run: `npm test -- tests/unit/schemas.test.ts`
Verwacht: PASS, 4 tests.

Faalt een schema op een veld dat in werkelijkheid ontbreekt of anders heet, pas dan het
schema aan naar wat de fixture laat zien — niet andersom. De fixture is de waarheid.

- [ ] **Stap 8: Commit**

```bash
git add src/features/floriday/schemas scripts/capture-fixtures.ts src/features/floriday/client/token-request.ts tests/unit/schemas.test.ts package.json
git commit -m "feat: add zod schemas validated against real api responses"
```

---

## Taak 9: Mapper voor aanbodregels

**Files:**
- Create: `src/features/floriday/mappers/supply-line.ts`
- Test: `tests/unit/mappers/supply-line.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/mappers/supply-line.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow } from "@/features/floriday/mappers/supply-line";

const page = supplyPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/supply-page.json", "utf8")),
);

describe("toSupplyLineRow", () => {
  it("flattens the nested price into value and currency", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(row.currency).toBe(page.results[0].pricePerPiece.currency);
    expect(row.pricePerPiece).toBe(page.results[0].pricePerPiece.value.toFixed(4));
  });

  it("flattens the packing configuration", () => {
    const source = page.results[0];
    const row = toSupplyLineRow(source);
    expect(row.piecesPerPackage).toBe(source.packingConfiguration.piecesPerPackage);
    expect(row.vbnPackageCode).toBe(source.packingConfiguration.package.vbnPackageCode);
    expect(row.loadCarrier).toBe(source.packingConfiguration.loadCarrier);
  });

  it("turns the auction date into a date at midnight utc", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(row.auctionDate.toISOString()).toBe(`${page.results[0].auctionDate}T00:00:00.000Z`);
  });

  it("keeps a null last modified date as null", () => {
    const row = toSupplyLineRow({ ...page.results[0], lastModifiedDateTime: null });
    expect(row.lastModifiedDateTime).toBeNull();
  });

  it("converts the sequence number to bigint", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(typeof row.sequenceNumber).toBe("bigint");
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/mappers/supply-line.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/mappers/supply-line.ts`:

```typescript
import type { SupplyLinePayload } from "@/features/floriday/schemas/supply-line";

/**
 * The shape written to SupplyLine and SupplyLineVersion, minus the columns that are
 * bookkeeping rather than content (firstSeenAt, lastSeenAt, observedAt).
 */
export interface SupplyLineRow {
  supplyLineId: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  tradeItemId: string;
  tradeItemVersion: number | null;
  /** Kept as a fixed-point string so no precision is lost before Prisma's Decimal. */
  pricePerPiece: string;
  currency: string;
  numberOfPieces: number;
  deliveryNoteReference: string | null;
  deliveryNoteCode: string | null;
  deliveryNoteLetter: string | null;
  piecesPerPackage: number | null;
  vbnPackageCode: number | null;
  customPackageId: string | null;
  packagesPerLayer: number | null;
  layersPerLoadCarrier: number | null;
  loadCarrier: string | null;
  tradePeriodStart: Date;
  tradePeriodEnd: Date;
  supplierOrganizationId: string;
  sequenceNumber: bigint;
  creationDateTime: Date;
  lastModifiedDateTime: Date | null;
  auctionDate: Date;
  initialAuctionLocation:
    | "AALSMEER" | "NAALDWIJK" | "RIJNSBURG" | "EELDE"
    | "PLANTION" | "RHEINMAAS" | "DIGITAL";
  photoUrl: string | null;
}

export function toSupplyLineRow(payload: SupplyLinePayload): SupplyLineRow {
  const packing = payload.packingConfiguration;

  return {
    supplyLineId: payload.supplyLineId,
    status: payload.status,
    tradeItemId: payload.tradeItemId,
    tradeItemVersion: payload.tradeItemVersion,
    pricePerPiece: payload.pricePerPiece.value.toFixed(4),
    currency: payload.pricePerPiece.currency,
    numberOfPieces: payload.numberOfPieces,
    deliveryNoteReference: payload.deliveryNoteReference,
    deliveryNoteCode: payload.deliveryNoteCode,
    deliveryNoteLetter: payload.deliveryNoteLetter,
    piecesPerPackage: packing.piecesPerPackage,
    vbnPackageCode: packing.package.vbnPackageCode,
    customPackageId: packing.package.customPackageId,
    packagesPerLayer: packing.packagesPerLayer,
    layersPerLoadCarrier: packing.layersPerLoadCarrier,
    loadCarrier: packing.loadCarrier,
    tradePeriodStart: new Date(payload.tradePeriod.startDateTime),
    tradePeriodEnd: new Date(payload.tradePeriod.endDateTime),
    supplierOrganizationId: payload.supplierOrganizationId,
    sequenceNumber: BigInt(payload.sequenceNumber),
    creationDateTime: new Date(payload.creationDateTime),
    lastModifiedDateTime: payload.lastModifiedDateTime
      ? new Date(payload.lastModifiedDateTime)
      : null,
    auctionDate: new Date(`${payload.auctionDate}T00:00:00.000Z`),
    initialAuctionLocation: payload.initialAuctionLocation,
    photoUrl: payload.photoUrl,
  };
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/mappers/supply-line.test.ts`
Verwacht: PASS, 5 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/mappers/supply-line.ts tests/unit/mappers/supply-line.test.ts
git commit -m "feat: map supply line payloads to database rows"
```

---

## Taak 10: Bepalen welke regels echt gewijzigd zijn

Dit is de functie die voorkomt dat het archief volloopt met betekenisloze versies wanneer
Floriday een bulkoperatie doet. Puur, dus volledig testbaar.

**Files:**
- Create: `src/features/floriday/sync/changed-lines.ts`
- Test: `tests/unit/sync/changed-lines.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/sync/changed-lines.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { selectChangedLines } from "@/features/floriday/sync/changed-lines";
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

function row(overrides: Partial<SupplyLineRow> = {}): SupplyLineRow {
  return {
    supplyLineId: "11111111-1111-1111-1111-111111111111",
    status: "AVAILABLE",
    tradeItemId: "22222222-2222-2222-2222-222222222222",
    tradeItemVersion: 1,
    pricePerPiece: "0.4200",
    currency: "EUR",
    numberOfPieces: 400,
    deliveryNoteReference: "50738A",
    deliveryNoteCode: "50738",
    deliveryNoteLetter: "A",
    piecesPerPackage: 1,
    vbnPackageCode: 800,
    customPackageId: null,
    packagesPerLayer: 0,
    layersPerLoadCarrier: 4,
    loadCarrier: "AUCTION_TROLLEY",
    tradePeriodStart: new Date("2026-07-30T07:00:00.000Z"),
    tradePeriodEnd: new Date("2026-07-31T03:55:00.000Z"),
    supplierOrganizationId: "33333333-3333-3333-3333-333333333333",
    sequenceNumber: 100n,
    creationDateTime: new Date("2026-07-30T07:03:30.000Z"),
    lastModifiedDateTime: null,
    auctionDate: new Date("2026-07-31T00:00:00.000Z"),
    initialAuctionLocation: "AALSMEER",
    photoUrl: null,
    ...overrides,
  };
}

describe("selectChangedLines", () => {
  it("returns a line that has never been seen before", () => {
    const incoming = [row()];
    expect(selectChangedLines(incoming, new Map())).toEqual(incoming);
  });

  it("skips a line that is identical apart from its sequence number", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });

  it("returns a line whose piece count dropped", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ numberOfPieces: 280, sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line whose price changed", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ pricePerPiece: "0.4500", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line whose status flipped", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ status: "UNAVAILABLE", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("returns a line that moved to another auction location", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({ initialAuctionLocation: "NAALDWIJK", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("treats a change from null to a value as a change", () => {
    const existing = new Map([[row().supplyLineId, row({ deliveryNoteLetter: null })]]);
    const incoming = [row({ deliveryNoteLetter: "B", sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toHaveLength(1);
  });

  it("does not treat two nulls as a change", () => {
    const existing = new Map([[row().supplyLineId, row({ photoUrl: null })]]);
    const incoming = [row({ photoUrl: null, sequenceNumber: 999n })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });

  it("compares dates by value, not by object identity", () => {
    const existing = new Map([[row().supplyLineId, row()]]);
    const incoming = [row({
      tradePeriodEnd: new Date("2026-07-31T03:55:00.000Z"),
      sequenceNumber: 999n,
    })];
    expect(selectChangedLines(incoming, existing)).toEqual([]);
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/sync/changed-lines.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/sync/changed-lines.ts`:

```typescript
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";

/**
 * Every field that carries meaning. sequenceNumber is deliberately absent: Floriday
 * hands out a fresh one on any touch, including bulk operations that change nothing.
 * Comparing on it would fill the archive with noise.
 */
const CONTENT_FIELDS = [
  "status",
  "tradeItemId",
  "tradeItemVersion",
  "pricePerPiece",
  "currency",
  "numberOfPieces",
  "deliveryNoteReference",
  "deliveryNoteCode",
  "deliveryNoteLetter",
  "piecesPerPackage",
  "vbnPackageCode",
  "customPackageId",
  "packagesPerLayer",
  "layersPerLoadCarrier",
  "loadCarrier",
  "tradePeriodStart",
  "tradePeriodEnd",
  "supplierOrganizationId",
  "creationDateTime",
  "lastModifiedDateTime",
  "auctionDate",
  "initialAuctionLocation",
  "photoUrl",
] as const satisfies readonly (keyof SupplyLineRow)[];

function isSameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }
  return left === right;
}

/**
 * Returns the incoming lines that differ from what is already stored. A line that is not
 * in `existing` is always returned, because a first observation is always worth keeping.
 */
export function selectChangedLines(
  incoming: readonly SupplyLineRow[],
  existing: ReadonlyMap<string, SupplyLineRow>,
): SupplyLineRow[] {
  return incoming.filter((line) => {
    const stored = existing.get(line.supplyLineId);
    if (!stored) return true;

    return CONTENT_FIELDS.some((field) => !isSameValue(line[field], stored[field]));
  });
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/sync/changed-lines.test.ts`
Verwacht: PASS, 9 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/sync/changed-lines.ts tests/unit/sync/changed-lines.test.ts
git commit -m "feat: detect genuinely changed supply lines"
```

---

## Taak 11: Cursor en uitvoeringslog

**Files:**
- Create: `src/features/floriday/sync/cursor.ts`
- Create: `src/features/floriday/sync/run-log.ts`
- Test: `tests/integration/cursor.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/integration/cursor.test.ts`:

```typescript
import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { readCursor, writeCursor } from "@/features/floriday/sync/cursor";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";

const RESOURCE = "test_resource";

beforeEach(async () => {
  await prisma.syncState.deleteMany({ where: { resource: RESOURCE } });
  await prisma.syncRun.deleteMany({ where: { resource: RESOURCE } });
});

afterAll(async () => {
  await prisma.syncState.deleteMany({ where: { resource: RESOURCE } });
  await prisma.syncRun.deleteMany({ where: { resource: RESOURCE } });
  await prisma.$disconnect();
});

describe("cursor", () => {
  it("starts at zero when the resource is unknown", async () => {
    expect(await readCursor(RESOURCE)).toBe(0n);
  });

  it("stores and reads back a cursor", async () => {
    await writeCursor(RESOURCE, 12345n);
    expect(await readCursor(RESOURCE)).toBe(12345n);
  });

  it("overwrites an existing cursor", async () => {
    await writeCursor(RESOURCE, 1n);
    await writeCursor(RESOURCE, 2n);
    expect(await readCursor(RESOURCE)).toBe(2n);
  });
});

describe("run log", () => {
  it("records a successful run", async () => {
    const runId = await startRun(RESOURCE, "MANUAL");
    await finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: 2,
      rowsProcessed: 1500,
      rowsInserted: 1500,
      versionsAdded: 1500,
    });

    const run = await prisma.syncRun.findUniqueOrThrow({ where: { id: runId } });
    expect(run.status).toBe("SUCCEEDED");
    expect(run.rowsProcessed).toBe(1500);
    expect(run.finishedAt).not.toBeNull();
  });

  it("records a failed run with its message", async () => {
    const runId = await startRun(RESOURCE, "CRON");
    await finishRun(runId, { status: "FAILED", errorMessage: "boom" });

    const run = await prisma.syncRun.findUniqueOrThrow({ where: { id: runId } });
    expect(run.status).toBe("FAILED");
    expect(run.errorMessage).toBe("boom");
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/integration/cursor.test.ts`
Verwacht: FAIL, modules niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/sync/cursor.ts`:

```typescript
import { prisma } from "@/lib/db";

export const SUPPLY_RESOURCE = "clock_presales_supply";
export const ORGANIZATION_RESOURCE = "organizations";

export async function readCursor(resource: string): Promise<bigint> {
  const state = await prisma.syncState.findUnique({ where: { resource } });
  return state?.lastSequenceNumber ?? 0n;
}

export async function writeCursor(resource: string, sequenceNumber: bigint): Promise<void> {
  await prisma.syncState.upsert({
    where: { resource },
    create: { resource, lastSequenceNumber: sequenceNumber },
    update: { lastSequenceNumber: sequenceNumber },
  });
}
```

`src/features/floriday/sync/run-log.ts`:

```typescript
import type { SyncStatus, SyncTrigger } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface RunOutcome {
  status: Extract<SyncStatus, "SUCCEEDED" | "FAILED">;
  pagesProcessed?: number;
  rowsProcessed?: number;
  rowsInserted?: number;
  versionsAdded?: number;
  errorMessage?: string;
}

export async function startRun(resource: string, trigger: SyncTrigger): Promise<bigint> {
  const run = await prisma.syncRun.create({
    data: { resource, trigger, startedAt: new Date(), status: "RUNNING" },
  });
  return run.id;
}

export async function finishRun(runId: bigint, outcome: RunOutcome): Promise<void> {
  await prisma.syncRun.update({
    where: { id: runId },
    data: {
      finishedAt: new Date(),
      status: outcome.status,
      pagesProcessed: outcome.pagesProcessed ?? 0,
      rowsProcessed: outcome.rowsProcessed ?? 0,
      rowsInserted: outcome.rowsInserted ?? 0,
      versionsAdded: outcome.versionsAdded ?? 0,
      errorMessage: outcome.errorMessage ?? null,
    },
  });
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/integration/cursor.test.ts`
Verwacht: PASS, 5 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/sync/cursor.ts src/features/floriday/sync/run-log.ts tests/integration/cursor.test.ts
git commit -m "feat: track sync cursor and run log"
```

---

## Taak 12: Een pagina wegschrijven

**Files:**
- Create: `src/features/floriday/sync/write-supply-page.ts`
- Test: `tests/integration/write-supply-page.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/integration/write-supply-page.test.ts`:

```typescript
import "dotenv/config";
import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow } from "@/features/floriday/mappers/supply-line";
import { writeSupplyPage } from "@/features/floriday/sync/write-supply-page";

const page = supplyPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/supply-page.json", "utf8")),
);
const rows = page.results.map(toSupplyLineRow);
const ids = rows.map((r) => r.supplyLineId);

async function cleanup(): Promise<void> {
  await prisma.supplyLineVersion.deleteMany({ where: { supplyLineId: { in: ids } } });
  await prisma.supplyLine.deleteMany({ where: { supplyLineId: { in: ids } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("writeSupplyPage", () => {
  it("inserts lines and one version each on first write", async () => {
    const result = await writeSupplyPage(rows, new Date());

    expect(result.versionsAdded).toBe(rows.length);
    expect(await prisma.supplyLine.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
  });

  it("adds no versions when the same page is written twice", async () => {
    await writeSupplyPage(rows, new Date());
    const second = await writeSupplyPage(rows, new Date());

    expect(second.versionsAdded).toBe(0);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: { in: ids } } }))
      .toBe(rows.length);
  });

  it("adds one version when a piece count changes", async () => {
    await writeSupplyPage(rows, new Date());

    const changed = [
      { ...rows[0], numberOfPieces: rows[0].numberOfPieces - 40, sequenceNumber: rows[0].sequenceNumber + 1n },
      ...rows.slice(1),
    ];
    const second = await writeSupplyPage(changed, new Date());

    expect(second.versionsAdded).toBe(1);
    expect(await prisma.supplyLineVersion.count({ where: { supplyLineId: rows[0].supplyLineId } }))
      .toBe(2);
  });

  it("keeps firstSeenAt and moves lastSeenAt forward", async () => {
    const first = new Date("2026-07-30T08:00:00.000Z");
    const later = new Date("2026-07-30T09:00:00.000Z");

    await writeSupplyPage(rows, first);
    await writeSupplyPage(
      [{ ...rows[0], numberOfPieces: 1, sequenceNumber: rows[0].sequenceNumber + 1n }],
      later,
    );

    const stored = await prisma.supplyLine.findUniqueOrThrow({
      where: { supplyLineId: rows[0].supplyLineId },
    });
    expect(stored.firstSeenAt.toISOString()).toBe(first.toISOString());
    expect(stored.lastSeenAt.toISOString()).toBe(later.toISOString());
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/integration/write-supply-page.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/sync/write-supply-page.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import { selectChangedLines } from "@/features/floriday/sync/changed-lines";

export interface WriteResult {
  rowsProcessed: number;
  versionsAdded: number;
}

/**
 * Writes one page in a single transaction, in this order:
 *   1. read what is currently stored for these ids
 *   2. append versions for the lines that genuinely changed
 *   3. upsert the current state
 * The caller advances the cursor only after this resolves, so the cursor can never run
 * ahead of the data.
 */
export async function writeSupplyPage(
  rows: readonly SupplyLineRow[],
  observedAt: Date,
): Promise<WriteResult> {
  if (rows.length === 0) return { rowsProcessed: 0, versionsAdded: 0 };

  const ids = rows.map((row) => row.supplyLineId);

  return prisma.$transaction(async (tx) => {
    const stored = await tx.supplyLine.findMany({ where: { supplyLineId: { in: ids } } });

    // Prisma returns pricePerPiece as a Decimal and adds the two bookkeeping columns.
    // Bring it back to the shape selectChangedLines compares against; firstSeenAt and
    // lastSeenAt are dropped because they are not content.
    const existing = new Map<string, SupplyLineRow>(
      stored.map((line) => {
        const { firstSeenAt: _first, lastSeenAt: _last, ...content } = line;
        return [
          line.supplyLineId,
          { ...content, pricePerPiece: line.pricePerPiece.toFixed(4) },
        ];
      }),
    );

    const changed = selectChangedLines(rows, existing);

    if (changed.length > 0) {
      await tx.supplyLineVersion.createMany({
        data: changed.map((row) => ({ ...row, observedAt })),
        skipDuplicates: true,
      });
    }

    for (const row of rows) {
      await tx.supplyLine.upsert({
        where: { supplyLineId: row.supplyLineId },
        create: { ...row, firstSeenAt: observedAt, lastSeenAt: observedAt },
        update: { ...row, lastSeenAt: observedAt },
      });
    }

    return { rowsProcessed: rows.length, versionsAdded: changed.length };
  }, { timeout: 30_000 });
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/integration/write-supply-page.test.ts`
Verwacht: PASS, 4 tests.

De tweede test is de belangrijkste van dit hele plan: hij bewijst dat opnieuw draaien
veilig is, en daar rust het hele herstelverhaal op.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/sync/write-supply-page.ts tests/integration/write-supply-page.test.ts
git commit -m "feat: write supply pages idempotently with version history"
```

---

## Taak 13: De pagineerlus over het klokaanbod

**Files:**
- Create: `src/features/floriday/sync/supply-lines.ts`
- Test: `tests/unit/sync/supply-lines.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/sync/supply-lines.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { syncSupplyLines } from "@/features/floriday/sync/supply-lines";
import type { SupplyPage } from "@/features/floriday/schemas/supply-line";

function line(sequenceNumber: number) {
  return {
    supplyLineId: `00000000-0000-0000-0000-${String(sequenceNumber).padStart(12, "0")}`,
    status: "AVAILABLE" as const,
    tradeItemId: "22222222-2222-2222-2222-222222222222",
    tradeItemVersion: null,
    pricePerPiece: { currency: "EUR", value: 0.42 },
    deliveryNoteReference: null,
    deliveryNoteCode: null,
    deliveryNoteLetter: null,
    numberOfPieces: 100,
    packingConfiguration: {
      piecesPerPackage: 1,
      package: { vbnPackageCode: 800, customPackageId: null },
      packagesPerLayer: 0,
      layersPerLoadCarrier: 4,
      loadCarrier: "AUCTION_TROLLEY",
    },
    tradePeriod: {
      startDateTime: "2026-07-30T07:00:00Z",
      endDateTime: "2026-07-31T03:55:00Z",
    },
    supplierOrganizationId: "33333333-3333-3333-3333-333333333333",
    sequenceNumber,
    creationDateTime: "2026-07-30T07:03:30Z",
    lastModifiedDateTime: null,
    auctionDate: "2026-07-31",
    initialAuctionLocation: "AALSMEER" as const,
    photoUrl: null,
  };
}

function page(sequences: number[], maximumSequenceNumber: number): SupplyPage {
  return { maximumSequenceNumber, results: sequences.map(line) };
}

describe("syncSupplyLines", () => {
  it("walks pages until the cursor reaches the maximum", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1, 2], 4))
      .mockResolvedValueOnce(page([3, 4], 4));
    const writePage = vi.fn().mockResolvedValue({ rowsProcessed: 2, versionsAdded: 2 });
    const writeCursor = vi.fn();

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor,
      now: () => new Date("2026-07-31T10:00:00Z"),
    });

    expect(getJson).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
    expect(result.rowsProcessed).toBe(4);
    expect(writeCursor).toHaveBeenLastCalledWith(4n);
  });

  it("resumes from the given cursor", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([11], 11));
    await syncSupplyLines({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn().mockResolvedValue({ rowsProcessed: 1, versionsAdded: 1 }),
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson.mock.calls[0][0]).toContain("/sync/10?");
  });

  it("stops on an empty page and reports it when below the maximum", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([], 999));

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
      now: () => new Date(),
    });

    expect(result.pagesProcessed).toBe(0);
    expect(result.warning).toMatch(/empty page/i);
  });

  it("writes the page before advancing the cursor", async () => {
    const order: string[] = [];
    await syncSupplyLines({
      client: { getJson: vi.fn().mockResolvedValueOnce(page([1], 1)) },
      startCursor: 0n,
      writePage: vi.fn(async () => {
        order.push("write");
        return { rowsProcessed: 1, versionsAdded: 1 };
      }),
      writeCursor: vi.fn(async () => { order.push("cursor"); }),
      now: () => new Date(),
    });

    expect(order).toEqual(["write", "cursor"]);
  });

  it("honours the page limit", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1], 100))
      .mockResolvedValueOnce(page([2], 100));

    const result = await syncSupplyLines({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn().mockResolvedValue({ rowsProcessed: 1, versionsAdded: 1 }),
      writeCursor: vi.fn(),
      now: () => new Date(),
      maxPages: 2,
    });

    expect(result.pagesProcessed).toBe(2);
    expect(result.reachedEnd).toBe(false);
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/sync/supply-lines.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

`src/features/floriday/sync/supply-lines.ts`:

```typescript
import { supplyPageSchema, type SupplyPage } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow, type SupplyLineRow } from "@/features/floriday/mappers/supply-line";
import type { WriteResult } from "@/features/floriday/sync/write-supply-page";

const PAGE_SIZE = 1000;

export interface SyncSupplyLinesOptions {
  client: { getJson<T>(path: string): Promise<T> };
  startCursor: bigint;
  writePage: (rows: SupplyLineRow[], observedAt: Date) => Promise<WriteResult>;
  writeCursor: (sequenceNumber: bigint) => Promise<void>;
  now: () => Date;
  /** Stops after this many pages. Used by the cron route to bound one run. */
  maxPages?: number;
}

export interface SyncSupplyLinesResult {
  pagesProcessed: number;
  rowsProcessed: number;
  versionsAdded: number;
  cursor: bigint;
  reachedEnd: boolean;
  warning?: string;
}

export async function syncSupplyLines(
  options: SyncSupplyLinesOptions,
): Promise<SyncSupplyLinesResult> {
  const { client, writePage, writeCursor, now, maxPages = Number.MAX_SAFE_INTEGER } = options;

  let cursor = options.startCursor;
  let pagesProcessed = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let reachedEnd = false;
  let warning: string | undefined;

  while (pagesProcessed < maxPages) {
    const raw = await client.getJson<unknown>(
      `/auction/clock-presales-supply/sync/${cursor}?limit=${PAGE_SIZE}`,
    );
    const page: SupplyPage = supplyPageSchema.parse(raw);

    if (page.results.length === 0) {
      reachedEnd = true;
      if (cursor < BigInt(page.maximumSequenceNumber)) {
        // The docs warn that an empty page does not prove you are up to date when
        // results are filtered on connections. That does not apply to clock supply
        // today, but staying silent would hide it if that ever changes.
        warning =
          `Received an empty page at cursor ${cursor} while the maximum is ` +
          `${page.maximumSequenceNumber}. Results may be filtered.`;
      }
      break;
    }

    const rows = page.results.map(toSupplyLineRow);
    const written = await writePage(rows, now());

    cursor = rows[rows.length - 1].sequenceNumber;
    await writeCursor(cursor);

    pagesProcessed += 1;
    rowsProcessed += written.rowsProcessed;
    versionsAdded += written.versionsAdded;

    if (cursor >= BigInt(page.maximumSequenceNumber)) {
      reachedEnd = true;
      break;
    }
  }

  return { pagesProcessed, rowsProcessed, versionsAdded, cursor, reachedEnd, warning };
}
```

- [ ] **Stap 4: Draai de test opnieuw**

Run: `npm test -- tests/unit/sync/supply-lines.test.ts`
Verwacht: PASS, 5 tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/floriday/sync/supply-lines.ts tests/unit/sync/supply-lines.test.ts
git commit -m "feat: paginate through clock presales supply"
```

---

## Taak 14: Ontbrekende artikelen ophalen

**Files:**
- Create: `src/features/floriday/mappers/trade-item.ts`
- Create: `src/features/floriday/sync/trade-items.ts`
- Test: `tests/unit/sync/trade-items.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/sync/trade-items.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { chunkIds, fetchMissingTradeItems } from "@/features/floriday/sync/trade-items";

describe("chunkIds", () => {
  it("splits into blocks of the given size", () => {
    expect(chunkIds(["a", "b", "c", "d", "e"], 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("returns nothing for an empty list", () => {
    expect(chunkIds([], 100)).toEqual([]);
  });
});

describe("fetchMissingTradeItems", () => {
  const item = (id: string) => ({
    tradeItemId: id,
    supplierOrganizationId: "33333333-3333-3333-3333-333333333333",
    name: "CYMB T GEM.",
    vbnProductCode: 973,
    code: null,
    gtin: null,
    botanicalNames: [],
    countryOfOriginIsoCodes: [],
    tradeItemVersion: 1,
    isDeleted: false,
    sequenceNumber: 1,
    characteristics: null,
    photos: null,
    packingConfigurations: null,
  });

  const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("asks only for ids that are not stored yet", async () => {
    const getJson = vi.fn().mockResolvedValue([item(idB)]);
    const findKnownIds = vi.fn().mockResolvedValue(new Set([idA]));
    const saveTradeItems = vi.fn();

    const added = await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA, idB],
      findKnownIds,
      saveTradeItems,
      now: () => new Date(),
    });

    expect(getJson.mock.calls[0][0]).toContain(idB);
    expect(getJson.mock.calls[0][0]).not.toContain(idA);
    expect(added).toBe(1);
  });

  it("makes no request when everything is already known", async () => {
    const getJson = vi.fn();
    const added = await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: [idA],
      findKnownIds: async () => new Set([idA]),
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson).not.toHaveBeenCalled();
    expect(added).toBe(0);
  });

  it("splits large requests into blocks of a hundred", async () => {
    const ids = Array.from({ length: 250 }, (_, i) =>
      `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`);
    const getJson = vi.fn().mockResolvedValue([]);

    await fetchMissingTradeItems({
      client: { getJson },
      tradeItemIds: ids,
      findKnownIds: async () => new Set(),
      saveTradeItems: vi.fn(),
      now: () => new Date(),
    });

    expect(getJson).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/sync/trade-items.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de mapper**

`src/features/floriday/mappers/trade-item.ts`:

```typescript
import type { Prisma } from "@prisma/client";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

export function toTradeItemRow(
  payload: TradeItemPayload,
  fetchedAt: Date,
): Prisma.TradeItemCreateManyInput {
  return {
    tradeItemId: payload.tradeItemId,
    supplierOrganizationId: payload.supplierOrganizationId,
    name: payload.name,
    vbnProductCode: payload.vbnProductCode,
    code: payload.code,
    gtin: payload.gtin,
    botanicalNames: payload.botanicalNames ?? [],
    countryOfOriginIsoCodes: payload.countryOfOriginIsoCodes ?? [],
    tradeItemVersion: payload.tradeItemVersion,
    isDeleted: payload.isDeleted,
    sequenceNumber: BigInt(payload.sequenceNumber),
    characteristics: (payload.characteristics ?? null) as Prisma.InputJsonValue,
    photos: (payload.photos ?? null) as Prisma.InputJsonValue,
    packingConfigurations: (payload.packingConfigurations ?? null) as Prisma.InputJsonValue,
    fetchedAt,
  };
}
```

- [ ] **Stap 4: Schrijf de sync**

`src/features/floriday/sync/trade-items.ts`:

```typescript
import { tradeItemSchema, type TradeItemPayload } from "@/features/floriday/schemas/trade-item";

/** 100 ids produce a URL of about 3.8 kB, well within the usual 8 kB limit. */
const BATCH_SIZE = 100;

export function chunkIds(ids: readonly string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export interface FetchMissingTradeItemsOptions {
  client: { getJson<T>(path: string): Promise<T> };
  tradeItemIds: readonly string[];
  findKnownIds: (ids: readonly string[]) => Promise<Set<string>>;
  saveTradeItems: (items: TradeItemPayload[], fetchedAt: Date) => Promise<void>;
  now: () => Date;
}

/**
 * Trade items have no sync endpoint for us: /trade-items/sync returns 403 without
 * connected suppliers. Fetching by id does work, so we top up the lookup table with
 * whatever the supply pages referenced but we do not have yet.
 */
export async function fetchMissingTradeItems(
  options: FetchMissingTradeItemsOptions,
): Promise<number> {
  const { client, tradeItemIds, findKnownIds, saveTradeItems, now } = options;

  const unique = [...new Set(tradeItemIds)];
  if (unique.length === 0) return 0;

  const known = await findKnownIds(unique);
  const missing = unique.filter((id) => !known.has(id));
  if (missing.length === 0) return 0;

  let added = 0;

  for (const batch of chunkIds(missing, BATCH_SIZE)) {
    const raw = await client.getJson<unknown>(`/trade-items?tradeItemIds=${batch.join(",")}`);
    const items = tradeItemSchema.array().parse(raw);
    if (items.length > 0) {
      await saveTradeItems(items, now());
      added += items.length;
    }
  }

  return added;
}
```

- [ ] **Stap 5: Draai de test opnieuw**

Run: `npm test -- tests/unit/sync/trade-items.test.ts`
Verwacht: PASS, 5 tests.

- [ ] **Stap 6: Voeg de database-koppelingen toe**

`src/features/floriday/sync/trade-items-store.ts`:

```typescript
import { prisma } from "@/lib/db";
import { toTradeItemRow } from "@/features/floriday/mappers/trade-item";
import type { TradeItemPayload } from "@/features/floriday/schemas/trade-item";

export async function findKnownTradeItemIds(ids: readonly string[]): Promise<Set<string>> {
  const rows = await prisma.tradeItem.findMany({
    where: { tradeItemId: { in: [...ids] } },
    select: { tradeItemId: true },
  });
  return new Set(rows.map((row) => row.tradeItemId));
}

export async function saveTradeItems(
  items: TradeItemPayload[],
  fetchedAt: Date,
): Promise<void> {
  await prisma.tradeItem.createMany({
    data: items.map((item) => toTradeItemRow(item, fetchedAt)),
    skipDuplicates: true,
  });
}
```

- [ ] **Stap 7: Commit**

```bash
git add src/features/floriday/sync/trade-items.ts src/features/floriday/sync/trade-items-store.ts src/features/floriday/mappers/trade-item.ts tests/unit/sync/trade-items.test.ts
git commit -m "feat: fetch missing trade items by id in batches"
```

---

## Taak 15: Organisaties synchroniseren

**Files:**
- Create: `src/features/floriday/mappers/organization.ts`
- Create: `src/features/floriday/sync/organizations.ts`
- Test: `tests/unit/mappers/organization.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

`tests/unit/mappers/organization.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";
import { toOrganizationRow } from "@/features/floriday/mappers/organization";

const page = organizationPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/organizations.json", "utf8")),
);

describe("toOrganizationRow", () => {
  it("takes city and country from the physical address", () => {
    const source = page.results.find((o) => o.physicalAddress?.city) ?? page.results[0];
    const row = toOrganizationRow(source);
    expect(row.city).toBe(source.physicalAddress?.city ?? null);
    expect(row.countryCode).toBe(source.physicalAddress?.countryCode ?? null);
  });

  it("falls back to the mailing address when there is no physical address", () => {
    const source = { ...page.results[0], physicalAddress: null };
    const row = toOrganizationRow(source);
    expect(row.city).toBe(source.mailingAddress?.city ?? null);
  });

  it("converts the sequence number to bigint", () => {
    expect(typeof toOrganizationRow(page.results[0]).sequenceNumber).toBe("bigint");
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm test -- tests/unit/mappers/organization.test.ts`
Verwacht: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de mapper**

`src/features/floriday/mappers/organization.ts`:

```typescript
import type { Prisma } from "@prisma/client";
import type { OrganizationPayload } from "@/features/floriday/schemas/organization";

export function toOrganizationRow(
  payload: OrganizationPayload,
): Prisma.OrganizationCreateManyInput {
  const address = payload.physicalAddress ?? payload.mailingAddress;

  return {
    organizationId: payload.organizationId,
    name: payload.name,
    commercialName: payload.commercialName,
    companyGln: payload.companyGln,
    rfhRelationId: payload.rfhRelationId,
    organizationType: payload.organizationType,
    city: address?.city ?? null,
    countryCode: address?.countryCode ?? null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    sequenceNumber: BigInt(payload.sequenceNumber),
  };
}
```

- [ ] **Stap 4: Schrijf de sync**

`src/features/floriday/sync/organizations.ts`:

```typescript
import { prisma } from "@/lib/db";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";
import { toOrganizationRow } from "@/features/floriday/mappers/organization";
import { ORGANIZATION_RESOURCE, readCursor, writeCursor } from "@/features/floriday/sync/cursor";

const PAGE_SIZE = 1000;

export interface SyncOrganizationsResult {
  pagesProcessed: number;
  rowsProcessed: number;
}

export async function syncOrganizations(
  client: { getJson<T>(path: string): Promise<T> },
): Promise<SyncOrganizationsResult> {
  let cursor = await readCursor(ORGANIZATION_RESOURCE);
  let pagesProcessed = 0;
  let rowsProcessed = 0;

  for (;;) {
    const raw = await client.getJson<unknown>(`/organizations/sync/${cursor}?limit=${PAGE_SIZE}`);
    const page = organizationPageSchema.parse(raw);
    if (page.results.length === 0) break;

    const rows = page.results.map(toOrganizationRow);

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.organization.upsert({
          where: { organizationId: row.organizationId },
          create: row,
          update: row,
        });
      }
    }, { timeout: 30_000 });

    cursor = BigInt(page.results[page.results.length - 1].sequenceNumber);
    await writeCursor(ORGANIZATION_RESOURCE, cursor);

    pagesProcessed += 1;
    rowsProcessed += rows.length;

    if (cursor >= BigInt(page.maximumSequenceNumber)) break;
  }

  return { pagesProcessed, rowsProcessed };
}
```

- [ ] **Stap 5: Draai de test opnieuw**

Run: `npm test -- tests/unit/mappers/organization.test.ts`
Verwacht: PASS, 3 tests.

- [ ] **Stap 6: Commit**

```bash
git add src/features/floriday/mappers/organization.ts src/features/floriday/sync/organizations.ts tests/unit/mappers/organization.test.ts
git commit -m "feat: sync organizations as a lookup table"
```

---

## Taak 16: De sync samenstellen

**Files:**
- Create: `src/features/floriday/sync/run-supply-sync.ts`
- Create: `src/features/floriday/client/index.ts`

- [ ] **Stap 1: Schrijf de clientfabriek**

`src/features/floriday/client/index.ts`:

```typescript
import { getEnv } from "@/lib/env";
import { createFloridayClient, type FloridayClient } from "@/features/floriday/client/http";
import { createRateLimiter } from "@/features/floriday/client/rate-limiter";
import { createTokenCache } from "@/features/floriday/client/token-cache";
import { fetchAccessToken } from "@/features/floriday/client/token-request";

export function createCustomersClient(): FloridayClient {
  const env = getEnv();

  return createFloridayClient({
    baseUrl: env.FLORIDAY_CUSTOMERS_API_BASE_URL,
    apiKey: env.FLORIDAY_CUSTOMERS_API_KEY,
    tokenCache: createTokenCache({
      fetchToken: () => fetchAccessToken(env),
      ttlSeconds: 3540,
    }),
    rateLimiter: createRateLimiter({ requestsPerSecond: 3 }),
  });
}
```

- [ ] **Stap 2: Schrijf de samenstelling**

`src/features/floriday/sync/run-supply-sync.ts`:

```typescript
import type { SyncTrigger } from "@prisma/client";
import { createCustomersClient } from "@/features/floriday/client";
import { SUPPLY_RESOURCE, readCursor, writeCursor } from "@/features/floriday/sync/cursor";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";
import { syncSupplyLines, type SyncSupplyLinesResult } from "@/features/floriday/sync/supply-lines";
import { writeSupplyPage } from "@/features/floriday/sync/write-supply-page";
import { fetchMissingTradeItems } from "@/features/floriday/sync/trade-items";
import { findKnownTradeItemIds, saveTradeItems } from "@/features/floriday/sync/trade-items-store";
import { prisma } from "@/lib/db";

export interface RunSupplySyncOptions {
  trigger: SyncTrigger;
  /** Bounds one run. The cron route passes a small number; the backfill passes none. */
  maxPages?: number;
  onProgress?: (message: string) => void;
}

export interface RunSupplySyncResult extends SyncSupplyLinesResult {
  tradeItemsAdded: number;
}

export async function runSupplySync(
  options: RunSupplySyncOptions,
): Promise<RunSupplySyncResult> {
  const { trigger, maxPages, onProgress } = options;
  const client = createCustomersClient();
  const runId = await startRun(SUPPLY_RESOURCE, trigger);

  try {
    const startCursor = await readCursor(SUPPLY_RESOURCE);
    onProgress?.(`Starting at sequence ${startCursor}`);

    const result = await syncSupplyLines({
      client,
      startCursor,
      writePage: async (rows, observedAt) => {
        const written = await writeSupplyPage(rows, observedAt);
        onProgress?.(
          `page written: ${written.rowsProcessed} rows, ${written.versionsAdded} versions`,
        );
        return written;
      },
      writeCursor: (sequenceNumber) => writeCursor(SUPPLY_RESOURCE, sequenceNumber),
      now: () => new Date(),
      maxPages,
    });

    const referencedIds = await prisma.supplyLine.findMany({
      where: { sequenceNumber: { gt: startCursor, lte: result.cursor } },
      select: { tradeItemId: true },
      distinct: ["tradeItemId"],
    });

    const tradeItemsAdded = await fetchMissingTradeItems({
      client,
      tradeItemIds: referencedIds.map((row) => row.tradeItemId),
      findKnownIds: findKnownTradeItemIds,
      saveTradeItems,
      now: () => new Date(),
    });

    await finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      errorMessage: result.warning,
    });

    return { ...result, tradeItemsAdded };
  } catch (error: unknown) {
    await finishRun(runId, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

- [ ] **Stap 3: Controleer dat het typecheckt**

Run: `npx tsc --noEmit`
Verwacht: geen uitvoer.

- [ ] **Stap 4: Commit**

```bash
git add src/features/floriday/client/index.ts src/features/floriday/sync/run-supply-sync.ts
git commit -m "feat: compose supply sync with run logging and trade item top-up"
```

---

## Taak 17: Het backfill-script

**Files:**
- Create: `scripts/backfill.ts`

- [ ] **Stap 1: Schrijf het script**

`scripts/backfill.ts`:

```typescript
/**
 * One-off catch-up from sequence zero. Runs locally so there is no serverless timeout;
 * it may take as long as it takes. Safe to interrupt and rerun: the cursor is stored
 * after every page and rewriting a page adds no duplicate versions.
 *
 * Usage:
 *   npm run backfill              full run
 *   npm run backfill -- --pages 5 stop after five pages, for a first try
 *   npm run backfill -- --reset   start over from sequence zero
 */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { syncOrganizations } from "@/features/floriday/sync/organizations";
import { createCustomersClient } from "@/features/floriday/client";
import { SUPPLY_RESOURCE, writeCursor } from "@/features/floriday/sync/cursor";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const startedAt = Date.now();

  if (process.argv.includes("--reset")) {
    await writeCursor(SUPPLY_RESOURCE, 0n);
    console.log("Cursor reset to 0");
  }

  console.log("Syncing organizations...");
  const organizations = await syncOrganizations(createCustomersClient());
  console.log(`  ${organizations.rowsProcessed} organizations in ${organizations.pagesProcessed} pages`);

  const pagesFlag = readFlag("pages");
  console.log("Syncing clock presales supply...");

  const result = await runSupplySync({
    trigger: "BACKFILL",
    maxPages: pagesFlag ? Number(pagesFlag) : undefined,
    onProgress: (message) => console.log(`  ${message}`),
  });

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log("");
  console.log(`Done in ${seconds}s`);
  console.log(`  pages:        ${result.pagesProcessed}`);
  console.log(`  rows:         ${result.rowsProcessed}`);
  console.log(`  versions:     ${result.versionsAdded}`);
  console.log(`  trade items:  ${result.tradeItemsAdded}`);
  console.log(`  cursor:       ${result.cursor}`);
  console.log(`  reached end:  ${result.reachedEnd}`);
  if (result.warning) console.log(`  warning:      ${result.warning}`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
```

- [ ] **Stap 2: Draai een kleine proef**

Run: `npm run backfill -- --pages 3`
Verwacht: drie pagina's verwerkt, ongeveer 3000 rijen en evenveel versies, plus een aantal
artikelen. De cursor staat daarna op het sequencenummer van de laatste regel.

- [ ] **Stap 3: Controleer dat opnieuw draaien niets dubbel doet**

```bash
npm run backfill -- --reset --pages 3
```

Verwacht: `versions: 0`. De regels stonden er al en waren ongewijzigd.

Dit is de belangrijkste handmatige controle van het plan. Staat er iets anders dan nul,
stop dan en zoek uit waarom voordat je verder gaat — dan klopt er iets niet aan
`selectChangedLines` of aan de mapper.

- [ ] **Stap 4: Draai de volledige inhaalslag**

Run: `npm run backfill`
Verwacht: ongeveer 1,2 miljoen rijen in de orde van tien minuten.

- [ ] **Stap 5: Controleer het resultaat**

```bash
npx tsx -e "import 'dotenv/config'; import { prisma } from './src/lib/db'; console.log({ lines: await prisma.supplyLine.count(), versions: await prisma.supplyLineVersion.count(), items: await prisma.tradeItem.count(), orgs: await prisma.organization.count() });"
```

Verwacht: `lines` en `versions` liggen dicht bij elkaar (elke regel heeft minstens één
versie), `items` in de orde van tienduizenden, `orgs` een paar duizend.

- [ ] **Stap 6: Commit**

```bash
git add scripts/backfill.ts
git commit -m "feat: add resumable backfill script"
```

---

## Taak 18: De cron-route

**Files:**
- Create: `src/app/api/cron/sync/route.ts`
- Create: `vercel.json`

- [ ] **Stap 1: Schrijf de route**

`src/app/api/cron/sync/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hourly top-up. Bounded to 20 pages so one run always finishes well within the
 * function limit; if there is more to do, the next hour picks it up. Falling behind is
 * not a data problem, because the cursor decides where to resume, not the clock.
 */
const MAX_PAGES_PER_RUN = 20;

export async function GET(request: Request): Promise<NextResponse> {
  const expected = `Bearer ${getEnv().CRON_SECRET}`;
  if (request.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSupplySync({
      trigger: "CRON",
      maxPages: MAX_PAGES_PER_RUN,
    });

    return NextResponse.json({
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      tradeItemsAdded: result.tradeItemsAdded,
      cursor: result.cursor.toString(),
      reachedEnd: result.reachedEnd,
      warning: result.warning ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Stap 2: Schrijf de route voor organisaties**

Kwekersnamen veranderen zelden, dus die krijgen een eigen ritme van een keer per dag. Zou
dit meeliften op de uurlijkse route, dan doen we 24 keer per dag werk dat één keer nodig is.

`src/app/api/cron/organizations/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createCustomersClient } from "@/features/floriday/client";
import { syncOrganizations } from "@/features/floriday/sync/organizations";
import { ORGANIZATION_RESOURCE } from "@/features/floriday/sync/cursor";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request): Promise<NextResponse> {
  const expected = `Bearer ${getEnv().CRON_SECRET}`;
  if (request.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = await startRun(ORGANIZATION_RESOURCE, "CRON");

  try {
    const result = await syncOrganizations(createCustomersClient());

    await finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await finishRun(runId, { status: "FAILED", errorMessage: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Stap 3: Schrijf `vercel.json`**

```json
{
  "buildCommand": "prisma generate && next build",
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "5 * * * *"
    },
    {
      "path": "/api/cron/organizations",
      "schedule": "30 4 * * *"
    }
  ]
}
```

Het aanbod draait vijf minuten over het uur, zodat de run niet samenvalt met de drukte op
het hele uur. Organisaties draaien om half vijf 's ochtends, kort nadat het ordervenster
gesloten is en vóór het nieuwe om negen uur opengaat.

- [ ] **Stap 4: Lokaal testen**

Start de server in een aparte terminal:

```bash
npm run dev
```

Roep de route aan met het juiste geheim (vul de waarde uit `.env` in):

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/sync
```

Verwacht: JSON met `pagesProcessed`, `rowsProcessed` en een `cursor`. Bij een tweede
aanroep vlak erna staat `versionsAdded` op of dicht bij nul.

- [ ] **Stap 5: Testen dat de beveiliging werkt**

```bash
curl -i http://localhost:3000/api/cron/sync
```

Verwacht: `HTTP/1.1 401` met `{"error":"Unauthorized"}`.

- [ ] **Stap 6: Commit**

```bash
git add src/app/api/cron vercel.json
git commit -m "feat: add cron routes for supply and organization sync"
```

---

## Taak 19: Volledige testrun en documentatie bijwerken

**Files:**
- Modify: `docs/inventarisatie.md`
- Create: `README.md`

- [ ] **Stap 1: Draai alle tests**

Run: `npm test`
Verwacht: alle tests slagen, geen overgeslagen tests.

- [ ] **Stap 2: Typecheck en build**

```bash
npx tsc --noEmit
npm run build
```

Verwacht: beide zonder fouten.

- [ ] **Stap 3: Schrijf `README.md`**

```markdown
# Floriday middleware

Haalt het klokvoorverkoop-aanbod uit Floriday op en legt het met versiehistorie vast in
een Neon-database.

## Aan de slag

1. `npm install`
2. Kopieer `.env.example` naar `.env` en vul de waarden in.
3. `npm run db:push`
4. `npm run capture-fixtures` — haalt echte API-antwoorden op als testinvoer.
5. `npm test`

## Scripts

| Commando | Wat het doet |
|---|---|
| `npm run backfill` | Eenmalige inhaalslag vanaf sequencenummer nul. Hervatbaar. |
| `npm run backfill -- --pages 5` | Stopt na vijf pagina's. Handig voor een eerste proef. |
| `npm run backfill -- --reset` | Zet de cursor terug op nul. |
| `npm run capture-fixtures` | Vernieuwt de testinvoer in `tests/fixtures/`. |
| `npm run dev` | Start de app op met webpack (Turbopack crasht op Windows). |

## Hoe het werkt

De sync is gebaseerd op sequencenummers, niet op tijd. Elke pagina wordt in één
transactie weggeschreven en pas daarna gaat de cursor vooruit, dus een afgebroken run
laat geen gaten achter. Een pagina opnieuw verwerken voegt niets toe.

Wat we vastleggen is het **voorverkoopaanbod**, niet het volledige klokaanbod — zie
`docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`, paragraaf 2.

## Verder lezen

- `docs/inventarisatie.md` — hoe de koppeling met Floriday tot stand kwam
- `docs/superpowers/specs/` — ontwerp
- `docs/superpowers/plans/` — implementatieplan
```

- [ ] **Stap 4: `docs/inventarisatie.md` bijwerken**

Voeg in paragraaf 6 onder "Afgerond" toe:

```markdown
5. ~~Deelproject A: ingest en database~~ — schema op Neon, backfill en uurlijkse sync
   opgeleverd. Zie `README.md` voor gebruik.
```

- [ ] **Stap 5: Commit**

```bash
git add README.md docs/inventarisatie.md
git commit -m "docs: document setup and usage"
```

- [ ] **Stap 6: Naar de testomgeving pushen**

```bash
git push -u origin develop
```

Merge naar `main` gebeurt pas na expliciete goedkeuring.

---

## Wat hierna komt

- **Deelproject B** — zoekinterface met een grid dat serverside filtert en pagineert.
- **Deelproject C** — dagelijkse doorgifte naar de interne informatievoorziening.
- **Productie** — tweede Neon-project, productiecredentials en een productie-API-key. Let
  op: de API key wordt maar één keer getoond, dus meteen vastleggen.

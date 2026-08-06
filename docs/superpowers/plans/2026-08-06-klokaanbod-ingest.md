# Klokaanbod-ingest via RFH Pre-Auction — implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Het volledige klokaanbod voor snijbloemen ophalen uit de RFH Pre-Auction-API en met versiehistorie vastleggen in Neon, naast de bestaande Floriday-voorverkoopketen.

**Architecture:** Een tweede, zelfstandige ingest in `src/features/rfh-preauction/`, opgebouwd als de bestaande `src/features/floriday/`: client met retry, Zod-schema, mapper, wijzigingsdetectie, paginaschrijver, orchestratie met `SyncRun`. Twee verschillen bepalen het ontwerp. Er is geen volgnummerreeks maar een zoek-API op veildatum, dus de sync loopt over sneden van veildatum × veillocatie in plaats van over een cursor. En de authenticatie loopt op een roulerende refresh token die in de database woont in plaats van op client credentials uit de omgeving.

**Tech Stack:** TypeScript strict, Next.js 16 App Router, Prisma 6 met `@prisma/adapter-neon`, Zod, Vitest, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-08-06-rfh-preauction-klokaanbod-design.md`. Elke taak hieronder verwijst naar de paragraaf die hij uitvoert.

---

## Buiten dit plan

Het zoekscherm (spec §8). Dat krijgt een eigen plan zodra deze ingest draait en er productiedata is om tegen te ontwerpen — dezelfde volgorde als deelproject A en B. Dit plan levert een werkende, getoetste ingest op; dat is op zichzelf bruikbaar via de bestaande statuspagina en `scripts/export-aanbod.ts`-achtige uitvoer.

---

## Bestandsindeling

| Bestand | Verantwoordelijkheid |
|---|---|
| `prisma/schema.prisma` | Drie modellen erbij: `ClockSupplyLine`, `ClockSupplyLineVersion`, `RfhSession` |
| `src/lib/env.ts` | Drie optionele variabelen plus `getRfhEnv()` |
| `src/features/rfh-preauction/client/token-request.ts` | Eén refresh-grant tegen Okta. Geen opslag, geen cache |
| `src/features/rfh-preauction/client/session-store.ts` | `RfhSession` lezen en schrijven achter een advisory lock |
| `src/features/rfh-preauction/client/token-provider.ts` | Combineert die twee, met een cache voor de looptijd van het proces |
| `src/features/rfh-preauction/client/http.ts` | `postJson` met retry, backoff en één hertest na 401 |
| `src/features/rfh-preauction/client/index.ts` | Productiebedrading: `createPreauctionClient()` |
| `src/features/rfh-preauction/schemas/clock-supply.ts` | Zod op het antwoord van `clock-supply-search` |
| `src/features/rfh-preauction/mappers/clock-supply.ts` | Payload naar `ClockSupplyLineRow` |
| `src/features/rfh-preauction/sync/veildagen.ts` | Veildagsleutels in Europe/Amsterdam |
| `src/features/rfh-preauction/sync/sneden.ts` | De vaste lijst veillocaties en de snede-opsomming |
| `src/features/rfh-preauction/sync/changed-lines.ts` | Welke regels inhoudelijk veranderd zijn |
| `src/features/rfh-preauction/sync/write-clock-page.ts` | Upsert plus versierijen, in één transactie |
| `src/features/rfh-preauction/sync/clock-supply.ts` | Pagineren binnen één snede |
| `src/features/rfh-preauction/sync/run-clock-sync.ts` | Orchestratie over alle sneden, met `SyncRun` |
| `src/app/api/cron/klok/route.ts` | De geplande taak |
| `scripts/rfh-koppel.ts` | Eenmalig een refresh token in de database zetten |
| `scripts/rfh-typeproef.ts` | De werkelijke veldtypen meten tegen staging |
| `scripts/backfill-klok.ts` | Inhaalslag over de beschikbare maand |

---

## Taak 1: Databaseschema

Voert spec §7 uit.

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Stap 1: Voeg de drie modellen toe**

Onderaan `prisma/schema.prisma`:

```prisma
/// Het volledige klokaanbod voor snijbloemen, opgehaald bij RFH Pre-Auction.
/// Losstaand van SupplyLine: dat is de voorverkoop, dit is de klok. De koppeling
/// tussen beide is clockPresalesSupplyLineId, en die is optioneel omdat een vijfde
/// van het klokaanbod nooit door de voorverkoop komt (spec §3.2).
model ClockSupplyLine {
  clockSupplyLineId String   @id @db.Uuid
  reference         String
  auctionDate       DateTime @db.Date

  /// Wijst naar SupplyLine.supplyLineId. Geen relatie in Prisma en geen foreign key:
  /// op productie bestaat onze voorverkoopkant nog niet, en RFH laat deze verwijzing
  /// los zodra de veildag geweest is (spec §3.7). Een foreign key zou dan schrijven
  /// blokkeren op precies het moment dat het ertoe doet.
  clockPresalesSupplyLineId String? @db.Uuid

  supplierOrganizationId String   @db.Uuid
  supplierName           String?
  supplierRelationNumber String?
  supplierLogoUrl        String?
  supplierCertificates   String[]

  productCode                String?
  vbnProductName             String?
  productName                String?
  name                       String
  characteristics            Json?
  positiveCharacteristics    Json?
  negativeCharacteristics    Json?
  qualityCode                String?
  qualityIndexClassification String?
  /// Altijd "1" zolang de scope snijbloemen is. Bewaard om die aanname te kunnen
  /// controleren in plaats van hem te moeten geloven.
  mainGroupCode              String
  productGroupName           String?
  potSizeInCm                Int?
  plantHeightInCm            Int?
  photoUrl                   String?
  topLevelMainColor          String?
  rgbMainColor               String?

  currentNumberOfPieces          Int
  numberOfPackages               Int?
  piecesPerPackage               Int?
  packagesPerLayer               Int?
  layersPerLoadcarrier           Int?
  numberOfLoadCarriers           Int?
  numberOfPackagesPerLoadCarrier Int?
  packageTypeCode                String?
  packageTypeName                String?
  loadCarrierCode                String?
  sequenceOnLoadCarrier          Int?

  preSaleInitialNumberOfPieces Int?
  preSaleCurrentNumberOfPieces Int?
  preSalePriceValue            Decimal? @db.Decimal(12, 4)
  preSalePriceCurrency         String?  @db.VarChar(3)

  /// Tekst, geen AuctionLocation-enum. De records dragen "Naaldwijk", de filtersleutel
  /// is "NAALDWIJK" (spec §3.6b). Een enum zou op een nieuwe of anders geschreven
  /// locatie de hele pagina laten mislukken; hier is doorschrijven het juiste gedrag.
  auctionLocation              String
  clockShortName               String?
  auctioningSequence           Int?
  isAuctioned                  Boolean  @default(false)
  digitalAuctionSupplyType     String?
  deliveryFormBarcode          String?
  lastCommercialMutationMoment DateTime? @db.Timestamptz

  /// Staat bij alle gemeten records op false. De echte marker voor staging-testdata is
  /// een reference die met "synth_" begint (spec §3.2). Bewaard om te zien of dat ooit
  /// verandert.
  isFromSyntheticRequest Boolean @default(false)

  firstSeenAt DateTime @db.Timestamptz
  lastSeenAt  DateTime @db.Timestamptz

  versions ClockSupplyLineVersion[]

  @@index([auctionDate, auctionLocation])
  @@index([clockPresalesSupplyLineId])
  @@index([supplierOrganizationId])
  @@index([name])
}

/// Append-only archief. Krijgt een rij zodra er inhoudelijk iets verandert; nooit
/// wanneer alleen lastSeenAt opschuift. Zie changed-lines.ts voor wat meetelt.
model ClockSupplyLineVersion {
  id                BigInt   @id @default(autoincrement())
  clockSupplyLineId String   @db.Uuid
  observedAt        DateTime @db.Timestamptz

  reference                 String
  auctionDate               DateTime @db.Date
  clockPresalesSupplyLineId String?  @db.Uuid

  supplierOrganizationId String   @db.Uuid
  supplierName           String?
  supplierRelationNumber String?
  supplierLogoUrl        String?
  supplierCertificates   String[]

  productCode                String?
  vbnProductName             String?
  productName                String?
  name                       String
  characteristics            Json?
  positiveCharacteristics    Json?
  negativeCharacteristics    Json?
  qualityCode                String?
  qualityIndexClassification String?
  mainGroupCode              String
  productGroupName           String?
  potSizeInCm                Int?
  plantHeightInCm            Int?
  photoUrl                   String?
  topLevelMainColor          String?
  rgbMainColor               String?

  currentNumberOfPieces          Int
  numberOfPackages               Int?
  piecesPerPackage               Int?
  packagesPerLayer               Int?
  layersPerLoadcarrier           Int?
  numberOfLoadCarriers           Int?
  numberOfPackagesPerLoadCarrier Int?
  packageTypeCode                String?
  packageTypeName                String?
  loadCarrierCode                String?
  sequenceOnLoadCarrier          Int?

  preSaleInitialNumberOfPieces Int?
  preSaleCurrentNumberOfPieces Int?
  preSalePriceValue            Decimal? @db.Decimal(12, 4)
  preSalePriceCurrency         String?  @db.VarChar(3)

  auctionLocation              String
  clockShortName               String?
  auctioningSequence           Int?
  isAuctioned                  Boolean
  digitalAuctionSupplyType     String?
  deliveryFormBarcode          String?
  lastCommercialMutationMoment DateTime? @db.Timestamptz
  isFromSyntheticRequest       Boolean

  clockSupplyLine ClockSupplyLine @relation(fields: [clockSupplyLineId], references: [clockSupplyLineId])

  /// Geen sequenceNumber om op te ontdubbelen zoals SupplyLineVersion dat heeft; deze
  /// bron levert er geen. observedAt is per run constant, dus dit voorkomt dat dezelfde
  /// run twee versies van dezelfde regel wegschrijft.
  ///
  /// Eén constraint, geen twee. SupplyLineVersion draagt naast zijn unique key ook een
  /// losse index op [supplyLineId, observedAt], maar daar staat de unique op
  /// sequenceNumber en zijn het dus verschillende kolommen. Hier zouden ze identiek zijn:
  /// Postgres legt onder een unique al een B-tree aan, en het leftmost prefix bedient
  /// "alle versies van deze regel" net zo goed. Een tweede index kost alleen schrijfwerk.
  @@unique([clockSupplyLineId, observedAt])
}

/// Eén rij. Draagt de refresh token voor RFH Pre-Auction.
///
/// In de database en niet in een omgevingsvariabele omdat de token bij elk gebruik
/// rouleert (spec §4): een cronrun op Vercel kan geen env-var terugschrijven, dus daar
/// zou de sessie na het eerste gebruik dood zijn.
model RfhSession {
  id              String    @id @default("default")
  refreshToken    String
  lastRefreshedAt DateTime? @db.Timestamptz
  lastError       String?
  updatedAt       DateTime  @updatedAt @db.Timestamptz
}
```

- [ ] **Stap 2: Bekijk de DDL voordat je hem uitvoert**

Run: `npm run db:push:dry`
Expected: `CREATE TABLE "ClockSupplyLine"`, `CREATE TABLE "ClockSupplyLineVersion"` en `CREATE TABLE "RfhSession"`, plus de indexen. Géén `DROP` of `ALTER` op `SupplyLine`, `SupplyLineVersion`, `TradeItem`, `Organization`, `User` of `SyncRun`. Staat daar wel iets destructiefs: stop en zoek uit waarom.

- [ ] **Stap 3: Pas het schema toe**

Run: `npm run db:push`
Expected: het script drukt eerst af welk `.env`-bestand het leest en tegen welke databasehost het gaat werken. Controleer dat dat de testomgeving is voordat je doorgaat.

- [ ] **Stap 4: Genereer de client en controleer dat het compileert**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: geen fouten.

- [ ] **Stap 5: Commit**

```bash
git add prisma/schema.prisma prisma/applied.prisma
git commit -m "feat: add clock supply, version archive and RFH session tables"
```

---

## Taak 2: Omgevingsvariabelen

Voert spec §4 uit, en volgt het patroon van `getFloridayEnv()`: ontbrekende gegevens mogen de synchronisatie blokkeren, niet het inloggen.

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.example`
- Test: `tests/unit/env.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

Voeg toe aan `tests/unit/env.test.ts`:

```ts
describe("getRfhEnv", () => {
  it("throws a readable error when the RFH variables are missing", () => {
    delete process.env.RFH_PREAUCTION_API_BASE_URL;
    delete process.env.RFH_PREAUCTION_TOKEN_URL;
    delete process.env.RFH_PREAUCTION_CLIENT_ID;

    expect(() => getRfhEnv()).toThrow(/RFH Pre-Auction is niet volledig geconfigureerd/);
  });

  it("returns the three values when they are all present", () => {
    process.env.RFH_PREAUCTION_API_BASE_URL = "https://pre-auction-api.staging.rfh-auction.com/v16.0";
    process.env.RFH_PREAUCTION_TOKEN_URL =
      "https://idm.staging.floriday.io/oauth2/aus1w6civoyW4EdjE0h8/v1/token";
    process.env.RFH_PREAUCTION_CLIENT_ID = "0oa19yrfd96Maphyz0h8";

    expect(getRfhEnv()).toEqual({
      RFH_PREAUCTION_API_BASE_URL: "https://pre-auction-api.staging.rfh-auction.com/v16.0",
      RFH_PREAUCTION_TOKEN_URL:
        "https://idm.staging.floriday.io/oauth2/aus1w6civoyW4EdjE0h8/v1/token",
      RFH_PREAUCTION_CLIENT_ID: "0oa19yrfd96Maphyz0h8",
    });
  });

  // Het realistische faalgeval is niet "alles leeg" maar "half overgenomen uit
  // .env.example". Dan moet de melding zeggen wélk veld ontbreekt, anders sta je te
  // zoeken. De Floriday-tests dekken dit al; deze twee trekken dat gelijk.
  it("names the field that is missing", () => {
    process.env.RFH_PREAUCTION_API_BASE_URL = "https://pre-auction-api.staging.rfh-auction.com/v16.0";
    process.env.RFH_PREAUCTION_TOKEN_URL =
      "https://idm.staging.floriday.io/oauth2/aus1w6civoyW4EdjE0h8/v1/token";
    delete process.env.RFH_PREAUCTION_CLIENT_ID;

    expect(() => getRfhEnv()).toThrow(/RFH_PREAUCTION_CLIENT_ID/);
  });

  it("says the rest of the application still works", () => {
    delete process.env.RFH_PREAUCTION_CLIENT_ID;

    expect(() => getRfhEnv()).toThrow(/rest van de applicatie werkt wel/);
  });
});
```

Beide tests volgen de vorm die het bestand al voor `getFloridayEnv` gebruikt, inclusief het
bewaren en terugzetten van `process.env`. Kijk hoe dat blok het doet en sluit erop aan in
plaats van een eigen mechanisme te bedenken.

Voeg `getRfhEnv` toe aan de bestaande import bovenaan het bestand.

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/env.test.ts`
Expected: FAIL, `getRfhEnv is not a function` of een importfout.

- [ ] **Stap 3: Voeg de variabelen en de leesfunctie toe**

In `src/lib/env.ts`, binnen `envSchema`, direct onder de `FLORIDAY_*`-regels:

```ts
  // RFH Pre-Auction. Zelfde afweging als bij Floriday hierboven: optioneel in het brede
  // schema, streng gecontroleerd door getRfhEnv() vlak voor een verzoek. De refresh token
  // staat hier bewust niet tussen - die woont in RfhSession, omdat hij rouleert.
  RFH_PREAUCTION_API_BASE_URL: z.string().url().optional(),
  RFH_PREAUCTION_TOKEN_URL: z.string().url().optional(),
  RFH_PREAUCTION_CLIENT_ID: z.string().optional(),
```

Onderaan het bestand:

```ts
const rfhSchema = z.object({
  RFH_PREAUCTION_API_BASE_URL: z.string().url(),
  RFH_PREAUCTION_TOKEN_URL: z.string().url(),
  RFH_PREAUCTION_CLIENT_ID: z.string().min(1),
});

export type RfhEnv = z.infer<typeof rfhSchema>;

/**
 * De RFH Pre-Auction-gegevens, streng gecontroleerd.
 *
 * Let op: dit zijn alleen de vaste gegevens. De sessie zelf - de refresh token - staat in
 * RfhSession en wordt door session-store.ts gelezen. Een omgeving die deze drie wel heeft
 * maar nog nooit gekoppeld is, komt dus tot hier en faalt daarna op een leesbare manier in
 * de sessielaag; dat is precies het onderscheid dat we willen kunnen zien.
 */
export function getRfhEnv(): RfhEnv {
  const parsed = rfhSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(
      `RFH Pre-Auction is niet volledig geconfigureerd: ${details}. ` +
        "Zonder deze gegevens kan het klokaanbod niet opgehaald worden; " +
        "de rest van de applicatie werkt wel.",
    );
  }
  return parsed.data;
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/env.test.ts`
Expected: PASS.

- [ ] **Stap 5: Documenteer de variabelen**

Voeg onderaan `.env.example` toe:

```
# RFH Pre-Auction - het volledige klokaanbod. Staging.
RFH_PREAUCTION_API_BASE_URL=https://pre-auction-api.staging.rfh-auction.com/v16.0
RFH_PREAUCTION_TOKEN_URL=https://idm.staging.floriday.io/oauth2/aus1w6civoyW4EdjE0h8/v1/token
RFH_PREAUCTION_CLIENT_ID=0oa19yrfd96Maphyz0h8

# RFH Pre-Auction production (not in use yet)
# RFH_PREAUCTION_API_BASE_URL=https://pre-auction-api.rfh-auction.com/v16.0
# RFH_PREAUCTION_TOKEN_URL=https://idm.floriday.io/oauth2/ausbh16jzskq0dsN50i7/v1/token
# RFH_PREAUCTION_CLIENT_ID=0oa88yyomvXp9o3Fp0i7
```

Volledig uitgeschreven en uitgecommentarieerd, niet als prozacomment. Het bestand doet dat
voor Floriday al zo, en het scheelt dat iemand bij de overstap naar productie een pad als
`/v1/token` uit zijn hoofd moet reconstrueren.

- [ ] **Stap 6: Commit**

```bash
git add src/lib/env.ts .env.example tests/unit/env.test.ts
git commit -m "feat: read RFH Pre-Auction configuration from the environment"
```

---

## Taak 3: De refresh-grant

Voert spec §4 uit. Eén functie, geen opslag, geen cache — zodat hij met een neptfetch te testen is.

**Files:**
- Create: `src/features/rfh-preauction/client/token-request.ts`
- Test: `tests/unit/rfh-preauction/token-request.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it, vi } from "vitest";
import { requestAccessToken } from "@/features/rfh-preauction/client/token-request";

const OPTIES = {
  tokenUrl: "https://idm.example.test/oauth2/abc/v1/token",
  clientId: "client-123",
  refreshToken: "oude-token",
};

describe("requestAccessToken", () => {
  it("exchanges the refresh token and returns the rotated one", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "nieuw-access",
          refresh_token: "nieuw-refresh",
          expires_in: 3600,
          token_type: "Bearer",
        }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result).toEqual({
      accessToken: "nieuw-access",
      refreshToken: "nieuw-refresh",
      expiresInSeconds: 3600,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(OPTIES.tokenUrl);
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(init?.body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("oude-token");
    expect(body.get("client_id")).toBe("client-123");
  });

  it("reports the old token as still current when the server rotates nothing", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ access_token: "a", expires_in: 3600, token_type: "Bearer" }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result.refreshToken).toBe("oude-token");
  });

  it("throws with the OAuth error description, without echoing the token", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "The refresh token is invalid or expired.",
        }),
        { status: 400 },
      ),
    );

    const belofte = requestAccessToken({ ...OPTIES, fetchImpl });

    await expect(belofte).rejects.toThrow(/invalid_grant.*invalid or expired/s);
    await expect(belofte).rejects.not.toThrow(/oude-token/);
  });

  it("refuses an empty access token instead of passing it on", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "", expires_in: 3600 }), { status: 200 }),
    );

    await expect(requestAccessToken({ ...OPTIES, fetchImpl })).rejects.toThrow(/200/);
  });

  it("keeps the old refresh token when the server sends an empty one", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "a", refresh_token: "", expires_in: 3600 }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result.refreshToken).toBe("oude-token");
  });

  it("reports a 200 that carries no access token at all", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
    );

    // Er is geen OAuth-foutcode in dit antwoord, dus de status neemt die plaats in.
    await expect(requestAccessToken({ ...OPTIES, fetchImpl })).rejects.toThrow(/200/);
  });

  it("quotes the response body when it is not json at all", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("<html><body>Gateway Timeout</body></html>", { status: 504 }),
    );

    // Dit is de tak waarop de beveiligingsbelofte rust: geciteerd wordt het antwoord,
    // nooit het verzoek. Een test houdt dat vast, een reviewconclusie niet.
    await expect(requestAccessToken({ ...OPTIES, fetchImpl })).rejects.toThrow(
      /invalid json.*Gateway Timeout/s,
    );
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/token-request.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
/**
 * The scopes the Pre-Auction web app itself requests, verified against a live token on
 * 6 August 2026. Asking for fewer would work for reading supply, but a token whose scopes
 * differ from the app's is a token whose behaviour we can no longer predict from what the
 * app does - and the app is our only documentation for this API.
 */
const SCOPES = ["role:customer", "openid", "offline_access", "role:app", "profile"];

/**
 * A length check, not just a type check.
 *
 * `""` is a string, so `typeof x === "string"` would wave an empty refresh token through
 * and the caller would store it. Okta rotates on every use and cannot re-mint from code,
 * so a stored empty token means the session is gone until a human logs in through a
 * browser. That is too expensive an outcome to leave to a type check.
 */
function nietLeegOfNull(waarde: unknown): string | null {
  return typeof waarde === "string" && waarde.length > 0 ? waarde : null;
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

  const text = await response.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `RFH token request returned invalid json: ${response.status} ${text.slice(0, 200)}`,
    );
  }

  const accessToken = nietLeegOfNull(payload.access_token);

  if (!response.ok || accessToken === null) {
    // Never include the request body in this message: it carries the refresh token, and
    // this error ends up in RfhSession.lastError and on the status page.
    const error = typeof payload.error === "string" ? payload.error : String(response.status);
    const description =
      typeof payload.error_description === "string" ? payload.error_description : text.slice(0, 200);
    throw new Error(`RFH token request failed: ${error} - ${description}`);
  }

  return {
    accessToken,
    refreshToken: nietLeegOfNull(payload.refresh_token) ?? refreshToken,
    expiresInSeconds:
      typeof payload.expires_in === "number" ? payload.expires_in : 3600,
  };
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/token-request.test.ts`
Expected: PASS, drie tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/client/token-request.ts tests/unit/rfh-preauction/token-request.test.ts
git commit -m "feat: exchange the RFH refresh token for an access token"
```

---

## Taak 4: De sessie-opslag

Voert spec §4 uit, de regels "in de database" en "één schrijver".

**Files:**
- Create: `src/features/rfh-preauction/client/session-store.ts`
- Test: `tests/integration/rfh-preauction/session-store.test.ts`

- [ ] **Stap 1: Schrijf de falende integratietest**

Deze test raakt Neon, net als `tests/integration/cursor.test.ts`.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  leesSessie,
  schrijfSessie,
  vernieuwOnderSlot,
} from "@/features/rfh-preauction/client/session-store";

// RfhSession heeft één rij met een vaste id, dus er is geen testvoorvoegsel te bedenken
// zoals tests/helpers/test-ids.ts dat voor de archieftabellen doet: de rij die deze test
// aanmaakt ís de rij die npm run rfh-koppel aanmaakt. Zonder deze bewaar-en-herstel wist
// de eerstvolgende npm test de echte koppeling, en die is niet terug te zetten - de
// refresh token is in de browser eenmalig zichtbaar. Dit project heeft dat patroon al
// eens data gekost.
let bestaande: { refreshToken: string; lastRefreshedAt: Date | null; lastError: string | null } | null =
  null;

beforeAll(async () => {
  const rij = await prisma.rfhSession.findUnique({ where: { id: "default" } });
  bestaande = rij
    ? { refreshToken: rij.refreshToken, lastRefreshedAt: rij.lastRefreshedAt, lastError: rij.lastError }
    : null;
});

afterEach(async () => {
  await prisma.rfhSession.deleteMany({});
});

afterAll(async () => {
  if (bestaande) {
    await prisma.rfhSession.create({ data: { id: "default", ...bestaande } });
  }
});

describe("session-store", () => {
  it("returns null when no session has been set up yet", async () => {
    expect(await leesSessie()).toBeNull();
  });

  it("stores and reads back a refresh token", async () => {
    await schrijfSessie("token-een");
    expect((await leesSessie())?.refreshToken).toBe("token-een");

    await schrijfSessie("token-twee");
    expect((await leesSessie())?.refreshToken).toBe("token-twee");
  });

  it("hands the current token to the work and persists the rotated one", async () => {
    await schrijfSessie("token-een");

    const uitkomst = await vernieuwOnderSlot(async (huidige) => {
      expect(huidige).toBe("token-een");
      return { nieuweRefreshToken: "token-geroteerd", waarde: "klaar" };
    });

    expect(uitkomst).toBe("klaar");
    const sessie = await leesSessie();
    expect(sessie?.refreshToken).toBe("token-geroteerd");
    expect(sessie?.lastError).toBeNull();
    expect(sessie?.lastRefreshedAt).not.toBeNull();
  });

  it("records the failure and leaves the token untouched when the work throws", async () => {
    await schrijfSessie("token-een");

    await expect(
      vernieuwOnderSlot(async () => {
        throw new Error("invalid_grant - verlopen");
      }),
    ).rejects.toThrow(/invalid_grant/);

    const sessie = await leesSessie();
    expect(sessie?.refreshToken).toBe("token-een");
    expect(sessie?.lastError).toMatch(/invalid_grant/);
  });

  it("refuses to run when no session exists", async () => {
    await expect(vernieuwOnderSlot(async () => ({ nieuweRefreshToken: "x", waarde: 1 })))
      .rejects.toThrow(/nog niet gekoppeld/);
  });

  // De vijf tests hierboven slagen allemaal even hard als je de regel met
  // pg_advisory_xact_lock weghaalt. Voor een bestand waarvan het commentaar zegt dat het
  // slot de reden van bestaan is, hoort er één test te staan die dat ook werkelijk vast-
  // houdt. Controleer bij het schrijven dat hij faalt zonder die regel.
  it("serialises two concurrent refreshes instead of letting them overlap", async () => {
    await schrijfSessie("token-een");

    const gebeurtenissen: string[] = [];

    const loop = (naam: string, wacht: number) =>
      vernieuwOnderSlot(async (huidige) => {
        gebeurtenissen.push(`${naam}-start-${huidige}`);
        await new Promise((klaar) => setTimeout(klaar, wacht));
        gebeurtenissen.push(`${naam}-klaar`);
        return { nieuweRefreshToken: `na-${naam}`, waarde: naam };
      });

    // A pakt het slot en blijft 500 ms hangen; B start een kwart seconde later, zodat de
    // volgorde vastligt en de test niet twee uitkomsten hoeft toe te staan. Ruim genomen,
    // want B moet zijn transactie kunnen openen over een WebSocket naar Neon en door
    // PgBouncer heen, en dat is op een koude verbinding geen vaste tijd. Dit is de enige
    // tijdsaanname in het bestand.
    await Promise.all([loop("a", 500), vertraagd(250, () => loop("b", 0))]);

    // Twee beweringen, en de tweede is de scherpe. Dat de gebeurtenissen niet vervlechten
    // toont aan dát er geserialiseerd wordt. Maar serialiseren alleen zou nog steeds twee
    // keer dezelfde token kunnen oppakken - dat B de dóór A geroteerde waarde leest, is de
    // eigenschap die de sessie redt.
    expect(gebeurtenissen).toEqual(["a-start", "a-klaar", "b-start", "b-klaar"]);
    expect(gezienDoorB).toBe("na-a");
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/integration/rfh-preauction/session-store.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import { prisma } from "@/lib/db";

/** One row, always. The default matches RfhSession.id's default in the schema. */
const SESSIE_ID = "default";

/**
 * Fixed key for pg_advisory_xact_lock. Arbitrary but stable: any two processes that want
 * to rotate the refresh token must pick the same number, and changing it later would
 * silently disable the mutual exclusion rather than fail loudly.
 */
const SLOT_SLEUTEL = 8140711;

export interface RfhSessie {
  refreshToken: string;
  lastRefreshedAt: Date | null;
  lastError: string | null;
}

export async function leesSessie(): Promise<RfhSessie | null> {
  const rij = await prisma.rfhSession.findUnique({ where: { id: SESSIE_ID } });
  if (!rij) return null;
  return {
    refreshToken: rij.refreshToken,
    lastRefreshedAt: rij.lastRefreshedAt,
    lastError: rij.lastError,
  };
}

/** Used by scripts/rfh-koppel.ts to seed or replace the session by hand. */
export async function schrijfSessie(refreshToken: string): Promise<void> {
  await prisma.rfhSession.upsert({
    where: { id: SESSIE_ID },
    create: { id: SESSIE_ID, refreshToken, lastError: null },
    update: { refreshToken, lastError: null },
  });
}

export interface VernieuwResultaat<T> {
  nieuweRefreshToken: string;
  waarde: T;
}

/**
 * Runs `werk` with the current refresh token and persists whatever it hands back, with a
 * transaction-scoped advisory lock held for the whole exchange.
 *
 * The lock is the point of this function. Okta rotates the refresh token on every use, so
 * two concurrent refreshes do not merely duplicate work: the second one presents a token
 * the first has already spent, Okta rejects it, and the session is dead until a human
 * logs in again. The cron route already refuses to start overlapping runs, but that guard
 * lives one layer up and does not cover a script running alongside a cron.
 *
 * On failure the stored bytes are left as they were and the reason is recorded, so the
 * status page can tell "never coupled" apart from "coupling expired".
 *
 * "As they were" is not the same as "still usable", and the difference is worth knowing.
 * If Okta has already rotated and the transaction then fails to commit - a slow round
 * trip against the timeout, a dropped connection - the row keeps a token that is dead on
 * Okta's side. No design avoids that window entirely without a two-phase protocol; the
 * lock and a generous timeout make it small. The recovery is the same as for any dead
 * session: couple again.
 */
export async function vernieuwOnderSlot<T>(
  werk: (huidigeRefreshToken: string) => Promise<VernieuwResultaat<T>>,
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SLOT_SLEUTEL})`;

        const rij = await tx.rfhSession.findUnique({ where: { id: SESSIE_ID } });
        if (!rij) {
          throw new Error(
            "RFH Pre-Auction is nog niet gekoppeld. Draai `npm run rfh-koppel` met een " +
              "verse refresh token uit een privévenster.",
          );
        }

        const uitkomst = await werk(rij.refreshToken);

        await tx.rfhSession.update({
          where: { id: SESSIE_ID },
          data: {
            refreshToken: uitkomst.nieuweRefreshToken,
            lastRefreshedAt: new Date(),
            lastError: null,
          },
        });

        return uitkomst.waarde;
      },
      // Ruim genomen. Dit budget dekt het wachten op het slot, de gang naar Okta én de
      // commit; loopt het over, dan rolt Prisma terug terwijl Okta mogelijk al geroteerd
      // heeft. De cron-route die dit aanroept staat op maxDuration 300, dus krap zetten
      // levert niets op en vergroot alleen dat venster.
      { timeout: 45_000 },
    );
  } catch (error: unknown) {
    // The note has to be written outside the transaction, and this is not a style choice.
    // Throwing inside the callback rolls the transaction back, so a note written in there
    // would vanish along with everything else - which is exactly what we want for the
    // token (it must stay untouched on failure) and exactly what we do not want for the
    // reason it failed. The rollback is the mechanism that protects the token; this catch
    // is what survives it.
    //
    // Best effort: if the database itself is what broke, a failure to record the note must
    // not replace the original, more informative error.
    const bericht = error instanceof Error ? error.message : String(error);
    try {
      await prisma.rfhSession.updateMany({
        where: { id: SESSIE_ID },
        data: { lastError: bericht },
      });
    } catch {
      // niets - de oorspronkelijke fout is belangrijker
    }
    throw error;
  }
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/integration/rfh-preauction/session-store.test.ts`
Expected: PASS, vijf tests.

De vierde test is de scherpste van de vijf en verdient aandacht bij het schrijven. Hij eist
twee dingen tegelijk die uit elkaar getrokken moeten worden: de token blijft ongemoeid
(dat regelt de rollback) én de reden staat genoteerd (dat overleeft de rollback juist
niet). Vandaar dat de notitie buiten de transactie hoort. Zie de comment in de
implementatie.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/client/session-store.ts tests/integration/rfh-preauction/session-store.test.ts
git commit -m "feat: store the rotating RFH refresh token behind an advisory lock"
```

---

## Taak 5: De tokenvoorziening

Combineert taak 3 en 4 achter de `TokenCache`-vorm die de HTTP-laag al kent.

**Files:**
- Create: `src/features/rfh-preauction/client/token-provider.ts`
- Test: `tests/unit/rfh-preauction/token-provider.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createRfhTokenProvider } from "@/features/rfh-preauction/client/token-provider";

describe("createRfhTokenProvider", () => {
  it("refreshes once and reuses the token until it nears expiry", async () => {
    const vernieuw = vi.fn(async () => ({ accessToken: "a1", expiresInSeconds: 3600 }));
    let nu = 0;
    const provider = createRfhTokenProvider({ vernieuw, now: () => nu });

    expect(await provider.getToken()).toBe("a1");
    nu = 3_000_000;
    expect(await provider.getToken()).toBe("a1");
    expect(vernieuw).toHaveBeenCalledTimes(1);
  });

  it("refreshes again once the safety margin is gone", async () => {
    let n = 0;
    const vernieuw = vi.fn(async () => ({ accessToken: `a${++n}`, expiresInSeconds: 3600 }));
    let nu = 0;
    const provider = createRfhTokenProvider({ vernieuw, now: () => nu });

    expect(await provider.getToken()).toBe("a1");
    nu = 3_600_000;
    expect(await provider.getToken()).toBe("a2");
  });

  it("collapses concurrent callers onto one refresh", async () => {
    const vernieuw = vi.fn(async () => ({ accessToken: "a1", expiresInSeconds: 3600 }));
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    const [een, twee] = await Promise.all([provider.getToken(), provider.getToken()]);

    expect(een).toBe("a1");
    expect(twee).toBe("a1");
    expect(vernieuw).toHaveBeenCalledTimes(1);
  });

  it("refreshes again after invalidate", async () => {
    let n = 0;
    const vernieuw = vi.fn(async () => ({ accessToken: `a${++n}`, expiresInSeconds: 3600 }));
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    expect(await provider.getToken()).toBe("a1");
    provider.invalidate();
    expect(await provider.getToken()).toBe("a2");
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/token-provider.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
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
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/token-provider.test.ts`
Expected: PASS, vier tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/client/token-provider.ts tests/unit/rfh-preauction/token-provider.test.ts
git commit -m "feat: cache the RFH access token across a run"
```

---

## Taak 6: De HTTP-laag

Spiegelt `src/features/floriday/client/http.ts`, maar voor POST met een JSON-body.

**Files:**
- Create: `src/features/rfh-preauction/client/http.ts`
- Test: `tests/unit/rfh-preauction/http.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createPreauctionHttp } from "@/features/rfh-preauction/client/http";

function tokenCacheStub(tokens: string[] = ["t1"]) {
  let i = 0;
  return {
    getToken: vi.fn(async () => tokens[Math.min(i, tokens.length - 1)]),
    invalidate: vi.fn(() => { i++; }),
  };
}

const geenPauze = async () => {};

describe("createPreauctionHttp", () => {
  it("posts the body as json with a bearer token", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: geenPauze,
    });

    const uit = await http.postJson<{ ok: boolean }>("/clock-supply-search", { take: 1 });

    expect(uit).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.test/v16.0/clock-supply-search");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer t1");
    expect(JSON.parse(init?.body as string)).toEqual({ take: 1 });
  });

  it("retries once with a fresh token after a 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const cache = tokenCacheStub(["t1", "t2"]);
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: cache,
      fetchImpl,
      sleep: geenPauze,
    });

    await http.postJson("/clock-supply-search", {});

    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries a 503 and gives up after maxAttempts", async () => {
    const fetchImpl = vi.fn(async () => new Response("stuk", { status: 503 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: geenPauze,
      maxAttempts: 3,
    });

    await expect(http.postJson("/clock-supply-search", {})).rejects.toThrow(/after 3 attempts/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 403", async () => {
    const fetchImpl = vi.fn(async () => new Response("verboden", { status: 403 }));
    const http = createPreauctionHttp({
      baseUrl: "https://api.test/v16.0",
      tokenCache: tokenCacheStub(),
      fetchImpl,
      sleep: geenPauze,
    });

    await expect(http.postJson("/clock-supply-search", {})).rejects.toThrow(/403/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/http.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import type { TokenCache } from "@/features/floriday/client/token-cache";

export interface PreauctionHttp {
  postJson<T>(path: string, body: unknown): Promise<T>;
}

export interface PreauctionHttpOptions {
  baseUrl: string;
  tokenCache: TokenCache;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The same shape as the Floriday client's getJson, for the same reasons: bounded retries on
 * transient failures, exactly one retry on a stale token, and no retry at all on a status
 * that retrying cannot fix.
 *
 * No rate limiter here. Floriday publishes 3.4 requests per second and we honour it; RFH
 * publishes nothing, and one sync run of this feed is a few dozen requests spread over
 * seconds - well under what the web app itself produces when a buyer scrolls a filter list.
 * Add one the moment that stops being true.
 */
export function createPreauctionHttp(options: PreauctionHttpOptions): PreauctionHttp {
  const {
    baseUrl,
    tokenCache,
    fetchImpl = fetch,
    maxAttempts = 5,
    sleep = defaultSleep,
  } = options;

  async function describe(response: Response): Promise<string> {
    const body = await response.text();
    return `${response.status} ${body.slice(0, 300)}`;
  }

  async function postJson<T>(path: string, body: unknown): Promise<T> {
    let refreshedToken = false;
    let lastFailure: Response | null = null;
    let lastNetworkError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const token = await tokenCache.getToken();

      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Language-Code": "nl",
          },
          body: JSON.stringify(body),
        });
      } catch (error: unknown) {
        lastNetworkError = error instanceof Error ? error.message : String(error);
        lastFailure = null;
        if (attempt < maxAttempts) {
          await sleep(Math.min(2 ** (attempt - 1) * 500, 8000));
          continue;
        }
        break;
      }

      lastNetworkError = null;

      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(
            `RFH returned invalid json: POST ${path} -> ${text.slice(0, 300)}`,
          );
        }
      }

      if (response.status === 401 && !refreshedToken) {
        tokenCache.invalidate();
        refreshedToken = true;
        continue;
      }

      if (!RETRYABLE_STATUSES.has(response.status)) {
        throw new Error(`RFH request failed: POST ${path} -> ${await describe(response)}`);
      }

      lastFailure = response;

      if (attempt < maxAttempts) {
        await sleep(Math.min(2 ** (attempt - 1) * 500, 8000));
      }
    }

    const detail = lastFailure
      ? await describe(lastFailure)
      : (lastNetworkError ?? "no response");
    throw new Error(
      `RFH request failed after ${maxAttempts} attempts: POST ${path} -> ${detail}`,
    );
  }

  return { postJson };
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/http.test.ts`
Expected: PASS, vier tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/client/http.ts tests/unit/rfh-preauction/http.test.ts
git commit -m "feat: add the RFH Pre-Auction http client"
```

---

## Taak 7: De typeproef

Voordat er een Zod-schema komt. De veldtypen in taak 8 zijn afgeleid uit één waargenomen record; dit script meet ze over honderden records en meerdere veildagen, zodat het schema op meting rust in plaats van op een steekproef van één.

**Files:**
- Create: `scripts/rfh-typeproef.ts`
- Modify: `package.json`

- [ ] **Stap 1: Schrijf het script**

```ts
/**
 * Measures the actual field types in clock-supply-search responses.
 *
 * Exists because the Zod schema in schemas/clock-supply.ts was first drafted from a single
 * observed record. A schema that guesses wrong fails at the worst moment - mid-run, on
 * production, on a field nobody looked at. Run this before trusting it, and after every
 * version bump of the API.
 *
 * Usage: npm run rfh-typeproef -- --dagen 20260806,20260807
 */
import "../src/lib/load-env";
import { createPreauctionClient } from "../src/features/rfh-preauction/client";
import { SNIJBLOEMEN_HOOFDGROEP, VEILLOCATIE_SLEUTELS } from "../src/features/rfh-preauction/sync/sneden";

function typeVan(waarde: unknown): string {
  if (waarde === null) return "null";
  if (Array.isArray(waarde)) {
    const binnen = [...new Set(waarde.map(typeVan))].sort();
    return `array<${binnen.join("|") || "leeg"}>`;
  }
  return typeof waarde;
}

async function main(): Promise<void> {
  const arg = process.argv.indexOf("--dagen");
  const dagen = arg === -1 ? ["20260807"] : process.argv[arg + 1].split(",");

  const client = createPreauctionClient();
  const gezien = new Map<string, Set<string>>();
  let records = 0;

  for (const dag of dagen) {
    for (const locatie of VEILLOCATIE_SLEUTELS) {
      const pagina = await client.zoekKlokaanbod({
        auctionDate: dag,
        mainGroupKey: SNIJBLOEMEN_HOOFDGROEP,
        auctionLocationKey: locatie,
        skip: 0,
        take: 500,
      });

      for (const record of pagina.results as Record<string, unknown>[]) {
        records++;
        for (const [veld, waarde] of Object.entries(record)) {
          if (!gezien.has(veld)) gezien.set(veld, new Set());
          gezien.get(veld)!.add(typeVan(waarde));
        }
      }
      console.log(`${dag} ${locatie}: ${pagina.results.length} van ${pagina.totalDocuments}`);
    }
  }

  console.log(`\n${records} records, ${gezien.size} velden\n`);
  for (const veld of [...gezien.keys()].sort()) {
    const typen = [...gezien.get(veld)!].sort().join(" | ");
    console.log(`${veld.padEnd(34)} ${typen}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Stap 2: Voeg het commando toe**

In `package.json`, bij `scripts`:

```json
    "rfh-typeproef": "tsx scripts/rfh-typeproef.ts",
```

- [ ] **Stap 3: Commit**

Het script kan pas draaien na taak 8 en 9; het staat hier omdat de uitkomst het schema stuurt.

```bash
git add scripts/rfh-typeproef.ts package.json
git commit -m "feat: add a script that measures the real clock supply field types"
```

---

## Taak 8: Sneden en veildagen

Voert spec §5 en §6 uit.

**Files:**
- Create: `src/features/rfh-preauction/sync/veildagen.ts`
- Create: `src/features/rfh-preauction/sync/sneden.ts`
- Test: `tests/unit/rfh-preauction/veildagen.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from "vitest";
import {
  veildagSleutel,
  veildagenVoorRun,
  sleutelNaarDatum,
} from "@/features/rfh-preauction/sync/veildagen";

describe("veildagSleutel", () => {
  it("uses the Amsterdam date, not the UTC one", () => {
    // 22:30 UTC on 6 August is 00:30 on 7 August in Amsterdam (CEST, UTC+2).
    expect(veildagSleutel(new Date("2026-08-06T22:30:00.000Z"))).toBe("20260807");
  });

  it("still uses the Amsterdam date in winter", () => {
    // 23:30 UTC on 6 January is 00:30 on 7 January in Amsterdam (CET, UTC+1).
    expect(veildagSleutel(new Date("2026-01-06T23:30:00.000Z"))).toBe("20260107");
  });

  it("agrees with UTC in the middle of the day", () => {
    expect(veildagSleutel(new Date("2026-08-06T12:00:00.000Z"))).toBe("20260806");
  });
});

describe("veildagenVoorRun", () => {
  it("returns yesterday, today and the two days ahead", () => {
    expect(veildagenVoorRun(new Date("2026-08-06T12:00:00.000Z"))).toEqual([
      "20260805",
      "20260806",
      "20260807",
      "20260808",
    ]);
  });

  it("rolls over the month boundary", () => {
    expect(veildagenVoorRun(new Date("2026-07-31T12:00:00.000Z"))).toEqual([
      "20260730",
      "20260731",
      "20260801",
      "20260802",
    ]);
  });

  it("crosses the end of daylight saving without losing or repeating a day", () => {
    // Clocks go back on 25 October 2026.
    expect(veildagenVoorRun(new Date("2026-10-25T12:00:00.000Z"))).toEqual([
      "20261024",
      "20261025",
      "20261026",
      "20261027",
    ]);
  });
});

describe("sleutelNaarDatum", () => {
  it("maps a key to midnight UTC, matching how auctionDate is stored", () => {
    expect(sleutelNaarDatum("20260807").toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/veildagen.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf veildagen.ts**

```ts
/**
 * The auction day, as RFH names it: YYYYMMDD in Dutch local time.
 *
 * This is not a formatting detail. Between midnight and 02:00 in summer, the UTC date is
 * still yesterday - and those are exactly the hours in which the next auction day's supply
 * fills up. Computing the day in UTC would make the sync fetch the wrong day every night,
 * silently, and only for the window that matters most.
 */
const AMSTERDAM = "Europe/Amsterdam";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: AMSTERDAM,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function veildagSleutel(moment: Date): string {
  // en-CA formats as YYYY-MM-DD, which is the only locale-stable way to get ISO order out
  // of Intl without assembling the parts by hand.
  return formatter.format(moment).replaceAll("-", "");
}

/** Turns "20260807" into the Date stored in auctionDate: midnight UTC on that calendar day. */
export function sleutelNaarDatum(sleutel: string): Date {
  const jaar = sleutel.slice(0, 4);
  const maand = sleutel.slice(4, 6);
  const dag = sleutel.slice(6, 8);
  return new Date(`${jaar}-${maand}-${dag}T00:00:00.000Z`);
}

/**
 * Which auction days one run covers: yesterday for the closing state, today, and two days
 * ahead because that is as far as supply is created (spec §3.5).
 *
 * Days are stepped from an anchor at 12:00 UTC rather than from `moment` itself. Adding
 * 24 hours to an arbitrary instant shifts local time by an hour across a DST boundary, and
 * near midnight that lands on the wrong calendar day. At midday there is no boundary close
 * enough for an hour to matter.
 */
export function veildagenVoorRun(moment: Date, terug = 1, vooruit = 2): string[] {
  const vandaag = veildagSleutel(moment);
  const anker = new Date(
    `${vandaag.slice(0, 4)}-${vandaag.slice(4, 6)}-${vandaag.slice(6, 8)}T12:00:00.000Z`,
  );

  const dagen: string[] = [];
  for (let offset = -terug; offset <= vooruit; offset++) {
    dagen.push(veildagSleutel(new Date(anker.getTime() + offset * 86_400_000)));
  }
  return dagen;
}
```

- [ ] **Stap 4: Schrijf sneden.ts**

```ts
/**
 * The scope, as a filter value. "1" is (Snij)bloemen; "2" is Kamerplanten and "3" is
 * Tuinplanten, both deliberately out of scope (spec §1). The filter key and the record's
 * mainGroupCode are the same text.
 */
export const SNIJBLOEMEN_HOOFDGROEP = "1";

/**
 * The auction locations to slice on, hard-coded on purpose.
 *
 * The facet list in the response cannot be used for this: measured on 6 August 2026 it
 * offered only NAALDWIJK for a day that demonstrably held three locations (spec §3.6b).
 * Discovering slices from it would silently drop most of the supply.
 *
 * Uppercase, because that is what the filter takes. The record's own auctionLocation field
 * spells it "Naaldwijk" - do not compare the two without normalising.
 */
export const VEILLOCATIE_SLEUTELS = [
  "AALSMEER",
  "NAALDWIJK",
  "RIJNSBURG",
  "EELDE",
  "PLANTION",
  "RHEINMAAS",
  "DIGITAL",
] as const;

export type VeillocatieSleutel = (typeof VEILLOCATIE_SLEUTELS)[number];

export interface Snede {
  auctionDate: string;
  auctionLocationKey: VeillocatieSleutel;
}

/**
 * Every slice one run walks. Unused locations answer with zero rather than an error, so
 * asking for all seven costs six cheap requests a day and removes the need to know in
 * advance which locations are in play.
 */
export function snedenVoor(veildagen: readonly string[]): Snede[] {
  return veildagen.flatMap((auctionDate) =>
    VEILLOCATIE_SLEUTELS.map((auctionLocationKey) => ({ auctionDate, auctionLocationKey })),
  );
}
```

- [ ] **Stap 5: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/veildagen.test.ts`
Expected: PASS, zeven tests.

- [ ] **Stap 6: Commit**

```bash
git add src/features/rfh-preauction/sync/veildagen.ts src/features/rfh-preauction/sync/sneden.ts tests/unit/rfh-preauction/veildagen.test.ts
git commit -m "feat: compute auction days in Amsterdam time and enumerate the slices"
```

---

## Taak 9: Schema, client en mapper

**Files:**
- Create: `src/features/rfh-preauction/schemas/clock-supply.ts`
- Create: `src/features/rfh-preauction/client/index.ts`
- Create: `src/features/rfh-preauction/mappers/clock-supply.ts`
- Test: `tests/unit/rfh-preauction/mappers/clock-supply.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from "vitest";
import { clockSupplyPageSchema } from "@/features/rfh-preauction/schemas/clock-supply";
import { toClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

const PAYLOAD = {
  id: "0ec256ce-8fcc-442b-9039-9aeaf00a9b1f",
  reference: "9100183551655",
  organization: {
    id: "4cedfae1-b599-378d-a9ca-7fe0edfa81d1",
    name: "Raadschelders Varens",
    relationNumber: "73100",
    logoUrl: "https://image.floriday.io/44d43f9d.jpg",
    certificates: ["MPS A", "MPS GAP"],
  },
  photoUrl: "https://image.floriday.io/foto.jpg",
  productCode: "105127",
  vbnProductName: "NEPHROLEPIS",
  productName: "Nephrolepis",
  name: "NEPHRO EX BOSTONIENSIS",
  characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }],
  positiveCharacteristics: [],
  negativeCharacteristics: [],
  qualityCode: "A1",
  numberOfPackages: 3,
  currentNumberOfPieces: 36,
  packageTypeCode: "577",
  packageTypeName: "Deense kar",
  piecesPerPackage: 12,
  layersPerLoadcarrier: 4,
  packagesPerLayer: 3,
  loadCarrierCode: "DC",
  clockPresalesSupplyLineId: "c207aee2-07b6-442b-b172-22d9f3592c2e",
  preSaleInitialNumberOfPieces: 24,
  preSaleCurrentNumberOfPieces: 24,
  preSalePriceCurrency: "EUR",
  preSalePriceValue: 2,
  isFromSyntheticRequest: false,
  clockShortName: "N4",
  digitalAuctionSupplyType: null,
  topLevelMainColor: "groen",
  rgbMainColor: "#3a7d2c",
  auctionLocation: "Naaldwijk",
  auctioningSequence: 120,
  mainGroupCode: "1",
  lastCommercialMutationMoment: "2026-08-06T14:22:11.000Z",
  qualityIndexClassification: "A",
  numberOfLoadCarriers: 1,
  numberOfPackagesPerLoadCarrier: 12,
  deliveryFormBarcode: "F2DDPWA",
  sequenceOnLoadCarrier: 2,
  isAuctioned: false,
  productGroupName: "Varens",
  potSizeInCm: 12,
  plantHeightInCm: 40,
};

describe("clockSupplyPageSchema", () => {
  it("accepts a measured response", () => {
    const parsed = clockSupplyPageSchema.parse({
      results: [PAYLOAD],
      totalDocuments: 1,
      markings: [],
      filterItems: [],
    });
    expect(parsed.results).toHaveLength(1);
  });

  it("rejects a record without an id", () => {
    const zonderId = { ...PAYLOAD, id: undefined };
    expect(() =>
      clockSupplyPageSchema.parse({ results: [zonderId], totalDocuments: 1 }),
    ).toThrow();
  });
});

describe("toClockSupplyLineRow", () => {
  it("maps the payload onto the stored shape", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({ results: [PAYLOAD], totalDocuments: 1 }).results[0],
      "20260807",
    );

    expect(row.clockSupplyLineId).toBe("0ec256ce-8fcc-442b-9039-9aeaf00a9b1f");
    expect(row.auctionDate.toISOString()).toBe("2026-08-07T00:00:00.000Z");
    expect(row.clockPresalesSupplyLineId).toBe("c207aee2-07b6-442b-b172-22d9f3592c2e");
    expect(row.supplierOrganizationId).toBe("4cedfae1-b599-378d-a9ca-7fe0edfa81d1");
    expect(row.supplierName).toBe("Raadschelders Varens");
    expect(row.supplierCertificates).toEqual(["MPS A", "MPS GAP"]);
    expect(row.currentNumberOfPieces).toBe(36);
    expect(row.preSaleInitialNumberOfPieces).toBe(24);
    expect(row.preSalePriceValue).toBe("2.0000");
    expect(row.auctionLocation).toBe("Naaldwijk");
    expect(row.lastCommercialMutationMoment?.toISOString()).toBe("2026-08-06T14:22:11.000Z");
    expect(row.isSynthetic).toBe(false);
  });

  it("marks a staging record as synthetic from its reference", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, reference: "synth_174627#" }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.isSynthetic).toBe(true);
  });

  // De belangrijkste regel van deze taak staat in de client, niet in de mapper, en zou
  // zonder deze test stil kunnen omslaan: hasPresale op true levert weer alleen het
  // voorverkoopaanbod op, precies de blinde vlek waarvoor dit onderdeel bestaat. Controleer
  // bij het schrijven dat de test faalt als je die regel omzet.
  it("never restricts the search to presale", async () => {
    let verstuurd: Record<string, unknown> | undefined;
    const http = {
      postJson: async (_pad: string, body: unknown) => {
        verstuurd = body as Record<string, unknown>;
        return { results: [], totalDocuments: 0 };
      },
    };

    await createPreauctionClientWith(http).zoekKlokaanbod({
      auctionDate: "20260807",
      mainGroupKey: "1",
      auctionLocationKey: "NAALDWIJK",
      skip: 500,
      take: 500,
    });

    expect(verstuurd?.hasPresale).toBe(false);
    expect(verstuurd?.auctionDate).toBe("20260807");
    expect(verstuurd?.skip).toBe(500);
    expect(verstuurd?.searchFilterItems).toEqual([
      { filterItemType: "MainGroup", filterOptionKeys: ["1"] },
      { filterItemType: "AuctionLocation", filterOptionKeys: ["NAALDWIJK"] },
    ]);
  });

  // De union-types bestaan omdat deze API inconsistent is over string tegenover getal.
  // Zonder deze test draait het getal-pad van tekst() en String() nooit.
  it("stringifies the codes that arrive as numbers", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, productCode: 105127, packageTypeCode: 577, mainGroupCode: 1,
          organization: { ...PAYLOAD.organization, relationNumber: 73100 } }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.productCode).toBe("105127");
    expect(row.packageTypeCode).toBe("577");
    expect(row.mainGroupCode).toBe("1");
    expect(row.supplierRelationNumber).toBe("73100");
  });

  it("keeps a missing presale link as null", () => {
    const row = toClockSupplyLineRow(
      clockSupplyPageSchema.parse({
        results: [{ ...PAYLOAD, clockPresalesSupplyLineId: null }],
        totalDocuments: 1,
      }).results[0],
      "20260807",
    );

    expect(row.clockPresalesSupplyLineId).toBeNull();
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/mappers/clock-supply.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf het schema**

```ts
import { z } from "zod";

/**
 * The clock supply record, as measured on 6 August 2026 (spec §3.1).
 *
 * Two deliberate departures from how the Floriday schemas are written.
 *
 * Optional scalars use `.nullish()` rather than `.nullable()`. The Floriday schemas can be
 * strict because there is a published swagger to be strict against; here the only
 * specification is what the web app happens to send, and a field that is simply absent for
 * a product group we have not looked at yet is not a reason to drop a page on the floor.
 *
 * The characteristic arrays stay `z.unknown()`. They are stored as Json and only ever
 * displayed, so parsing their internals would buy nothing and would break on the first
 * shape we have not seen.
 *
 * Run `npm run rfh-typeproef` before trusting any of this - it measures the real types over
 * hundreds of records instead of the handful this was drafted from.
 */
export const clockSupplyLineSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  clockPresalesSupplyLineId: z.string().uuid().nullish(),

  organization: z.object({
    id: z.string().uuid(),
    name: z.string().nullish(),
    relationNumber: z.union([z.string(), z.number()]).nullish(),
    logoUrl: z.string().nullish(),
    certificates: z.string().array().nullish(),
  }),

  productCode: z.union([z.string(), z.number()]).nullish(),
  vbnProductName: z.string().nullish(),
  productName: z.string().nullish(),
  name: z.string(),
  characteristics: z.unknown().array().nullish(),
  positiveCharacteristics: z.unknown().array().nullish(),
  negativeCharacteristics: z.unknown().array().nullish(),
  qualityCode: z.string().nullish(),
  qualityIndexClassification: z.string().nullish(),
  mainGroupCode: z.union([z.string(), z.number()]),
  productGroupName: z.string().nullish(),
  potSizeInCm: z.number().nullish(),
  plantHeightInCm: z.number().nullish(),
  photoUrl: z.string().nullish(),
  topLevelMainColor: z.string().nullish(),
  rgbMainColor: z.string().nullish(),

  currentNumberOfPieces: z.number().int(),
  numberOfPackages: z.number().int().nullish(),
  piecesPerPackage: z.number().int().nullish(),
  packagesPerLayer: z.number().int().nullish(),
  layersPerLoadcarrier: z.number().int().nullish(),
  numberOfLoadCarriers: z.number().int().nullish(),
  numberOfPackagesPerLoadCarrier: z.number().int().nullish(),
  packageTypeCode: z.union([z.string(), z.number()]).nullish(),
  packageTypeName: z.string().nullish(),
  loadCarrierCode: z.string().nullish(),
  sequenceOnLoadCarrier: z.number().int().nullish(),

  preSaleInitialNumberOfPieces: z.number().int().nullish(),
  preSaleCurrentNumberOfPieces: z.number().int().nullish(),
  preSalePriceValue: z.number().nullish(),
  preSalePriceCurrency: z.string().nullish(),

  auctionLocation: z.string(),
  clockShortName: z.string().nullish(),
  auctioningSequence: z.number().int().nullish(),
  isAuctioned: z.boolean().nullish(),
  digitalAuctionSupplyType: z.string().nullish(),
  deliveryFormBarcode: z.string().nullish(),
  lastCommercialMutationMoment: z.string().nullish(),

  isFromSyntheticRequest: z.boolean().nullish(),
});

export const clockSupplyPageSchema = z.object({
  results: clockSupplyLineSchema.array(),
  totalDocuments: z.number().int(),
});

export type ClockSupplyLinePayload = z.infer<typeof clockSupplyLineSchema>;
export type ClockSupplyPage = z.infer<typeof clockSupplyPageSchema>;
```

- [ ] **Stap 4: Schrijf de client**

`src/features/rfh-preauction/client/index.ts`:

```ts
import { getRfhEnv } from "@/lib/env";
import { createPreauctionHttp, type PreauctionHttp } from "@/features/rfh-preauction/client/http";
import { createProductieTokenProvider } from "@/features/rfh-preauction/client/token-provider";
import {
  clockSupplyPageSchema,
  type ClockSupplyPage,
} from "@/features/rfh-preauction/schemas/clock-supply";

export interface ZoekOpties {
  auctionDate: string;
  mainGroupKey: string;
  auctionLocationKey: string;
  skip: number;
  take: number;
}

export interface PreauctionClient {
  zoekKlokaanbod(opties: ZoekOpties): Promise<ClockSupplyPage>;
}

/**
 * hasPresale stays false throughout. It is not "exclude presale" but "restrict to presale",
 * and restricting would reproduce exactly the blind spot this whole feature exists to close
 * (spec §3.2). Never set it to true here.
 */
export function createPreauctionClientWith(http: PreauctionHttp): PreauctionClient {
  return {
    async zoekKlokaanbod(opties: ZoekOpties): Promise<ClockSupplyPage> {
      const antwoord = await http.postJson<unknown>("/clock-supply-search", {
        query: "",
        skip: opties.skip,
        take: opties.take,
        sorting: { field: "Product", direction: "Ascending" },
        hasPresale: false,
        searchFilterItems: [
          { filterItemType: "MainGroup", filterOptionKeys: [opties.mainGroupKey] },
          { filterItemType: "AuctionLocation", filterOptionKeys: [opties.auctionLocationKey] },
        ],
        searchRangeFilterItems: [],
        auctionDate: opties.auctionDate,
        includeMarkings: false,
      });

      return clockSupplyPageSchema.parse(antwoord);
    },
  };
}

export function createPreauctionClient(): PreauctionClient {
  const env = getRfhEnv();
  return createPreauctionClientWith(
    createPreauctionHttp({
      baseUrl: env.RFH_PREAUCTION_API_BASE_URL,
      tokenCache: createProductieTokenProvider(),
    }),
  );
}
```

- [ ] **Stap 5: Schrijf de mapper**

```ts
import type { ClockSupplyLinePayload } from "@/features/rfh-preauction/schemas/clock-supply";
import { sleutelNaarDatum } from "@/features/rfh-preauction/sync/veildagen";

/** The shape written to ClockSupplyLine and ClockSupplyLineVersion, minus the bookkeeping columns. */
export interface ClockSupplyLineRow {
  clockSupplyLineId: string;
  reference: string;
  auctionDate: Date;
  clockPresalesSupplyLineId: string | null;

  supplierOrganizationId: string;
  supplierName: string | null;
  supplierRelationNumber: string | null;
  supplierLogoUrl: string | null;
  supplierCertificates: string[];

  productCode: string | null;
  vbnProductName: string | null;
  productName: string | null;
  name: string;
  characteristics: unknown[] | null;
  positiveCharacteristics: unknown[] | null;
  negativeCharacteristics: unknown[] | null;
  qualityCode: string | null;
  qualityIndexClassification: string | null;
  mainGroupCode: string;
  productGroupName: string | null;
  potSizeInCm: number | null;
  plantHeightInCm: number | null;
  photoUrl: string | null;
  topLevelMainColor: string | null;
  rgbMainColor: string | null;

  currentNumberOfPieces: number;
  numberOfPackages: number | null;
  piecesPerPackage: number | null;
  packagesPerLayer: number | null;
  layersPerLoadcarrier: number | null;
  numberOfLoadCarriers: number | null;
  numberOfPackagesPerLoadCarrier: number | null;
  packageTypeCode: string | null;
  packageTypeName: string | null;
  loadCarrierCode: string | null;
  sequenceOnLoadCarrier: number | null;

  preSaleInitialNumberOfPieces: number | null;
  preSaleCurrentNumberOfPieces: number | null;
  /** Fixed-point string, like SupplyLineRow.pricePerPiece, so nothing is lost before Decimal. */
  preSalePriceValue: string | null;
  preSalePriceCurrency: string | null;

  auctionLocation: string;
  clockShortName: string | null;
  auctioningSequence: number | null;
  isAuctioned: boolean;
  digitalAuctionSupplyType: string | null;
  deliveryFormBarcode: string | null;
  lastCommercialMutationMoment: Date | null;

  isFromSyntheticRequest: boolean;
  /**
   * Whether this is RFH's own staging test data. Derived from the reference prefix, not from
   * isFromSyntheticRequest: that flag was false on every record measured, including the 174
   * obviously synthetic ones (spec §3.2).
   *
   * Derived, and deliberately not a column. `reference` is stored and is the source of
   * truth; a second copy could drift from it. This field exists because change detection
   * and the search layer want it in memory, not because it needs persisting - the writer
   * strips it before insert and recomputes it when it reads rows back.
   */
  isSynthetic: boolean;
}

const tekst = (waarde: string | number | null | undefined): string | null =>
  waarde === null || waarde === undefined ? null : String(waarde);

export function toClockSupplyLineRow(
  payload: ClockSupplyLinePayload,
  auctionDateKey: string,
): ClockSupplyLineRow {
  return {
    clockSupplyLineId: payload.id,
    reference: payload.reference,
    auctionDate: sleutelNaarDatum(auctionDateKey),
    clockPresalesSupplyLineId: payload.clockPresalesSupplyLineId ?? null,

    supplierOrganizationId: payload.organization.id,
    supplierName: payload.organization.name ?? null,
    supplierRelationNumber: tekst(payload.organization.relationNumber),
    supplierLogoUrl: payload.organization.logoUrl ?? null,
    supplierCertificates: payload.organization.certificates ?? [],

    productCode: tekst(payload.productCode),
    vbnProductName: payload.vbnProductName ?? null,
    productName: payload.productName ?? null,
    name: payload.name,
    characteristics: payload.characteristics ?? null,
    positiveCharacteristics: payload.positiveCharacteristics ?? null,
    negativeCharacteristics: payload.negativeCharacteristics ?? null,
    qualityCode: payload.qualityCode ?? null,
    qualityIndexClassification: payload.qualityIndexClassification ?? null,
    mainGroupCode: String(payload.mainGroupCode),
    productGroupName: payload.productGroupName ?? null,
    potSizeInCm: payload.potSizeInCm ?? null,
    plantHeightInCm: payload.plantHeightInCm ?? null,
    photoUrl: payload.photoUrl ?? null,
    topLevelMainColor: payload.topLevelMainColor ?? null,
    rgbMainColor: payload.rgbMainColor ?? null,

    currentNumberOfPieces: payload.currentNumberOfPieces,
    numberOfPackages: payload.numberOfPackages ?? null,
    piecesPerPackage: payload.piecesPerPackage ?? null,
    packagesPerLayer: payload.packagesPerLayer ?? null,
    layersPerLoadcarrier: payload.layersPerLoadcarrier ?? null,
    numberOfLoadCarriers: payload.numberOfLoadCarriers ?? null,
    numberOfPackagesPerLoadCarrier: payload.numberOfPackagesPerLoadCarrier ?? null,
    packageTypeCode: tekst(payload.packageTypeCode),
    packageTypeName: payload.packageTypeName ?? null,
    loadCarrierCode: payload.loadCarrierCode ?? null,
    sequenceOnLoadCarrier: payload.sequenceOnLoadCarrier ?? null,

    preSaleInitialNumberOfPieces: payload.preSaleInitialNumberOfPieces ?? null,
    preSaleCurrentNumberOfPieces: payload.preSaleCurrentNumberOfPieces ?? null,
    preSalePriceValue:
      payload.preSalePriceValue === null || payload.preSalePriceValue === undefined
        ? null
        : payload.preSalePriceValue.toFixed(4),
    preSalePriceCurrency: payload.preSalePriceCurrency ?? null,

    auctionLocation: payload.auctionLocation,
    clockShortName: payload.clockShortName ?? null,
    auctioningSequence: payload.auctioningSequence ?? null,
    isAuctioned: payload.isAuctioned ?? false,
    digitalAuctionSupplyType: payload.digitalAuctionSupplyType ?? null,
    deliveryFormBarcode: payload.deliveryFormBarcode ?? null,
    lastCommercialMutationMoment: payload.lastCommercialMutationMoment
      ? new Date(payload.lastCommercialMutationMoment)
      : null,

    isFromSyntheticRequest: payload.isFromSyntheticRequest ?? false,
    isSynthetic: payload.reference.startsWith("synth_"),
  };
}
```

- [ ] **Stap 6: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/mappers/clock-supply.test.ts`
Expected: PASS, vijf tests.

- [ ] **Stap 7: Draai de typeproef tegen staging**

Run: `npm run rfh-typeproef -- --dagen 20260806,20260807`
Expected: een tabel met alle velden en hun werkelijke typen. Wijkt een veld af van het schema hierboven — bijvoorbeeld `number` waar `string` staat, of een type dat helemaal ontbreekt — pas dan het schema aan en draai de test uit stap 6 opnieuw.

Dit vereist een gekoppelde sessie; draai anders eerst taak 12.

- [ ] **Stap 8: Commit**

```bash
git add src/features/rfh-preauction/schemas src/features/rfh-preauction/client/index.ts src/features/rfh-preauction/mappers tests/unit/rfh-preauction/mappers
git commit -m "feat: parse and map the clock supply search response"
```

---

## Taak 10: Wijzigingsdetectie

Voert spec §7 uit, de paragraaf over het versiearchief.

**Files:**
- Create: `src/features/rfh-preauction/sync/changed-lines.ts`
- Test: `tests/unit/rfh-preauction/changed-lines.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from "vitest";
import { selectChangedClockLines } from "@/features/rfh-preauction/sync/changed-lines";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

function rij(overschrijf: Partial<ClockSupplyLineRow> = {}): ClockSupplyLineRow {
  return {
    clockSupplyLineId: "11111111-1111-4111-8111-111111111111",
    reference: "9100183551655",
    auctionDate: new Date("2026-08-07T00:00:00.000Z"),
    clockPresalesSupplyLineId: "22222222-2222-4222-8222-222222222222",
    supplierOrganizationId: "33333333-3333-4333-8333-333333333333",
    supplierName: "Raadschelders Varens",
    supplierRelationNumber: "73100",
    supplierLogoUrl: null,
    supplierCertificates: ["MPS A"],
    productCode: "105127",
    vbnProductName: "NEPHROLEPIS",
    productName: "Nephrolepis",
    name: "NEPHRO EX BOSTONIENSIS",
    characteristics: null,
    positiveCharacteristics: null,
    negativeCharacteristics: null,
    qualityCode: "A1",
    qualityIndexClassification: "A",
    mainGroupCode: "1",
    productGroupName: "Varens",
    potSizeInCm: 12,
    plantHeightInCm: 40,
    photoUrl: null,
    topLevelMainColor: null,
    rgbMainColor: null,
    currentNumberOfPieces: 36,
    numberOfPackages: 3,
    piecesPerPackage: 12,
    packagesPerLayer: 3,
    layersPerLoadcarrier: 4,
    numberOfLoadCarriers: 1,
    numberOfPackagesPerLoadCarrier: 12,
    packageTypeCode: "577",
    packageTypeName: "Deense kar",
    loadCarrierCode: "DC",
    sequenceOnLoadCarrier: 2,
    preSaleInitialNumberOfPieces: 24,
    preSaleCurrentNumberOfPieces: 24,
    preSalePriceValue: "2.0000",
    preSalePriceCurrency: "EUR",
    auctionLocation: "Naaldwijk",
    clockShortName: "N4",
    auctioningSequence: 120,
    isAuctioned: false,
    digitalAuctionSupplyType: null,
    deliveryFormBarcode: "F2DDPWA",
    lastCommercialMutationMoment: new Date("2026-08-06T14:22:11.000Z"),
    isFromSyntheticRequest: false,
    isSynthetic: false,
    ...overschrijf,
  };
}

describe("selectChangedClockLines", () => {
  it("returns a line that was never seen before", () => {
    expect(selectChangedClockLines([rij()], new Map())).toHaveLength(1);
  });

  it("returns nothing when nothing changed", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij()], bestaand)).toHaveLength(0);
  });

  it("notices a sold-down piece count", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ currentNumberOfPieces: 24 });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(1);
  });

  it("notices the lot going under the clock", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij({ isAuctioned: true })], bestaand)).toHaveLength(1);
  });

  it("compares dates by value, not by identity", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ lastCommercialMutationMoment: new Date("2026-08-06T14:22:11.000Z") });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });

  it("compares certificate lists by content", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    expect(selectChangedClockLines([rij({ supplierCertificates: ["MPS A"] })], bestaand))
      .toHaveLength(0);
    expect(selectChangedClockLines([rij({ supplierCertificates: ["MPS A", "GLOBALG.A.P."] })], bestaand))
      .toHaveLength(1);
  });

  // Zonder canonicalisatie is dit elke vijf minuten een "wijziging", voor elke partij met
  // kenmerken. Postgres jsonb geeft de sleutels in zijn eigen volgorde terug, niet in die
  // van RFH.
  it("ignores key order inside the characteristics", () => {
    const bestaand = new Map([
      [rij().clockSupplyLineId, rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }] })],
    ]);
    const nieuw = rij({ characteristics: [{ vbnValueCode: "012", vbnCode: "S01" }] });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });

  it("still notices a genuinely different characteristic", () => {
    const bestaand = new Map([
      [rij().clockSupplyLineId, rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "012" }] })],
    ]);
    const nieuw = rij({ characteristics: [{ vbnCode: "S01", vbnValueCode: "014" }] });

    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(1);
  });

  it("does not treat a dropped presale link as a change", () => {
    const bestaand = new Map([[rij().clockSupplyLineId, rij()]]);
    const nieuw = rij({ clockPresalesSupplyLineId: null });
    expect(selectChangedClockLines([nieuw], bestaand)).toHaveLength(0);
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/changed-lines.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

/**
 * Everything except the key and the presale link carries meaning.
 *
 * clockPresalesSupplyLineId is excluded because RFH drops it once the auction day has passed
 * (spec §3.7). Comparing on it would write an archive row for every lot on the morning after
 * every auction - thousands of versions a day recording nothing but RFH's own housekeeping.
 * write-clock-page.ts never overwrites a stored link with null for the same reason.
 */
type ContentField = Exclude<
  keyof ClockSupplyLineRow,
  "clockSupplyLineId" | "clockPresalesSupplyLineId"
>;

/**
 * A Record rather than an array, so the compiler enforces completeness - the same reasoning
 * as the Floriday side. Add a column to ClockSupplyLineRow and this object stops compiling
 * until someone decides whether it counts as content. A forgotten field means real changes
 * to it are never archived, and that gap cannot be reconstructed afterwards.
 */
const CONTENT_FIELD_SET: Record<ContentField, true> = {
  reference: true,
  auctionDate: true,
  supplierOrganizationId: true,
  supplierName: true,
  supplierRelationNumber: true,
  supplierLogoUrl: true,
  supplierCertificates: true,
  productCode: true,
  vbnProductName: true,
  productName: true,
  name: true,
  characteristics: true,
  positiveCharacteristics: true,
  negativeCharacteristics: true,
  qualityCode: true,
  qualityIndexClassification: true,
  mainGroupCode: true,
  productGroupName: true,
  potSizeInCm: true,
  plantHeightInCm: true,
  photoUrl: true,
  topLevelMainColor: true,
  rgbMainColor: true,
  currentNumberOfPieces: true,
  numberOfPackages: true,
  piecesPerPackage: true,
  packagesPerLayer: true,
  layersPerLoadcarrier: true,
  numberOfLoadCarriers: true,
  numberOfPackagesPerLoadCarrier: true,
  packageTypeCode: true,
  packageTypeName: true,
  loadCarrierCode: true,
  sequenceOnLoadCarrier: true,
  preSaleInitialNumberOfPieces: true,
  preSaleCurrentNumberOfPieces: true,
  preSalePriceValue: true,
  preSalePriceCurrency: true,
  auctionLocation: true,
  clockShortName: true,
  auctioningSequence: true,
  isAuctioned: true,
  digitalAuctionSupplyType: true,
  deliveryFormBarcode: true,
  lastCommercialMutationMoment: true,
  isFromSyntheticRequest: true,
  isSynthetic: true,
};

const CONTENT_FIELDS = Object.keys(CONTENT_FIELD_SET) as ContentField[];

/**
 * Sorts object keys, recursively, leaving array order alone.
 *
 * The characteristic arrays are stored in Postgres `jsonb`, and jsonb does not preserve
 * key order inside an object - it stores keys by length, then bytewise. So the copy read
 * back from the database can stringify differently from the copy that just arrived from
 * RFH while meaning exactly the same thing. Compared naively that is a changed row on
 * every run: at 13.000 lots every five minutes, an archive filling up with noise that
 * records nothing.
 *
 * Array order is deliberately left alone. Key order carries no meaning; element order does.
 */
function canoniek(waarde: unknown): unknown {
  if (Array.isArray(waarde)) return waarde.map(canoniek);
  // Object.entries on a Date returns nothing, so without this a Date nested in an array
  // would canonicalise to {} and two different dates would compare equal. Unreachable
  // today - everything that reaches this branch came out of parsed JSON, from RFH's
  // response body or from a jsonb column - but the types say `unknown` and nothing else
  // records that assumption.
  if (waarde instanceof Date) return waarde.getTime();
  if (waarde !== null && typeof waarde === "object") {
    return Object.fromEntries(
      Object.entries(waarde as Record<string, unknown>)
        .sort(([links], [rechts]) => (links < rechts ? -1 : links > rechts ? 1 : 0))
        .map(([sleutel, inhoud]) => [sleutel, canoniek(inhoud)]),
    );
  }
  return waarde;
}

function isSameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    // Arrays here are certificate lists and characteristic blobs: small, and only ever
    // compared, never merged. Canonical JSON is the cheapest comparison that is actually
    // correct - see canoniek for why plain stringify is not.
    return JSON.stringify(canoniek(left)) === JSON.stringify(canoniek(right));
  }
  return left === right;
}

export function selectChangedClockLines(
  incoming: readonly ClockSupplyLineRow[],
  existing: ReadonlyMap<string, ClockSupplyLineRow>,
): ClockSupplyLineRow[] {
  return incoming.filter((line) => {
    const stored = existing.get(line.clockSupplyLineId);
    if (!stored) return true;
    return CONTENT_FIELDS.some((field) => !isSameValue(line[field], stored[field]));
  });
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/changed-lines.test.ts`
Expected: PASS, zeven tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/sync/changed-lines.ts tests/unit/rfh-preauction/changed-lines.test.ts
git commit -m "feat: decide which clock lines changed enough to archive"
```

---

## Taak 11: De paginaschrijver

**Files:**
- Create: `src/features/rfh-preauction/sync/write-clock-page.ts`
- Test: `tests/integration/rfh-preauction/write-clock-page.test.ts`

- [ ] **Stap 1: Schrijf de falende integratietest**

Volg de opzet van `tests/integration/write-supply-page.test.ts`, inclusief het gebruik van `tests/helpers/test-ids.ts` zodat de test alleen eigen rijen aanraakt.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

const ID = "aaaaaaaa-0000-4000-8000-000000000001";
const PRESALE_ID = "bbbbbbbb-0000-4000-8000-000000000001";

function rij(overschrijf: Partial<ClockSupplyLineRow> = {}): ClockSupplyLineRow {
  // Zelfde volledige rij als in tests/unit/rfh-preauction/changed-lines.test.ts, met
  // clockSupplyLineId op ID en clockPresalesSupplyLineId op PRESALE_ID.
  // Kopieer die helper hierheen in plaats van hem te delen: de twee tests mogen
  // onafhankelijk van elkaar kunnen wijzigen.
  return { /* ... zie changed-lines.test.ts ... */ } as ClockSupplyLineRow;
}

afterEach(async () => {
  await prisma.clockSupplyLineVersion.deleteMany({ where: { clockSupplyLineId: ID } });
  await prisma.clockSupplyLine.deleteMany({ where: { clockSupplyLineId: ID } });
});

describe("writeClockPage", () => {
  it("inserts a line and its first version", async () => {
    const uit = await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));

    expect(uit).toEqual({ rowsProcessed: 1, versionsAdded: 1, duplicatesCollapsed: 0 });
    expect(await prisma.clockSupplyLine.count({ where: { clockSupplyLineId: ID } })).toBe(1);
    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } })).toBe(1);
  });

  it("adds no version when nothing changed", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    const uit = await writeClockPage([rij()], new Date("2026-08-06T10:05:00.000Z"));

    expect(uit.versionsAdded).toBe(0);
    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } })).toBe(1);
  });

  it("adds a version when the piece count moves", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage([rij({ currentNumberOfPieces: 12 })], new Date("2026-08-06T10:05:00.000Z"));

    expect(await prisma.clockSupplyLineVersion.count({ where: { clockSupplyLineId: ID } })).toBe(2);
    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.currentNumberOfPieces).toBe(12);
  });

  it("never overwrites a stored presale link with null", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage(
      [rij({ clockPresalesSupplyLineId: null })],
      new Date("2026-08-08T10:00:00.000Z"),
    );

    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.clockPresalesSupplyLineId).toBe(PRESALE_ID);
  });

  it("keeps firstSeenAt and moves lastSeenAt", async () => {
    await writeClockPage([rij()], new Date("2026-08-06T10:00:00.000Z"));
    await writeClockPage([rij()], new Date("2026-08-06T11:00:00.000Z"));

    const huidig = await prisma.clockSupplyLine.findUnique({ where: { clockSupplyLineId: ID } });
    expect(huidig?.firstSeenAt.toISOString()).toBe("2026-08-06T10:00:00.000Z");
    expect(huidig?.lastSeenAt.toISOString()).toBe("2026-08-06T11:00:00.000Z");
  });

  it("collapses a duplicate id inside one page", async () => {
    const uit = await writeClockPage([rij(), rij()], new Date("2026-08-06T10:00:00.000Z"));
    expect(uit).toMatchObject({ rowsProcessed: 1, duplicatesCollapsed: 1 });
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/integration/rfh-preauction/write-clock-page.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";
import { selectChangedClockLines } from "@/features/rfh-preauction/sync/changed-lines";

export interface ClockWriteResult {
  rowsProcessed: number;
  versionsAdded: number;
  duplicatesCollapsed: number;
}

/** Last occurrence wins, matching how dedupeSupplyLines treats the Floriday feed. */
function dedupe(rows: readonly ClockSupplyLineRow[]): ClockSupplyLineRow[] {
  const perId = new Map<string, ClockSupplyLineRow>();
  for (const row of rows) perId.set(row.clockSupplyLineId, row);
  return [...perId.values()];
}

/**
 * A jsonb value for the raw INSERT. Measured, not assumed.
 *
 * Passing the array straight in as a parameter does not work: the driver serialises a JS
 * array as a Postgres *array* literal - `{...}` - and Postgres answers
 * `22P02 invalid input syntax for type json`. So the value is stringified by hand and cast
 * explicitly.
 *
 * Prisma.JsonNull and Prisma.DbNull are sentinels the query builder understands; inside
 * Prisma.sql they mean nothing. Absent is a plain typed NULL.
 */
const jsonb = (waarde: unknown[] | null): Prisma.Sql =>
  waarde === null ? Prisma.sql`NULL::jsonb` : Prisma.sql`${JSON.stringify(waarde)}::jsonb`;

/**
 * The same value for createMany, where the sentinels do apply - and where the difference
 * is real. Prisma.JsonNull stores a jsonb `null`; Prisma.DbNull stores SQL NULL. "This lot
 * has no characteristics" is the second one.
 */
const jsonInput = (waarde: unknown[] | null): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  waarde === null ? Prisma.DbNull : (waarde as Prisma.InputJsonValue);

/**
 * One multi-row INSERT ... ON CONFLICT for the whole slice, for the same reason the Floriday
 * writer does it: a per-row upsert loop inside a transaction is an order of magnitude slower
 * and does not fit inside the transaction timeout at page size.
 *
 * Two columns are deliberately absent from the UPDATE SET list.
 *
 * firstSeenAt, so a re-observation never disturbs when we first saw the lot.
 *
 * clockPresalesSupplyLineId, which is the subtle one: it is written with COALESCE so an
 * incoming null can never erase a link we already hold. RFH drops the link once the auction
 * day has passed (spec §3.7), and that link is the only bridge between this feed and the
 * presale archive. Losing it to routine housekeeping would quietly destroy the thing this
 * feature exists to provide.
 */
function upsertSql(rows: readonly ClockSupplyLineRow[], observedAt: Date): Prisma.Sql {
  const values = rows.map(
    (row) => Prisma.sql`(
      ${row.clockSupplyLineId}::uuid, ${row.reference}, ${row.auctionDate}::date,
      ${row.clockPresalesSupplyLineId}::uuid,
      ${row.supplierOrganizationId}::uuid, ${row.supplierName}, ${row.supplierRelationNumber},
      ${row.supplierLogoUrl}, ${row.supplierCertificates}::text[],
      ${row.productCode}, ${row.vbnProductName}, ${row.productName}, ${row.name},
      ${jsonb(row.characteristics)}, ${jsonb(row.positiveCharacteristics)},
      ${jsonb(row.negativeCharacteristics)},
      ${row.qualityCode}, ${row.qualityIndexClassification}, ${row.mainGroupCode},
      ${row.productGroupName}, ${row.potSizeInCm}, ${row.plantHeightInCm}, ${row.photoUrl},
      ${row.topLevelMainColor}, ${row.rgbMainColor},
      ${row.currentNumberOfPieces}, ${row.numberOfPackages}, ${row.piecesPerPackage},
      ${row.packagesPerLayer}, ${row.layersPerLoadcarrier}, ${row.numberOfLoadCarriers},
      ${row.numberOfPackagesPerLoadCarrier}, ${row.packageTypeCode}, ${row.packageTypeName},
      ${row.loadCarrierCode}, ${row.sequenceOnLoadCarrier},
      ${row.preSaleInitialNumberOfPieces}, ${row.preSaleCurrentNumberOfPieces},
      ${row.preSalePriceValue}::numeric(12,4), ${row.preSalePriceCurrency},
      ${row.auctionLocation}, ${row.clockShortName}, ${row.auctioningSequence},
      ${row.isAuctioned}, ${row.digitalAuctionSupplyType}, ${row.deliveryFormBarcode},
      ${row.lastCommercialMutationMoment}, ${row.isFromSyntheticRequest},
      ${observedAt}, ${observedAt}
    )`,
  );

  return Prisma.sql`
    INSERT INTO "ClockSupplyLine" (
      "clockSupplyLineId", "reference", "auctionDate", "clockPresalesSupplyLineId",
      "supplierOrganizationId", "supplierName", "supplierRelationNumber", "supplierLogoUrl",
      "supplierCertificates", "productCode", "vbnProductName", "productName", "name",
      "characteristics", "positiveCharacteristics", "negativeCharacteristics",
      "qualityCode", "qualityIndexClassification", "mainGroupCode", "productGroupName",
      "potSizeInCm", "plantHeightInCm", "photoUrl", "topLevelMainColor", "rgbMainColor",
      "currentNumberOfPieces", "numberOfPackages", "piecesPerPackage", "packagesPerLayer",
      "layersPerLoadcarrier", "numberOfLoadCarriers", "numberOfPackagesPerLoadCarrier",
      "packageTypeCode", "packageTypeName", "loadCarrierCode", "sequenceOnLoadCarrier",
      "preSaleInitialNumberOfPieces", "preSaleCurrentNumberOfPieces", "preSalePriceValue",
      "preSalePriceCurrency", "auctionLocation", "clockShortName", "auctioningSequence",
      "isAuctioned", "digitalAuctionSupplyType", "deliveryFormBarcode",
      "lastCommercialMutationMoment", "isFromSyntheticRequest", "firstSeenAt", "lastSeenAt"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("clockSupplyLineId") DO UPDATE SET
      "reference" = EXCLUDED."reference",
      "auctionDate" = EXCLUDED."auctionDate",
      "clockPresalesSupplyLineId" = COALESCE(
        EXCLUDED."clockPresalesSupplyLineId", "ClockSupplyLine"."clockPresalesSupplyLineId"
      ),
      "supplierOrganizationId" = EXCLUDED."supplierOrganizationId",
      "supplierName" = EXCLUDED."supplierName",
      "supplierRelationNumber" = EXCLUDED."supplierRelationNumber",
      "supplierLogoUrl" = EXCLUDED."supplierLogoUrl",
      "supplierCertificates" = EXCLUDED."supplierCertificates",
      "productCode" = EXCLUDED."productCode",
      "vbnProductName" = EXCLUDED."vbnProductName",
      "productName" = EXCLUDED."productName",
      "name" = EXCLUDED."name",
      "characteristics" = EXCLUDED."characteristics",
      "positiveCharacteristics" = EXCLUDED."positiveCharacteristics",
      "negativeCharacteristics" = EXCLUDED."negativeCharacteristics",
      "qualityCode" = EXCLUDED."qualityCode",
      "qualityIndexClassification" = EXCLUDED."qualityIndexClassification",
      "mainGroupCode" = EXCLUDED."mainGroupCode",
      "productGroupName" = EXCLUDED."productGroupName",
      "potSizeInCm" = EXCLUDED."potSizeInCm",
      "plantHeightInCm" = EXCLUDED."plantHeightInCm",
      "photoUrl" = EXCLUDED."photoUrl",
      "topLevelMainColor" = EXCLUDED."topLevelMainColor",
      "rgbMainColor" = EXCLUDED."rgbMainColor",
      "currentNumberOfPieces" = EXCLUDED."currentNumberOfPieces",
      "numberOfPackages" = EXCLUDED."numberOfPackages",
      "piecesPerPackage" = EXCLUDED."piecesPerPackage",
      "packagesPerLayer" = EXCLUDED."packagesPerLayer",
      "layersPerLoadcarrier" = EXCLUDED."layersPerLoadcarrier",
      "numberOfLoadCarriers" = EXCLUDED."numberOfLoadCarriers",
      "numberOfPackagesPerLoadCarrier" = EXCLUDED."numberOfPackagesPerLoadCarrier",
      "packageTypeCode" = EXCLUDED."packageTypeCode",
      "packageTypeName" = EXCLUDED."packageTypeName",
      "loadCarrierCode" = EXCLUDED."loadCarrierCode",
      "sequenceOnLoadCarrier" = EXCLUDED."sequenceOnLoadCarrier",
      "preSaleInitialNumberOfPieces" = EXCLUDED."preSaleInitialNumberOfPieces",
      "preSaleCurrentNumberOfPieces" = EXCLUDED."preSaleCurrentNumberOfPieces",
      "preSalePriceValue" = EXCLUDED."preSalePriceValue",
      "preSalePriceCurrency" = EXCLUDED."preSalePriceCurrency",
      "auctionLocation" = EXCLUDED."auctionLocation",
      "clockShortName" = EXCLUDED."clockShortName",
      "auctioningSequence" = EXCLUDED."auctioningSequence",
      "isAuctioned" = EXCLUDED."isAuctioned",
      "digitalAuctionSupplyType" = EXCLUDED."digitalAuctionSupplyType",
      "deliveryFormBarcode" = EXCLUDED."deliveryFormBarcode",
      "lastCommercialMutationMoment" = EXCLUDED."lastCommercialMutationMoment",
      "isFromSyntheticRequest" = EXCLUDED."isFromSyntheticRequest",
      "lastSeenAt" = EXCLUDED."lastSeenAt"
  `;
}

/**
 * Persists one slice: current state to ClockSupplyLine, plus one version row per line whose
 * content actually changed. Both writes share a transaction so a slice is archived atomically.
 */
export async function writeClockPage(
  rows: readonly ClockSupplyLineRow[],
  observedAt: Date,
): Promise<ClockWriteResult> {
  if (rows.length === 0) {
    return { rowsProcessed: 0, versionsAdded: 0, duplicatesCollapsed: 0 };
  }

  const deduped = dedupe(rows);
  const ids = deduped.map((row) => row.clockSupplyLineId);

  const stored = await prisma.clockSupplyLine.findMany({
    where: { clockSupplyLineId: { in: ids } },
  });

  const existing = new Map<string, ClockSupplyLineRow>(
    stored.map((line) => {
      const { firstSeenAt: _first, lastSeenAt: _last, ...content } = line;
      return [
        line.clockSupplyLineId,
        {
          ...content,
          preSalePriceValue: line.preSalePriceValue?.toFixed(4) ?? null,
          characteristics: content.characteristics as unknown[] | null,
          positiveCharacteristics: content.positiveCharacteristics as unknown[] | null,
          negativeCharacteristics: content.negativeCharacteristics as unknown[] | null,
          isSynthetic: line.reference.startsWith("synth_"),
        } as ClockSupplyLineRow,
      ];
    }),
  );

  const changed = selectChangedClockLines(deduped, existing);

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw(upsertSql(deduped, observedAt));

      if (changed.length > 0) {
        await tx.clockSupplyLineVersion.createMany({
          data: changed.map(({ isSynthetic: _isSynthetic, ...row }) => ({
            ...row,
            characteristics: jsonInput(row.characteristics),
            positiveCharacteristics: jsonInput(row.positiveCharacteristics),
            negativeCharacteristics: jsonInput(row.negativeCharacteristics),
            observedAt,
          })),
          skipDuplicates: true,
        });
      }
    },
    { timeout: 15_000 },
  );

  return {
    rowsProcessed: deduped.length,
    versionsAdded: changed.length,
    duplicatesCollapsed: rows.length - deduped.length,
  };
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/integration/rfh-preauction/write-clock-page.test.ts`
Expected: PASS, zes tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/sync/write-clock-page.ts tests/integration/rfh-preauction/write-clock-page.test.ts
git commit -m "feat: persist clock supply slices with a version archive"
```

---

## Taak 12: Het koppelscript

Voert spec §4 uit, de regel "bootstrappen blijft handwerk".

**Files:**
- Create: `scripts/rfh-koppel.ts`
- Modify: `package.json`

- [ ] **Stap 1: Schrijf het script**

```ts
/**
 * Couples this installation to RFH Pre-Auction by storing a refresh token.
 *
 * How to get one:
 *
 *   1. Open a private browsing window - this matters. A private window gets its own
 *      session, so the server ends up with a refresh token that nobody else is spending.
 *      Copy the token out of your everyday session and the two will rotate each other to
 *      death within the hour.
 *   2. Log in at https://pre-auction.royalfloraholland.com (or the staging host).
 *   3. Open the developer console and run:
 *        JSON.parse(localStorage.getItem('okta-token-storage')).refreshToken.refreshToken
 *   4. Pass that value here.
 *   5. Close the private window. Do not use it again: the server owns that session now.
 *
 * Usage: npm run rfh-koppel -- --token <refresh-token>
 *        npm run rfh-koppel -- --env .env.lokaal-productie --token <refresh-token>
 *        npm run rfh-koppel -- --status
 */
import "../src/lib/load-env";
import { prisma } from "../src/lib/db";
import { leesSessie, schrijfSessie } from "../src/features/rfh-preauction/client/session-store";
import { createProductieTokenProvider } from "../src/features/rfh-preauction/client/token-provider";

function argument(naam: string): string | undefined {
  const i = process.argv.indexOf(naam);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function toonStatus(): Promise<void> {
  const sessie = await leesSessie();
  if (!sessie) {
    console.log("Niet gekoppeld. Draai dit script met --token.");
    return;
  }
  console.log(`Gekoppeld.`);
  console.log(`  laatst ververst : ${sessie.lastRefreshedAt?.toISOString() ?? "nog nooit"}`);
  console.log(`  laatste fout    : ${sessie.lastError ?? "geen"}`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--status")) {
    await toonStatus();
    return;
  }

  const token = argument("--token");
  if (!token) {
    console.error("Geef een refresh token mee: npm run rfh-koppel -- --token <token>");
    process.exit(1);
  }

  await schrijfSessie(token);
  console.log("Token opgeslagen. Even proberen of hij werkt...");

  // Proving it now is the point of the script. A token that only turns out to be wrong at
  // 03:00 during a cron run costs an auction day, and this feed has no way to catch up.
  const provider = createProductieTokenProvider();
  await provider.getToken();

  console.log("Gelukt. De sessie is gekoppeld en de eerste rotatie is opgeslagen.");
  await toonStatus();
}

main()
  .catch((error) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Stap 2: Voeg het commando toe**

In `package.json`, bij `scripts`:

```json
    "rfh-koppel": "tsx scripts/rfh-koppel.ts",
```

- [ ] **Stap 3: Koppel de testomgeving**

Volg de instructie in de kop van het script en draai:

Run: `npm run rfh-koppel -- --token <token uit het privévenster>`
Expected: "Gelukt. De sessie is gekoppeld en de eerste rotatie is opgeslagen."

Faalt dit met `invalid_grant`, dan is de token al een keer gebruikt — haal een verse op uit een nieuw privévenster.

- [ ] **Stap 4: Commit**

```bash
git add scripts/rfh-koppel.ts package.json
git commit -m "feat: add a script that couples the RFH session"
```

---

## Taak 13: Pagineren binnen een snede

**Files:**
- Create: `src/features/rfh-preauction/sync/clock-supply.ts`
- Test: `tests/unit/rfh-preauction/clock-supply.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it, vi } from "vitest";
import { syncSnede } from "@/features/rfh-preauction/sync/clock-supply";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";

function payload(id: string) {
  // Minimaal geldig volgens clockSupplyPageSchema; hergebruik de PAYLOAD-constante uit
  // tests/unit/rfh-preauction/mappers/clock-supply.test.ts en overschrijf alleen id.
  return { /* ... */ id } as never;
}

function clientMet(paginas: { results: unknown[]; totalDocuments: number }[]) {
  let n = 0;
  return { zoekKlokaanbod: vi.fn(async () => paginas[n++]) } as never;
}

describe("syncSnede", () => {
  it("walks pages until totalDocuments is reached", async () => {
    const geschreven: ClockSupplyLineRow[][] = [];
    const client = clientMet([
      { results: [payload("11111111-1111-4111-8111-111111111111")], totalDocuments: 2 },
      { results: [payload("22222222-2222-4222-8222-222222222222")], totalDocuments: 2 },
    ]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "NAALDWIJK" },
      pageSize: 1,
      writePage: async (rows) => {
        geschreven.push([...rows]);
        return { rowsProcessed: rows.length, versionsAdded: 0, duplicatesCollapsed: 0 };
      },
      now: () => new Date("2026-08-06T10:00:00.000Z"),
    });

    expect(geschreven).toHaveLength(2);
    expect(uit.rowsProcessed).toBe(2);
    expect(uit.totalDocuments).toBe(2);
    expect(uit.compleet).toBe(true);
  });

  it("does not call the API at all for an empty slice", async () => {
    const client = clientMet([{ results: [], totalDocuments: 0 }]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "EELDE" },
      pageSize: 500,
      writePage: async () => ({ rowsProcessed: 0, versionsAdded: 0, duplicatesCollapsed: 0 }),
      now: () => new Date(),
    });

    expect(uit.rowsProcessed).toBe(0);
    expect(uit.compleet).toBe(true);
  });

  it("reports incomplete when a short page arrives before the total is reached", async () => {
    const client = clientMet([{ results: [], totalDocuments: 5 }]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "NAALDWIJK" },
      pageSize: 500,
      writePage: async () => ({ rowsProcessed: 0, versionsAdded: 0, duplicatesCollapsed: 0 }),
      now: () => new Date(),
    });

    expect(uit.compleet).toBe(false);
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/clock-supply.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import type { PreauctionClient } from "@/features/rfh-preauction/client";
import { toClockSupplyLineRow, type ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";
import { SNIJBLOEMEN_HOOFDGROEP, type Snede } from "@/features/rfh-preauction/sync/sneden";
import type { ClockWriteResult } from "@/features/rfh-preauction/sync/write-clock-page";

/**
 * 500 is verified to work; the web app itself asks for 100. Larger pages mean fewer requests
 * and fewer transactions, and a slice of a single auction location on a single day tops out
 * around two thousand rows on production.
 */
export const STANDAARD_PAGINAGROOTTE = 500;

export interface SyncSnedeOptions {
  client: PreauctionClient;
  snede: Snede;
  writePage: (rows: readonly ClockSupplyLineRow[], observedAt: Date) => Promise<ClockWriteResult>;
  now: () => Date;
  pageSize?: number;
}

export interface SyncSnedeResult {
  rowsProcessed: number;
  versionsAdded: number;
  totalDocuments: number;
  /**
   * Whether we saw as many rows as the server said there were. False means the slice was
   * cut short - a page came back shorter than asked for while the total was not yet reached.
   * Reported rather than thrown, because one incomplete slice should not abandon the other
   * thirteen, but it must never pass unnoticed either: this feed has no sequence number to
   * prove completeness with (spec §9).
   */
  compleet: boolean;
}

/**
 * Walks one slice - one auction day at one auction location - and writes every page.
 *
 * observedAt is taken once, at the start, and used for every page in the slice. That makes
 * the whole slice one moment in the archive rather than a smear across however long the
 * paging took, which is what a reader comparing two observations expects.
 */
export async function syncSnede(options: SyncSnedeOptions): Promise<SyncSnedeResult> {
  const { client, snede, writePage, now, pageSize = STANDAARD_PAGINAGROOTTE } = options;
  const observedAt = now();

  let skip = 0;
  let rowsProcessed = 0;
  let versionsAdded = 0;
  let totalDocuments = 0;

  for (;;) {
    const pagina = await client.zoekKlokaanbod({
      auctionDate: snede.auctionDate,
      mainGroupKey: SNIJBLOEMEN_HOOFDGROEP,
      auctionLocationKey: snede.auctionLocationKey,
      skip,
      take: pageSize,
    });

    totalDocuments = pagina.totalDocuments;

    if (pagina.results.length > 0) {
      const rows = pagina.results.map((payload) =>
        toClockSupplyLineRow(payload, snede.auctionDate),
      );
      const geschreven = await writePage(rows, observedAt);
      rowsProcessed += geschreven.rowsProcessed;
      versionsAdded += geschreven.versionsAdded;
    }

    skip += pagina.results.length;

    if (rowsProcessed >= totalDocuments) break;

    // A page shorter than requested while the total is not reached means the server stopped
    // handing rows out - a skip ceiling, or the result set shifting under us mid-walk.
    // Either way there is nothing to gain from asking again with a higher skip.
    if (pagina.results.length < pageSize) break;
  }

  return {
    rowsProcessed,
    versionsAdded,
    totalDocuments,
    compleet: rowsProcessed >= totalDocuments,
  };
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/clock-supply.test.ts`
Expected: PASS, drie tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/sync/clock-supply.ts tests/unit/rfh-preauction/clock-supply.test.ts
git commit -m "feat: page through one auction day and location slice"
```

---

## Taak 14: De orchestratie

**Files:**
- Create: `src/features/rfh-preauction/sync/run-clock-sync.ts`
- Test: `tests/unit/rfh-preauction/run-clock-sync.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it, vi } from "vitest";
import { runClockSyncWith } from "@/features/rfh-preauction/sync/run-clock-sync";

function deps(overschrijf: Record<string, unknown> = {}) {
  return {
    syncSnede: vi.fn(async () => ({
      rowsProcessed: 10,
      versionsAdded: 2,
      totalDocuments: 10,
      compleet: true,
    })),
    startRun: vi.fn(async () => 1n),
    finishRun: vi.fn(async () => {}),
    now: () => new Date("2026-08-06T12:00:00.000Z"),
    ...overschrijf,
  } as never;
}

describe("runClockSyncWith", () => {
  it("walks every slice and reports the totals", async () => {
    const d = deps();
    const uit = await runClockSyncWith({ trigger: "CRON" }, d);

    // Vier veildagen maal zeven veillocaties.
    expect(d.syncSnede).toHaveBeenCalledTimes(28);
    expect(uit.rowsProcessed).toBe(280);
    expect(uit.versionsAdded).toBe(56);
    expect(uit.onvolledigeSneden).toEqual([]);
    expect(d.finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({ status: "SUCCEEDED" }));
  });

  it("names the incomplete slices in the warning without failing the run", async () => {
    const d = deps({
      syncSnede: vi.fn(async ({ snede }) => ({
        rowsProcessed: 1,
        versionsAdded: 0,
        totalDocuments: snede.auctionLocationKey === "NAALDWIJK" ? 99 : 1,
        compleet: snede.auctionLocationKey !== "NAALDWIJK",
      })),
    });

    const uit = await runClockSyncWith({ trigger: "CRON" }, d);

    expect(uit.onvolledigeSneden).toHaveLength(4);
    const [, outcome] = d.finishRun.mock.calls[0];
    expect(outcome.status).toBe("SUCCEEDED");
    expect(outcome.warning).toMatch(/NAALDWIJK/);
  });

  it("marks the run failed and rethrows when a slice throws", async () => {
    const d = deps({
      syncSnede: vi.fn(async () => {
        throw new Error("RFH request failed: POST /clock-supply-search -> 503");
      }),
    });

    await expect(runClockSyncWith({ trigger: "CRON" }, d)).rejects.toThrow(/503/);
    const [, outcome] = d.finishRun.mock.calls[0];
    expect(outcome.status).toBe("FAILED");
    expect(outcome.errorMessage).toMatch(/503/);
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/rfh-preauction/run-clock-sync.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import type { SyncTrigger } from "@prisma/client";
import { createPreauctionClient } from "@/features/rfh-preauction/client";
import { finishRun, startRun } from "@/features/floriday/sync/run-log";
import { snedenVoor, type Snede } from "@/features/rfh-preauction/sync/sneden";
import { veildagenVoorRun } from "@/features/rfh-preauction/sync/veildagen";
import { syncSnede, type SyncSnedeResult } from "@/features/rfh-preauction/sync/clock-supply";
import { writeClockPage } from "@/features/rfh-preauction/sync/write-clock-page";

/** The resource name in SyncRun. Distinct from SUPPLY_RESOURCE so the status page can tell them apart. */
export const KLOK_RESOURCE = "rfh-clock-supply";

export interface RunClockSyncOptions {
  trigger: SyncTrigger;
  /** Overrides which auction days to walk. The backfill script passes an explicit list. */
  veildagen?: readonly string[];
  onProgress?: (message: string) => void;
}

export interface RunClockSyncResult {
  snedenVerwerkt: number;
  rowsProcessed: number;
  versionsAdded: number;
  onvolledigeSneden: Snede[];
}

export interface RunClockSyncDeps {
  syncSnede: (args: { snede: Snede }) => Promise<SyncSnedeResult>;
  startRun: (trigger: SyncTrigger) => Promise<bigint>;
  finishRun: typeof finishRun;
  now: () => Date;
}

/**
 * Walks every slice of every auction day in scope.
 *
 * Slices are walked in order and each one is written before the next is fetched, so a run
 * that dies halfway leaves everything it already committed intact. There is no cursor to
 * resume from - and none is needed, because the next run simply asks for the same days
 * again and upserts over its own work.
 *
 * **Sequential is a requirement, not a style choice.** http.ts deliberately has no rate
 * limiter, and the argument for leaving it out is that a run is a few dozen requests
 * spread over seconds. That argument only holds while slices go one at a time. Fan these
 * out with Promise.all and the justification evaporates, with nothing left to catch it -
 * against a partner's undocumented API, on a personal session. If this ever needs to be
 * faster, add the limiter first.
 *
 * An incomplete slice is a warning, not a failure. This feed has no max-sequence endpoint,
 * so "did we get everything" can only be answered by comparing against totalDocuments per
 * slice; reporting that comparison is the closest thing to a completeness proof available
 * (spec §9).
 */
export async function runClockSyncWith(
  options: RunClockSyncOptions,
  deps: RunClockSyncDeps,
): Promise<RunClockSyncResult> {
  const runId = await deps.startRun(options.trigger);

  const veildagen = options.veildagen ?? veildagenVoorRun(deps.now());
  const sneden = snedenVoor(veildagen);

  let rowsProcessed = 0;
  let versionsAdded = 0;
  const onvolledigeSneden: Snede[] = [];

  try {
    for (const snede of sneden) {
      // Verrijk de fout met de snede voordat hij naar boven gaat. postJson kent alleen het
      // pad, en dat is voor deze API altijd dezelfde literal - twee mislukkingen op
      // verschillende veildagen leveren anders bijna identieke tekst op in
      // SyncRun.errorMessage en op de statuspagina.
      const uit = await deps
        .syncSnede({ snede })
        .catch((fout: unknown) => {
          const bericht = fout instanceof Error ? fout.message : String(fout);
          throw new Error(
            `${snede.auctionDate} ${snede.auctionLocationKey}: ${bericht}`,
            { cause: fout },
          );
        });
      rowsProcessed += uit.rowsProcessed;
      versionsAdded += uit.versionsAdded;
      if (!uit.compleet) onvolledigeSneden.push(snede);

      options.onProgress?.(
        `${snede.auctionDate} ${snede.auctionLocationKey}: ` +
          `${uit.rowsProcessed} van ${uit.totalDocuments}, ${uit.versionsAdded} versies`,
      );
    }

    const warning =
      onvolledigeSneden.length > 0
        ? `Onvolledig opgehaald: ${onvolledigeSneden
            .map((s) => `${s.auctionDate}/${s.auctionLocationKey}`)
            .join(", ")}`
        : undefined;

    await deps.finishRun(runId, {
      status: "SUCCEEDED",
      pagesProcessed: sneden.length,
      rowsProcessed,
      versionsAdded,
      warning,
    });

    return { snedenVerwerkt: sneden.length, rowsProcessed, versionsAdded, onvolledigeSneden };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    try {
      await deps.finishRun(runId, { status: "FAILED", errorMessage });
    } catch {
      // Same reasoning as runSupplySyncWith: if the database is what failed, rethrowing here
      // would replace the informative error with a less useful one.
    }
    throw error;
  }
}

/** Production entry point. */
export async function runClockSync(options: RunClockSyncOptions): Promise<RunClockSyncResult> {
  const client = createPreauctionClient();
  return runClockSyncWith(options, {
    syncSnede: ({ snede }) =>
      syncSnede({ client, snede, writePage: writeClockPage, now: () => new Date() }),
    startRun: (trigger) => startRun(KLOK_RESOURCE, trigger),
    finishRun,
    now: () => new Date(),
  });
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/rfh-preauction/run-clock-sync.test.ts`
Expected: PASS, drie tests.

- [ ] **Stap 5: Commit**

```bash
git add src/features/rfh-preauction/sync/run-clock-sync.ts tests/unit/rfh-preauction/run-clock-sync.test.ts
git commit -m "feat: orchestrate a full clock supply run across all slices"
```

---

## Taak 15: De geplande taak

**Files:**
- Create: `src/app/api/cron/klok/route.ts`
- Modify: `vercel.json`
- Test: `tests/unit/api/cron-klok.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

Volg `tests/unit/api/cron-sync.test.ts`.

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/rfh-preauction/sync/run-clock-sync", () => ({
  KLOK_RESOURCE: "rfh-clock-supply",
  runClockSync: vi.fn(async () => ({
    snedenVerwerkt: 28,
    rowsProcessed: 12000,
    versionsAdded: 340,
    onvolledigeSneden: [],
  })),
}));
vi.mock("@/features/floriday/sync/run-log", () => ({ isErEenRunBezig: vi.fn(async () => false) }));

import { GET } from "@/app/api/cron/klok/route";
import { runClockSync } from "@/features/rfh-preauction/sync/run-clock-sync";
import { isErEenRunBezig } from "@/features/floriday/sync/run-log";

beforeEach(() => {
  process.env.CRON_SECRET = "geheim";
  vi.clearAllMocks();
});

function verzoek(auth?: string) {
  return new Request("https://test/api/cron/klok", {
    headers: auth ? { authorization: auth } : {},
  });
}

describe("GET /api/cron/klok", () => {
  it("refuses a request without the cron secret", async () => {
    const res = await GET(verzoek());
    expect(res.status).toBe(401);
    expect(runClockSync).not.toHaveBeenCalled();
  });

  it("runs the sync and reports the totals", async () => {
    const res = await GET(verzoek("Bearer geheim"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ rowsProcessed: 12000, onvolledigeSneden: [] });
  });

  it("skips when a run is already going", async () => {
    vi.mocked(isErEenRunBezig).mockResolvedValueOnce(true);
    const res = await GET(verzoek("Bearer geheim"));
    expect(await res.json()).toMatchObject({ skipped: true });
    expect(runClockSync).not.toHaveBeenCalled();
  });

  it("returns 500 with the message when the sync throws", async () => {
    vi.mocked(runClockSync).mockRejectedValueOnce(new Error("sessie verlopen"));
    const res = await GET(verzoek("Bearer geheim"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "sessie verlopen" });
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/api/cron-klok.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de route**

```ts
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { KLOK_RESOURCE, runClockSync } from "@/features/rfh-preauction/sync/run-clock-sync";
import { SYNC_DISABLED_MESSAGE, isSyncEnabled } from "@/features/floriday/sync-enabled";
import { isErEenRunBezig } from "@/features/floriday/sync/run-log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The clock supply top-up.
 *
 * No page bound and no interval check, unlike the Floriday route. A run here is a fixed
 * amount of work - four auction days times seven locations - and it either finishes or it
 * does not; there is no cursor to leave halfway. The interval is the cron schedule itself.
 *
 * The overlap guard does matter, and more than on the Floriday side: two runs would refresh
 * the same rotating token and kill the session (spec §4).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const expected = `Bearer ${getEnv().CRON_SECRET}`;
    if (request.headers.get("authorization") !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSyncEnabled()) {
      return NextResponse.json({ skipped: true, reason: SYNC_DISABLED_MESSAGE });
    }

    if (await isErEenRunBezig(KLOK_RESOURCE)) {
      return NextResponse.json({
        skipped: true,
        reason: "Er loopt al een synchronisatie voor het klokaanbod.",
      });
    }

    const result = await runClockSync({ trigger: "CRON" });

    return NextResponse.json({
      snedenVerwerkt: result.snedenVerwerkt,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      onvolledigeSneden: result.onvolledigeSneden.map(
        (s) => `${s.auctionDate}/${s.auctionLocationKey}`,
      ),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/api/cron-klok.test.ts`
Expected: PASS, vier tests.

- [ ] **Stap 5: Voeg de cron toe**

In `vercel.json`, naast de bestaande taken:

```json
    { "path": "/api/cron/klok", "schedule": "*/5 * * * *" }
```

- [ ] **Stap 6: Commit**

```bash
git add src/app/api/cron/klok/route.ts vercel.json tests/unit/api/cron-klok.test.ts
git commit -m "feat: run the clock supply sync on a schedule"
```

---

## Taak 16: De inhaalslag

Voert spec §6 uit, laatste alinea: er is ongeveer een maand geschiedenis beschikbaar en daarna is die weg.

**Files:**
- Create: `scripts/backfill-klok.ts`
- Modify: `package.json`

- [ ] **Stap 1: Schrijf het script**

```ts
/**
 * One-off catch-up over the auction days RFH still holds.
 *
 * Roughly a month is available: 31 July 2026 answered with 16.729 rows while 1 July answered
 * with zero (spec §3.5). After that window the data is gone, and unlike the Floriday feed
 * there is no sequence number to come back for it with.
 *
 * The lines this fetches will mostly carry no presale link. RFH drops that reference once the
 * auction day has passed (spec §3.7), so history arrives unlinked by definition - that is
 * expected, not a bug, and it is exactly why the daily sync matters more than this script.
 *
 * Usage: npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05
 */
import "../src/lib/load-env";
import { prisma } from "../src/lib/db";
import { runClockSync } from "../src/features/rfh-preauction/sync/run-clock-sync";
import { veildagSleutel } from "../src/features/rfh-preauction/sync/veildagen";

function argument(naam: string): string | undefined {
  const i = process.argv.indexOf(naam);
  return i === -1 ? undefined : process.argv[i + 1];
}

function dagenTussen(vanaf: string, tot: string): string[] {
  const dagen: string[] = [];
  // Step from midday, for the same daylight-saving reason as veildagenVoorRun.
  let cursor = new Date(`${vanaf}T12:00:00.000Z`);
  const einde = new Date(`${tot}T12:00:00.000Z`);
  while (cursor <= einde) {
    dagen.push(veildagSleutel(cursor));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return dagen;
}

async function main(): Promise<void> {
  const vanaf = argument("--vanaf");
  const tot = argument("--tot");
  if (!vanaf || !tot) {
    console.error("Gebruik: npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05");
    process.exit(1);
  }

  const dagen = dagenTussen(vanaf, tot);
  console.log(`${dagen.length} veildagen, van ${dagen[0]} tot ${dagen.at(-1)}`);

  // One run per day rather than one run over all of them: each day gets its own SyncRun row,
  // so a failure halfway is visible per day instead of as one opaque failure, and re-running
  // a single day is a matter of narrowing the range.
  for (const dag of dagen) {
    const uit = await runClockSync({
      trigger: "BACKFILL",
      veildagen: [dag],
      onProgress: (bericht) => console.log(`  ${bericht}`),
    });
    console.log(
      `${dag}: ${uit.rowsProcessed} regels, ${uit.versionsAdded} versies` +
        (uit.onvolledigeSneden.length > 0
          ? `, ONVOLLEDIG: ${uit.onvolledigeSneden.map((s) => s.auctionLocationKey).join(", ")}`
          : ""),
    );
  }
}

main()
  .catch((error) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Stap 2: Voeg het commando toe**

In `package.json`, bij `scripts`:

```json
    "backfill-klok": "tsx scripts/backfill-klok.ts",
```

- [ ] **Stap 3: Draai een korte proef**

Run: `npm run backfill-klok -- --vanaf 2026-08-04 --tot 2026-08-05`
Expected: per veildag een regel met het aantal opgehaalde regels. Controleer daarna in de database:

```bash
npm run rfh-koppel -- --status
```

- [ ] **Stap 4: Commit**

```bash
git add scripts/backfill-klok.ts package.json
git commit -m "feat: add a catch-up script for the available clock supply history"
```

---

## Taak 17: Zichtbaarheid op de statuspagina

Voert spec §4 uit, laatste alinea: een dode sessie mag geen stille storing zijn.

**Files:**
- Modify: `src/features/sync-status/queries.ts`
- Modify: `src/app/(protected)/status/page.tsx`
- Test: `tests/unit/sync-status/rfh-sessie.test.ts`
- Create: `src/features/sync-status/rfh-sessie.ts`

- [ ] **Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from "vitest";
import { beoordeelSessie } from "@/features/sync-status/rfh-sessie";

describe("beoordeelSessie", () => {
  it("reports not coupled when there is no session", () => {
    expect(beoordeelSessie(null, new Date())).toEqual({
      toestand: "niet-gekoppeld",
      bericht: "RFH Pre-Auction is nog niet gekoppeld.",
    });
  });

  it("reports expired when the last attempt failed", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-01T10:00:00.000Z"),
      lastError: "RFH token request failed: invalid_grant - expired",
    };
    const uit = beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z"));
    expect(uit.toestand).toBe("verlopen");
    expect(uit.bericht).toMatch(/opnieuw koppelen/i);
  });

  it("reports healthy after a recent refresh", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-06T09:30:00.000Z"),
      lastError: null,
    };
    expect(beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z")).toestand).toBe("goed");
  });

  it("reports stale when nothing has refreshed for a day", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-05T09:00:00.000Z"),
      lastError: null,
    };
    expect(beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z")).toestand).toBe("verouderd");
  });
});
```

- [ ] **Stap 2: Draai de test en zie hem falen**

Run: `npx vitest run tests/unit/sync-status/rfh-sessie.test.ts`
Expected: FAIL, module niet gevonden.

- [ ] **Stap 3: Schrijf de implementatie**

```ts
import type { RfhSessie } from "@/features/rfh-preauction/client/session-store";

export type SessieToestand = "niet-gekoppeld" | "verlopen" | "verouderd" | "goed";

export interface SessieOordeel {
  toestand: SessieToestand;
  bericht: string;
}

/**
 * How long without a successful refresh before the session counts as stale.
 *
 * The sync runs every five minutes and refreshes at least hourly, so a day of silence means
 * something stopped - the cron, the environment, or the coupling - even though nothing has
 * reported an error yet. Silence is the failure mode this feed is most exposed to: a missed
 * auction day cannot be fetched again.
 */
const VEROUDERD_NA_UREN = 24;

export function beoordeelSessie(sessie: RfhSessie | null, nu: Date): SessieOordeel {
  if (!sessie) {
    return {
      toestand: "niet-gekoppeld",
      bericht: "RFH Pre-Auction is nog niet gekoppeld.",
    };
  }

  if (sessie.lastError) {
    return {
      toestand: "verlopen",
      bericht:
        "RFH-sessie verlopen, opnieuw koppelen. " +
        `Laatste fout: ${sessie.lastError}`,
    };
  }

  const laatst = sessie.lastRefreshedAt;
  if (!laatst || nu.getTime() - laatst.getTime() > VEROUDERD_NA_UREN * 3_600_000) {
    return {
      toestand: "verouderd",
      bericht: `Geen geslaagde vernieuwing sinds ${laatst?.toISOString() ?? "de koppeling"}.`,
    };
  }

  return { toestand: "goed", bericht: "RFH-sessie is in orde." };
}
```

- [ ] **Stap 4: Draai de test en zie hem slagen**

Run: `npx vitest run tests/unit/sync-status/rfh-sessie.test.ts`
Expected: PASS, vier tests.

- [ ] **Stap 5: Toon het op de statuspagina**

Lees `src/app/(protected)/status/page.tsx` en voeg een blok toe in dezelfde vorm als de bestaande blokken, gevoed door:

```ts
import { leesSessie } from "@/features/rfh-preauction/client/session-store";
import { beoordeelSessie } from "@/features/sync-status/rfh-sessie";

const sessieOordeel = beoordeelSessie(await leesSessie(), new Date());
```

Toon `sessieOordeel.bericht`, met dezelfde opmaakkeuze die de pagina al maakt voor een gezonde tegenover een gestoorde toestand. Toon daarnaast de laatste `SyncRun` voor `KLOK_RESOURCE`, naast die voor de bestaande bron.

- [ ] **Stap 6: Controleer het scherm**

Run: `npm run dev`
Open `http://localhost:3000/status`.
Expected: een blok voor het klokaanbod met de sessietoestand en de laatste run. Koppel de sessie los met `await prisma.rfhSession.deleteMany({})` om te zien dat "nog niet gekoppeld" verschijnt.

- [ ] **Stap 7: Commit**

```bash
git add src/features/sync-status/rfh-sessie.ts "src/app/(protected)/status/page.tsx" tests/unit/sync-status/rfh-sessie.test.ts
git commit -m "feat: show the RFH session state on the status page"
```

---

## Taak 18: Alles samen controleren

- [ ] **Stap 1: Draai de hele testsuite**

Run: `npm test`
Expected: alle tests slagen, inclusief `tests/integration/no-real-data-touched.test.ts`.

- [ ] **Stap 2: Controleer de typen en de build**

Run: `npx tsc --noEmit && npm run build`
Expected: geen fouten.

- [ ] **Stap 3: Draai één echte synchronisatie**

Run: `npm run backfill-klok -- --vanaf 2026-08-07 --tot 2026-08-07`
Expected: per veillocatie een regel; de som van de aantallen komt overeen met wat de Pre-Auction-UI voor snijbloemen op die dag toont.

- [ ] **Stap 4: Controleer de join tegen de voorverkoop**

Draai in een node-script of via `npx prisma studio`:

```sql
SELECT
  count(*) AS klokregels,
  count("clockPresalesSupplyLineId") AS met_link,
  count(s."supplyLineId") AS link_lost_op
FROM "ClockSupplyLine" c
LEFT JOIN "SupplyLine" s ON s."supplyLineId" = c."clockPresalesSupplyLineId"
WHERE c."auctionDate" = '2026-08-07';
```

Expected: `met_link` gelijk aan `link_lost_op`. Elke voorverkoopverwijzing die RFH meegeeft hoort in onze eigen `SupplyLine` te staan; dat was op 6 augustus 156 van de 156 (spec §3.3). Wijkt dat af, dan mist onze Floriday-sync iets en is dat een bevinding op zichzelf.

- [ ] **Stap 5: Werk de documentatie bij**

- `README.md`: de nieuwe commando's `rfh-koppel`, `backfill-klok`, `rfh-typeproef` in de commandotabel, en een alinea over de tweede bron onder "Hoe het werkt".
- `docs/wat-er-gebouwd-is.md`: het klokaanbod als vierde laag.
- `docs/openstaand.md`: de meting uit spec §11.1 als openstaand punt, en het koppelen van productie zodra daar credentials zijn.
- `docs/vragen-voor-rfh.md`: de vier verschuivingen uit spec §12.

- [ ] **Stap 6: Commit**

```bash
git add README.md docs
git commit -m "docs: describe the clock supply ingest"
```

---

## Zelfcontrole van dit plan

**Spec-dekking.** §1 scope → taak 8 (`SNIJBLOEMEN_HOOFDGROEP`). §3.1 endpoint → taak 9. §3.2 dekking → taak 18 stap 4. §3.6b sneden → taak 8. §3.7 vergankelijke link → taak 10 en 11 (COALESCE). §4 sessie → taak 3, 4, 5, 12, 17. §5 tijdzone → taak 8. §6 ophaalstrategie → taak 13, 14, 15. §7 datamodel → taak 1, 10, 11. §9 risico's → taak 9 (schema faalt hard), 14 (`onvolledigeSneden`), 17 (dode sessie zichtbaar). §10 testen → elke taak. §11 metingen → openstaand, taak 18 stap 5.

**§8, het scherm, valt buiten dit plan.** Dat is bewust en staat bovenaan vermeld.

**Typen.** `ClockSupplyLineRow` wordt gedefinieerd in taak 9 en daarna ongewijzigd gebruikt in taak 10, 11 en 13. `ClockWriteResult` komt uit taak 11 en wordt in taak 13 geïmporteerd. `Snede` en `VEILLOCATIE_SLEUTELS` komen uit taak 8 en worden gebruikt in taak 7, 13 en 14. `TokenCache` wordt hergebruikt uit `@/features/floriday/client/token-cache`, niet opnieuw gedefinieerd.

**Volgorde.** Taak 7 schrijft een script dat pas kan draaien na taak 8 en 9; dat staat er expliciet bij, en het draaien ervan is een stap in taak 9. Taak 12 moet gedraaid zijn voordat taak 9 stap 7, taak 16 en taak 18 stap 3 iets kunnen ophalen.

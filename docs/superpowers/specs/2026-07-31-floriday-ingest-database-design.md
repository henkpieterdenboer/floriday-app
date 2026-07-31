# Deelproject A — Ingest en database

Datum: 31 juli 2026
Status: goedgekeurd, klaar voor implementatieplan

---

## 1. Doel en afbakening

Het klokvoorverkoop-aanbod uit Floriday binnenhalen en vastleggen in een eigen
PostgreSQL-database op Neon, zodat het doorzoekbaar wordt op assen die de API zelf niet
ondersteunt (veildatum, veillocatie, kweker, artikel) en zodat er een historisch archief
ontstaat dat elk uur wordt aangevuld.

**Binnen scope**

- Databaseschema op Neon.
- Eenmalige inhaalslag vanaf sequencenummer nul.
- Uurlijkse bijwerking die zichzelf herstelt na uitval.
- Lookups voor artikelnaam en kwekernaam.
- Zichtbaarheid op de uitvoering: wat draaide wanneer, met welk resultaat.

**Buiten scope** — elk een eigen deelproject met eigen ontwerp:

- **B** Zoekinterface met een grid dat serverside filtert en pagineert.
- **C** Dagelijkse doorgifte naar de interne informatievoorziening.

## 2. Wat we vooraf hebben vastgesteld

Alles hieronder is gemeten op de staging-omgeving op 31-07-2026, niet aangenomen.

| Bevinding | Consequentie voor het ontwerp |
|---|---|
| `clock-presales-supply/sync` levert aanbod van alle veillocaties en van kwekers waarmee wij géén connectie hebben | Geen connectieverzoeken nodig voor een landelijk beeld |
| `trade-items/sync` geeft `403 There are no connected suppliers` | Artikelen niet via sync, maar via `GET /trade-items?tradeItemIds=` |
| `GET /trade-items?tradeItemIds=` accepteert komma-gescheiden ID's; 100 ID's geeft een URL van 3752 tekens | Batchgrootte 100 |
| `organizations/sync` werkt wel zonder connecties | Normale sync, één keer per dag |
| Ongeveer één uniek artikel per zestien aanbodregels | De artikeltabel blijft klein ten opzichte van het aanbod |
| Sequencenummers volgen het moment van wijzigen, niet de veildatum | Niet op datum instappen; hele reeks doorlopen en upserten op `supplyLineId` |
| Ordervenster: dagelijks 07:00 UTC tot 03:55 of 04:25 UTC de volgende ochtend | Uurlijkse sync geeft ongeveer 21 meetpunten per veildag |
| `numberOfPieces` daalt mee met verkopen in de voorverkoop | De eindstand is het onverkochte restant, niet het aanbod — daarom een versietabel |
| Staging bevat data van mei 2024 tot heden | De inhaalslag is hier volledig te bouwen en te draaien |

### Belangrijke beperking

Klokvoorverkoop is volgens `supply-type-overview` *"a percentage of available quantity of
potential Clock sales supply"*, uitsluitend via het FloraMondo-kanaal, en het onverkochte
deel gaat na sluiting van het ordervenster door naar de klok.

**Wat we hier bouwen is dus het voorverkoopaanbod, niet het volledige klokaanbod.**
Intern mag die belofte niet gedaan worden. De vraag hoe we wél aan het volledige
klokaanbod komen ligt bij Royal FloraHolland (zie `docs/concept-mail-arjan.md`). Het
datamodel en de pipeline blijven bruikbaar als daar een breder endpoint uit komt.

Daarnaast één tegenstrijdigheid om te verifiëren zodra we op productie zitten: de
documentatie beschrijft het endpoint als *"from all the suppliers in your network"*,
terwijl wij zonder enige connectie 35 kwekers binnenkrijgen. Ofwel "network" betekent hier
alle deelnemers aan het veilingkanaal, ofwel staging past het filter niet toe.

### Wat de inhaalslag niet kan

Een sync vanaf sequencenummer nul levert de *huidige* staat van elke regel, niet het
verloop dat die regel ooit had. Voor alles tot vandaag krijgen we dus restanten. Verloop
bouwen we pas op vanaf het moment dat de uurlijkse sync gaat draaien.

## 3. Architectuur

```
Floriday Customers API (staging, later productie)
        │
        │  sync-module — één implementatie, twee aanroepers
        │    ├─ client    token-cache 3540s, dubbele headers,
        │    │            3 req/s, retry met oplopende wachttijd
        │    ├─ resources klokaanbod · organisaties · artikelen
        │    └─ cursor    laatste sequencenummer per bron
        ▼
Neon Postgres — Prisma 6 met @prisma/adapter-neon
        ▲
        │  npm run backfill    lokaal, geen timeout, hervatbaar
        │  /api/cron/sync      Vercel Cron, elk uur
```

Het verschil tussen inhaalslag en bijwerking zit niet in de code maar in het startpunt:
de backfill begint bij nul, de cron begint waar de vorige run eindigde. Beide schrijven
hun voortgang weg en zijn daardoor afbreekbaar en hervatbaar.

Ritme per bron:

| Bron | Methode | Frequentie |
|---|---|---|
| Klokaanbod | `clock-presales-supply/sync` | elk uur |
| Organisaties | `organizations/sync` | een keer per dag |
| Artikelen | `GET /trade-items?tradeItemIds=` per 100 | na elke aanbodslag, alleen onbekende ID's |

## 4. Datamodel

Zes tabellen. Prisma-notatie, veld- en tabelnamen in het Engels.

### `SupplyLine` — actuele stand

Eén rij per aanbodregel, sleutel `supplyLineId`. Alle achttien API-velden uitgepakt,
plus `firstSeenAt` en `lastSeenAt` als eigen administratie.

```prisma
model SupplyLine {
  supplyLineId           String    @id @db.Uuid
  status                 SupplyStatus
  tradeItemId            String    @db.Uuid
  tradeItemVersion       Int?
  pricePerPiece          Decimal   @db.Decimal(12, 4)
  currency               String    @db.VarChar(3)
  numberOfPieces         Int
  deliveryNoteReference  String?
  deliveryNoteCode       String?
  deliveryNoteLetter     String?
  piecesPerPackage       Int?
  vbnPackageCode         Int?
  customPackageId        String?   @db.Uuid
  packagesPerLayer       Int?
  layersPerLoadCarrier   Int?
  loadCarrier            String?
  tradePeriodStart       DateTime  @db.Timestamptz
  tradePeriodEnd         DateTime  @db.Timestamptz
  supplierOrganizationId String    @db.Uuid
  sequenceNumber         BigInt
  creationDateTime       DateTime  @db.Timestamptz
  lastModifiedDateTime   DateTime? @db.Timestamptz
  auctionDate            DateTime  @db.Date
  initialAuctionLocation AuctionLocation
  photoUrl               String?

  firstSeenAt            DateTime  @db.Timestamptz
  lastSeenAt             DateTime  @db.Timestamptz

  versions               SupplyLineVersion[]

  @@index([auctionDate, initialAuctionLocation])
  @@index([supplierOrganizationId])
  @@index([tradeItemId])
  @@index([status])
  @@index([sequenceNumber])
}
```

### `SupplyLineVersion` — archief

Append-only, dezelfde inhoudelijke kolommen plus `observedAt`. De unieke sleutel op
`(supplyLineId, sequenceNumber)` maakt de ingest idempotent: een sync die per ongeluk
twee keer draait verandert niets.

```prisma
model SupplyLineVersion {
  id             BigInt   @id @default(autoincrement())
  supplyLineId   String   @db.Uuid
  sequenceNumber BigInt
  observedAt     DateTime @db.Timestamptz

  status                 SupplyStatus
  tradeItemId            String    @db.Uuid
  tradeItemVersion       Int?
  pricePerPiece          Decimal   @db.Decimal(12, 4)
  currency               String    @db.VarChar(3)
  numberOfPieces         Int
  deliveryNoteReference  String?
  deliveryNoteCode       String?
  deliveryNoteLetter     String?
  piecesPerPackage       Int?
  vbnPackageCode         Int?
  customPackageId        String?   @db.Uuid
  packagesPerLayer       Int?
  layersPerLoadCarrier   Int?
  loadCarrier            String?
  tradePeriodStart       DateTime  @db.Timestamptz
  tradePeriodEnd         DateTime  @db.Timestamptz
  supplierOrganizationId String    @db.Uuid
  creationDateTime       DateTime  @db.Timestamptz
  lastModifiedDateTime   DateTime? @db.Timestamptz
  auctionDate            DateTime  @db.Date
  initialAuctionLocation AuctionLocation
  photoUrl               String?

  supplyLine SupplyLine @relation(fields: [supplyLineId], references: [supplyLineId])

  @@unique([supplyLineId, sequenceNumber])
  @@index([supplyLineId, observedAt])
}
```

Alle inhoudelijke velden staan er dus in, zodat elke versie op zichzelf te lezen is zonder
naar de hoofdtabel te hoeven kijken. Wat ontbreekt is alleen `firstSeenAt` en `lastSeenAt`
— die horen bij de administratie van de hoofdtabel, niet bij een waarneming.

### `TradeItem` — artikelen

Doorzoekbare velden als kolom, geneste lijsten als `jsonb`.

```prisma
model TradeItem {
  tradeItemId            String   @id @db.Uuid
  supplierOrganizationId String   @db.Uuid
  name                   String
  vbnProductCode         Int?
  code                   String?
  gtin                   String?
  botanicalNames         String[]
  countryOfOriginIsoCodes String[]
  tradeItemVersion       Int?
  isDeleted              Boolean  @default(false)
  sequenceNumber         BigInt

  characteristics        Json?
  photos                 Json?
  packingConfigurations  Json?

  fetchedAt              DateTime @db.Timestamptz

  @@index([name])
  @@index([vbnProductCode])
  @@index([supplierOrganizationId])
}
```

### `Organization` — kwekers

```prisma
model Organization {
  organizationId   String   @id @db.Uuid
  name             String?
  commercialName   String?
  companyGln       String?
  rfhRelationId    String?
  organizationType String?
  city             String?
  countryCode      String?  @db.VarChar(2)
  endDate          DateTime? @db.Timestamptz
  sequenceNumber   BigInt

  @@index([name])
  @@index([companyGln])
}
```

### `SyncState` — cursor per bron

```prisma
model SyncState {
  resource           String   @id          // clock_presales_supply | organizations
  lastSequenceNumber BigInt   @default(0)
  updatedAt          DateTime @updatedAt @db.Timestamptz
}
```

### `SyncRun` — uitvoeringslog

```prisma
model SyncRun {
  id             BigInt    @id @default(autoincrement())
  resource       String
  trigger        SyncTrigger                    // BACKFILL | CRON | MANUAL
  startedAt      DateTime  @db.Timestamptz
  finishedAt     DateTime? @db.Timestamptz
  pagesProcessed Int       @default(0)
  rowsProcessed  Int       @default(0)
  rowsInserted   Int       @default(0)
  versionsAdded  Int       @default(0)
  status         SyncStatus                     // RUNNING | SUCCEEDED | FAILED
  errorMessage   String?

  @@index([resource, startedAt])
}
```

### Enums

```prisma
enum SupplyStatus    { AVAILABLE UNAVAILABLE }

enum AuctionLocation { AALSMEER NAALDWIJK RIJNSBURG EELDE PLANTION RHEINMAAS DIGITAL }

enum SyncTrigger     { BACKFILL CRON MANUAL }

enum SyncStatus      { RUNNING SUCCEEDED FAILED }
```

`SupplyStatus` en `AuctionLocation` volgen de waarden uit de OpenAPI-specificatie. Komt er
bij een halfjaarlijkse release een waarde bij die wij niet kennen, dan faalt de ingest op
die regel — dat is gewenst gedrag: liever een melding dan een stilzwijgend verkeerd
opgeslagen locatie.

### Ontwerpkeuzes

- **Prijzen als `Decimal`, nooit als floating point.** Bij geld leidt dat vroeg of laat
  tot centen die niet kloppen.
- **De versietabel krijgt uitgepakte kolommen, geen ruwe JSON-blob.** De API levert een
  vast en overzichtelijk aantal velden, dus er valt niets te missen, en uitgepakte
  kolommen zijn direct doorzoekbaar.
- **Bij `TradeItem` wél `jsonb`** voor kenmerken, foto's en verpakkingsconfiguraties:
  geneste lijsten met wisselende inhoud, waarvan we nu niet weten welke delen we straks
  nodig hebben.
- **Indexen** liggen op de assen waarop deelproject B gaat filteren: veildatum met
  veillocatie, kweker, artikel, status.

## 5. De sync-module

Drie lagen, elk apart te testen.

### Client

Doet alles wat met HTTP te maken heeft en niets daarbuiten:

- Token ophalen en 3540 seconden vasthouden, zoals Royal FloraHolland voorschrijft.
- Beide headers meesturen: `Authorization: Bearer` en `X-Api-Key`.
- Afknijpen op drie verzoeken per seconde — marge onder de limiet van 3,4.
- Opnieuw proberen bij `429` en `5xx`, met oplopende wachttijd, maximaal vijf pogingen.
- Bij `401`: token één keer vernieuwen en herhalen. Blijft het falen, dan stoppen met een
  duidelijke melding.

### Resource-laag

Weet hoe je één bron doorloopt:

- Pagineren op `limit=1000`.
- Cursor is het `sequenceNumber` van de laatste regel op de pagina.
- Klaar als de cursor `maximumSequenceNumber` uit het antwoord bereikt.
- Eindigt een run met een lege pagina terwijl de cursor nog onder het maximum ligt, dan
  komt dat als waarschuwing in `SyncRun.errorMessage` in plaats van dat het stilzwijgend
  goed lijkt te gaan. De documentatie waarschuwt hiervoor bij bronnen die op connecties
  filteren; voor het klokaanbod is vastgesteld dat dat niet speelt, maar de controle
  blijft staan omdat dat gedrag kan veranderen.

### Schrijflaag

Verwerkt een pagina in één transactie, in deze volgorde:

1. **Versies bijschrijven, maar alleen als er inhoudelijk iets verandert.** In drie
   stappen:

   a. De bestaande rijen ophalen voor de `supplyLineId`'s van deze pagina — één query met
      een `IN`-lijst van maximaal duizend sleutels.
   b. Een pure functie bepaalt welke binnengekomen regels afwijken van wat er staat. Geen
      database, geen netwerk, dus volledig te testen met vaste invoer.
   c. Alleen die regels invoegen, met `skipDuplicates` op de unieke sleutel.

   Dit moet vóór stap 2, want daarna is de vergelijkingsbasis overschreven. De eerste
   waarneming van een regel schrijft altijd weg, omdat er dan nog geen rij bestaat.

   De vergelijking gebeurt bewust in TypeScript en niet in SQL. Een `NOT EXISTS` over
   twintig kolommen vereist `IS NOT DISTINCT FROM` in plaats van `=` — anders levert elke
   vergelijking waarin beide kanten `NULL` zijn geen match op en schrijf je alsnog elke
   keer weg. Dat is een stille fout die pas maanden later opvalt als het archief is
   volgelopen. Een pure functie met tests eromheen is hier veiliger dan slimme SQL.

2. Hoofdtabel bijwerken (`upsert`, met `lastSeenAt` altijd bij, `firstSeenAt` alleen bij
   invoegen).
3. Cursor ophogen in `SyncState`.

Die volgorde is het hele herstelverhaal: de cursor loopt nooit voor op de data. Een run
die halverwege sneuvelt laat geen gat achter maar hooguit werk dat opnieuw gedaan wordt.

Twee mechanismen houden het archief schoon, en ze vangen verschillende dingen af. De
unieke sleutel voorkomt dubbele rijen als dezelfde pagina opnieuw verwerkt wordt. De
`NOT EXISTS` voorkomt betekenisloze versies wanneer Floriday een regel een nieuw
sequencenummer geeft zonder inhoudelijke wijziging — zie de toelichting bij de
testaanpak.

### Artikelen bijwerken

Na elke aanbodslag: de `tradeItemId`'s verzamelen die nog niet in `TradeItem` staan, en
die ophalen in blokken van honderd via `GET /trade-items?tradeItemIds=a,b,c`. Bij de
inhaalslag is dit het meeste werk; daarna zijn het er per dag een paar.

## 6. Foutafhandeling en zichtbaarheid

Uitgangspunt: een mislukte run mag nooit tot stille gaten leiden. Dat is grotendeels
opgelost door het sequence-mechanisme — slaat de cron een keer over, of ligt Neon er even
uit, dan haalt de volgende run vanzelf alles in. Er is geen tijdvenster dat je kunt missen.

`SyncRun` legt per run vast wat er gebeurd is. Dat is iets anders dan de cursor bijhouden:
het is wat je nodig hebt als iemand over drie maanden vraagt waarom er een dag lijkt te
ontbreken. Deelproject B toont straks wanneer de laatste geslaagde run was, zodat niemand
naar verouderde data kijkt zonder het te weten.

Bewust géén automatisch herstel op:

- Een `403` op de artikelen-lookup.
- Een onverwacht andere veldstructuur.

Dat zijn signalen dat er aan de Floriday-kant iets veranderd is — er zijn twee releases per
jaar — en dan hoort er een melding te komen, geen script dat er omheen werkt.

## 7. Testaanpak

**Unittests, zonder netwerk.** Het omzetten van een API-antwoord naar databasekolommen, de
cursorlogica, het afknijpen van verzoeken, het bepalen welke artikel-ID's ontbreken. Als
vaste invoer echte antwoorden van staging, opgeslagen als fixtures — zo testen we tegen de
werkelijkheid en niet tegen verzonnen JSON.

**Integratietests tegen een aparte Neon-branch**, met een klein bereik van twee pagina's.
Daarvan doet er één het meest toe:

> Dezelfde sync twee keer draaien en controleren dat het aantal rijen niet verandert.

Slaagt die, dan weten we dat overdoen veilig is, en daar rust het hele herstelverhaal op.

**Eén test die er los van staat maar hier nodig is: groeit `SupplyLineVersion` alleen bij
een echte wijziging?**

De unieke sleutel vangt het geval af waarin dezelfde regel met hetzelfde sequencenummer
opnieuw langskomt. Wat die sleutel *niet* afvangt is het geval waarin Floriday een regel
een nieuw sequencenummer geeft zonder dat er inhoudelijk iets verandert — bijvoorbeeld bij
een technische herindexering aan hun kant. Dan schrijven wij een versie bij die niets
betekent, en groeit het archief met ruis.

Op staging hebben we daar een aanwijzing voor gezien: 558 regels droegen exact hetzelfde
wijzigingstijdstip, wat op een bulkoperatie wijst en niet op handelsgedrag. De test
controleert daarom dat een versie alleen wordt bijgeschreven als minstens één inhoudelijk
veld afwijkt van de vorige waarneming. Dat is een vergelijking bij het schrijven, geen
filter achteraf.

## 8. Randvoorwaarden en aannames

| | |
|---|---|
| Neon | Account aanwezig. Twee losse projecten voor test en productie, geen branches — conform de projectafspraken |
| Vercel | Pro-abonnement aanwezig, dus cron mag vaker dan een keer per dag |
| Prisma | Versie 6 met `@prisma/adapter-neon`. Niet Prisma 7 |
| Schemawijzigingen | `prisma db push`, niet `prisma migrate dev` |
| Git | Het project is nog geen repository. Initialiseren is de eerste stap van het implementatieplan |
| Omgeving | Bouwen en testen op staging; productiecredentials en een productie-API-key volgen later |

### Openstaande punten

1. **Dekking van het voorverkoopaanbod** ten opzichte van het volledige klokaanbod — ligt
   bij Royal FloraHolland.
2. **Geldt het netwerkfilter op productie wel?** Verifiëren zodra we productiecredentials
   hebben.
3. **Omvang van de productiedataset.** Op staging is de inhaalslag ongeveer 1,2 miljoen
   regels in zes minuten. Productie kan een veelvoud zijn; dat raakt de opslagkosten op
   Neon, niet het ontwerp.

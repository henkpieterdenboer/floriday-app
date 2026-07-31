# Floriday API — inventarisatie input & verkenning

Datum: 27 juli 2026, bijgewerkt 31 juli 2026
Doel: middleware tussen Floriday en onze eigen informatievoorziening, met als eerste
deliverable een overzicht van al het aanbod dat voor de klok komt.

> **Status 31-07-2026:** de koppeling werkt end-to-end op staging. Token + API key zijn
> rond, en `clock-presales-supply` levert daadwerkelijk aanbod van alle veillocaties en
> van leveranciers waarmee wij géén connectie hebben. Zie §2, §4 en §5.

---

## 1. Wat zat er in `input/`

| Bestand | Inhoud |
|---|---|
| `Re Veilingnummers tbv test toegang API.eml` | Staging credentials **suppliers**, link naar docs, uitleg release-ritme |
| `Client Credentials Floriday (Customers).eml` | Staging credentials **customers** |
| `Welkom bij Floriday.eml` | Uitnodiging Floriday UI staging (onboarding-link) |
| `Link naar online knowledge API.url` | Helpcenter "koppelen met Floriday" |

### Contactpersoon
Arjan Duijkers — Integration Consultant, Royal FloraHolland
(arjanduijkers@royalfloraholland.com)

### Onze nummers
- `423765` — koper (customers-kant)
- `75178` — verkoper (suppliers-kant)
- Organisatie in Floriday: Coloriginz, GLN `8714231192756`

### Credentials (staging)
Staan nu nog in de `.eml`-bestanden. Horen in een `.env` die niet in git komt.

| Omgeving | Client ID | Client Secret |
|---|---|---|
| Staging **customers** | `pmE98nBtRJ5rWqgM61Yb` | `FLORIDAY_CUSTOMERS_CLIENT_SECRET` |
| Staging **suppliers** | `wqJo3SYM1zEZ0VXLjyKg` | `FLORIDAY_SUPPLIERS_CLIENT_SECRET` |

### Overige afspraken uit de mail
- Twee API-releases per jaar (winter- en zomerrelease).
- Token mag hergebruikt worden; geldigheid instellen op **3540 seconden**.
- RFH wil expliciet dat we de **sequence endpoints** gebruiken.
- Uitnodiging voor Slack-kanaal van RFH volgt; ontwikkelaar moet nog doorgegeven.
- Openstaande vraag van Arjan: wil je een collega langs voor **Daytrade**?

---

## 2. Authenticatie — getest en werkend

OAuth2 client credentials, identity provider is Okta.

```
POST https://idm.staging.floriday.io/oauth2/ausmw6b47z1BnlHkw0h7/v1/token   (staging)
POST https://idm.floriday.io/oauth2/aus3testdcf2vyfs70i7/v1/token           (productie)

Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials
client_id=...
client_secret=...
scope=role:app catalog:read organization:read supply:read sales-order:read ...
```

**Getest op 27-07-2026 met de customers-credentials: werkt.** Response bevat
`access_token`, `expires_in: 3600`, en de toegekende scopes.

Elke API-call heeft **twee** headers nodig:

```
Authorization: Bearer <access_token>
X-Api-Key: <api key>
```

### De X-Api-Key — opgelost op 31-07-2026

Diagnose vooraf, tegen `/auction/clock-presales-supply/max-sequence-number`:

- alleen Bearer-token → `401 invalid-access-token`
- Bearer + dummy X-Api-Key → `403 "The specified api key is invalid."`

Het token werd dus geaccepteerd; de API key was de enige ontbrekende schakel.
Dat de token `organizationIds: []` bevat past hierbij — de koppeling met Coloriginz
loopt via de API key, niet via het token.

**De key staat nu in `.env` als `FLORIDAY_CUSTOMERS_API_KEY`.** Voor de suppliers-kant
is nog geen key aangemaakt.

#### Hoe je aan de API key komt (en waarom dat lastig is)

De key hoort bij de combinatie *organisatie + applicatie* en wordt aangemaakt in de
Floriday UI onder **Instellingen → Apps & koppelingen → Integraties**. Onze eigen
integratie heet daar **Coloriginz (Customers)**; de URL van de detailpagina is
`/settings/apps/details/pmE98nBtRJ5rWqgM61Yb` — het laatste deel is exact onze client id,
zo herken je welke integratie bij welke credentials hoort.

De valkuil: **de key is uitsluitend zichtbaar op het moment dat je op "Add integration"
klikt.** Daarna toont de detailpagina alleen nog "Installed" met een prullenbak — geen
"toon key", geen "regenereer". De UI zegt het letterlijk:

> "Be sure to copy the API Key, which will be shown in this screen... If you forgot to
> copy the API Key, you can remove and re-add the application, to acquire a new API Key."

Dus als de key kwijt is: **integratie verwijderen en opnieuw toevoegen**. Dat is precies
wat we hier gedaan hebben. Er verschijnt daarbij een bevestiging ("Delete?") en bij het
opnieuw toevoegen een informatieve melding dat API-gebruik onder een abonnementstarief
valt — geen aparte akkoordvinkje. Let op: er komt een **nieuwe** key uit, de oude vervalt.
Doe dit dus niet zomaar als er al iets in productie op draait.

Bewijs dat het werkt (`node scripts/test-connection.mjs`, 31-07-2026):

```
1. Requesting access token...      OK - expires in 3600s
2. max-sequence-number             OK - 501530037
3. sync/0?limit=50                 OK - 50 lines
```

---

## 3. API-landschap

Drie afzonderlijke API's, elk met eigen swagger:

| API | Spec | Voor wie |
|---|---|---|
| Customers | `https://api.staging.floriday.io/customers-api-2026v1/swagger/UUID/swagger.json` | kopers — 148 endpoints |
| Suppliers | `https://api.staging.floriday.io/suppliers-api-2026v1/swagger/UUID/swagger.json` | aanvoerders — 231 endpoints |
| Marketplace | idem patroon | marktplaats-partijen |

Beide specs staan gedownload in `docs/api-specs/` (publiek toegankelijk, geen auth nodig).
Documentatie-index: `https://developer.floriday.io/llms.txt` — een complete lijst van
alle 132 doc-pagina's als markdown, ideaal om gericht te lezen.

### Synchronisatiepatroon

Vrijwel alle collecties werken met sequence numbers in plaats van filters op datum:

```
GET /<resource>/current-max-sequence          → hoogste sequenceNumber
GET /<resource>/sync/{sequenceNumber}?limit=  → max 1000 gewijzigde records vanaf dat nummer
```

Je bent bij als `maximumSequenceNumber` gelijk is aan je eigen laatste nummer.
Let op de waarschuwing uit de docs: een lege resultset betekent **niet** dat je bij bent —
resultaten worden gefilterd op je connecties, terwijl de max sequence gewoon oploopt.

Rate limit op de relevante endpoints: **3.4 requests/seconde, burst 1000**.
Aanbevolen sync-frequentie voor supply/trade items: 1–5 minuten.

---

## 4. Klokaanbod — de kern van de vraag

### Wat er in de Customers API zit

| Endpoint | Wat |
|---|---|
| `GET /auction/clock-presales-supply/max-sequence-number` | max sequence |
| `GET /auction/clock-presales-supply/sync/{seq}?limit=&postFilterConnections=` | **volledige sync van voorverkoop-klokaanbod** |
| `GET /auction/clock-presales-supply/{supplyLineId}` | losse regel |
| `GET /auction/clock-supply/{supplyLineId}` | losse klokregel — **alleen op ID** |
| `POST /auction/clock-presales-order` | kopen in voorverkoop |

`ClockPresalesSupplyLine` bevat precies wat we voor het overzicht nodig hebben:

```
supplyLineId, status, tradeItemId, tradeItemVersion, pricePerPiece,
deliveryNoteReference / deliveryNoteCode / deliveryNoteLetter,
numberOfPieces, packingConfiguration, tradePeriod,
supplierOrganizationId, sequenceNumber,
auctionDate, initialAuctionLocation, photoUrl
```

`ClockSupplyLine` (het echte klokaanbod) is rijker — met o.a. `auctionGroupCode`,
`qualityGroupCode`, `minimumPricePerPiece`, `minimumOrderQuantity`, `auctionStatus`
(`QUEUED_FOR_AUCTION`, `IN_AUCTION`, `AUCTION_COMPLETED`, …) en `auctionLocation`
(`AALSMEER`, `NAALDWIJK`, `RIJNSBURG`, `EELDE`, `PLANTION`, `RHEINMAAS`, `DIGITAL`).

### Het knelpunt

In de **Suppliers** API bestaat wél een volledige sync op klokaanbod:

```
GET /clock-supply-lines/current-max-sequence
GET /clock-supply-lines/sync/{sequenceNumber}
```

maar die geeft alleen **onze eigen aanvoer** (nummer 75178).

In de **Customers** API is `clock-supply` alleen per `supplyLineId` op te vragen —
er is geen lijst- of sync-endpoint. Het brede klokaanbod komt langs de customers-kant
dus alleen via **clock-presales-supply** binnen.

### Wat de meting laat zien (31-07-2026)

Twaalf pagina's van 1000 regels opgehaald vanaf sequence 0 op staging:

| | |
|---|---|
| Opgehaalde regels | 12.000 (in 12 seconden, ruim binnen de rate limit) |
| Unieke leveranciers | **35** |
| Veillocaties | AALSMEER 4794, NAALDWIJK 4326, RIJNSBURG 1964, EELDE 826, PLANTION 81, RHEINMAAS 9 |
| Veildatums | aaneengesloten reeks 21-05-2024 t/m 02-08-2024 |
| Status | UNAVAILABLE 11.986, AVAILABLE 14 |
| Sequence-range | 500.121.058 → 501.530.037 |

Twee conclusies die het beeld uit §4 wezenlijk bijstellen:

1. **Het is niet gefilterd op connecties.** Wij hebben nul connecties in Floriday
   ("Make your first connection" staat nog open in het profiel) en krijgen tóch aanbod
   van 35 leveranciers en alle zes veillocaties binnen. De waarschuwing uit de docs over
   filtering op connecties geldt hier dus niet — dat scheelt: we hoeven geen
   connectieverzoeken bij kwekers uit te zetten om een landelijk beeld te krijgen.
2. **De structuur klopt met wat we willen tonen:** veildatum, veillocatie, aantal stuks,
   prijs per stuk, fust/belading, partijbrief (`deliveryNoteReference`) en foto.

De staging-dataset zelf is bevroren testmateriaal uit mei–augustus 2024 — vandaar dat
vrijwel alles `UNAVAILABLE` is. Voor volumes en actualiteit zegt staging dus niets;
de structuur en de reikwijdte wél.

### Wat nog open staat

`clock-presales-supply` is klokvóórverkoop (KVV). Het helpcenter beschrijft dat als een
volwaardig inkoopkanaal — *"Met Klokvoorverkoop (KVV) in Floriday kun je al vóór het
veilen klokaanbod inkopen... Het aanbod via de API is heel compleet"* — maar de API-docs
noemen het *een percentage van de potentiële klokvoorraad*, exclusief via FloraMondo.
Die twee uitspraken bijten elkaar.

Zolang staging alleen oude testdata bevat kunnen we niet zelf meten welk deel van het
werkelijke klokaanbod hierin zit. **Blijft dus een vraag aan Arjan** (zie
`concept-mail-arjan.md`), maar het is geen bouwblokkade meer: de route werkt en levert
bruikbare data. Zodra we productiecredentials hebben kunnen we het volume vergelijken
met wat er feitelijk op de klok komt.

De rest van het overzicht (productnaam, kweker, fust, foto) komt uit:
`/trade-items/sync/{seq}` en `/organizations/sync/{seq}` — die hebben we sowieso
nodig als lookup-tabellen naast de supply lines.

---

## 5. De Floriday UI (staging) — rondgang 31-07-2026

Ingelogd als `Henk.Pieter.den.Boer@coloriginz.com`, organisatie Coloriginz.
Admin-rechten zijn door RFH toegekend, dus alle instellingen-tabbladen zijn zichtbaar.

| | |
|---|---|
| UI | `https://customers.staging.floriday.io` |
| Organisatie-id | `d23dc3e5-6d2f-3e87-b318-173f5513fac3` |
| GLN / veilingnummer | `8714231192756` / `423765` |
| Bedrijfsnaam in Floriday | Coloriginz (juridische naam: OZ Import BV) |

### Waar de relevante instellingen zitten

Alles via de drie puntjes rechtsboven → **Instellingen**.

| Pad | Wat het doet | Onze stand |
|---|---|---|
| Apps & koppelingen → Apps | Externe apps die aan de organisatie hangen | RFH Auction, RFH Pre-Auction gekoppeld |
| Apps & koppelingen → Integraties | Onze eigen API-koppeling + **de API key** (zie §2) | Coloriginz (Customers), installed |
| Integratie | Filter op welke *trade items* meegesynchroniseerd worden bij nieuwe connecties | staat op **None**, alle bronnen uit |
| Systeem → Personalisatie | Quick / Advanced / **Clock mode** | staat op Quick mode |
| Systeem → VMP-accounts | VMP-koppeling, o.a. voor Klokvoorverkoop | geen accounts |
| Systeem → EKT/V-EKT | Koopbrieven per e-mail (ná de order) | V-EKT staat aan, geen e-mailadres ingevuld |

Twee dingen om te onthouden:

- **"Integratie → Synchronize trade items for new connections" staat op None** en alle
  bronnen (catalogusprijzen, partijprijzen, aanbiedingen, inkooptips) staan uit. Dat
  verklaart de "0 supply lines / 0 suppliers" op die pagina. Dit raakt alleen het
  *directe* aanbod, niet de klok — voor klokvoorverkoop is het niet nodig. Als we later
  ook direct aanbod willen, moet dit aan.
- **EKT/V-EKT is niet de gestopte aanbodmail.** Dit gaat over koopbrieven ná een order,
  niet over het aanbod vooraf. De V-EKT is de voorlopige koopbrief bij een
  klokvoorverkoop-order.

### Alternatieve route: VMP-koppeling voor Klokvoorverkoop

Naast de API bestaat er een tweede weg naar hetzelfde aanbod, en die lijkt qua opzet nog
het meest op de gestopte e-mailservice: **Instellingen → Systeem → VMP-accounts →
VMP-account toevoegen → Klokvoorverkoop**. Je krijgt dan gebruikersnaam, wachtwoord en
een VMP-URL (wachtwoord wordt één keer getoond), en je kunt filteren op:

- productgroepen
- veillocatie (RFH-hub)
- kwaliteitsgroepen
- aanbieders in-/uitsluiten
- alleen eerstvolgende veildatum, of alles
- alleen wat op dat moment bestelbaar is
- zetelnummers en plaatnummers per RFH-hub

**Hieraan hangt een maandelijks tarief per administratienummer.** Bij het openen van de
pagina verschijnt meteen een akkoordvraag over die kosten; daar is niet op geklikt.
RFH positioneert de VMP zelf als de verouderde route en de API als de toekomstvaste —
de API kan alles wat de VMP kan en meer. De VMP is vooral relevant als vergelijkings-
materiaal, of als snelle tussenoplossing.

### Bronnen in het helpcenter

- Apps & koppelingen / API key: `helpcenter-customers.floriday.com/nl/articles/4688300`
- Voordelen API-koppeling (incl. KVV): `.../articles/8177090`
- VMP-koppeling voor Klokvoorverkoop: `.../articles/14078889`

---

## 6. Wat nu

**Afgerond:**
1. ~~Staging-account activeren~~ — gedaan.
2. ~~Admin-rechten via Arjan~~ — gedaan.
3. ~~API key aanmaken en veiligstellen~~ — staat in `.env`, koppeling getest en werkend.
4. ~~Credentials naar `.env` + `.gitignore`~~ — gedaan.
5. ~~Deelproject A: ingest en database~~ — opgeleverd. Zie `README.md` voor gebruik. De
   volledige backfill van staging leverde 525.458 aanbodregels op, 79.004 artikelen,
   67.342 organisaties, 2.410 kwekers over 761 veildagen van 21-05-2024 tot 02-08-2027.
   Opnieuw draaien voegt niets toe.

**Open, aan RFH-kant:**
5. Bevestiging welk deel van het klokaanbod via `clock-presales-supply` binnenkomt
   (zie §4). Niet meer blokkerend, wel bepalend voor de belofte die we intern doen.
6. Productiecredentials + productie-API key, zodra de opzet staat.

**Kan alvast:**
7. Ontwikkelaar doorgeven voor het Slack-kanaal.
8. Antwoord op de Daytrade-vraag.
9. Suppliers-kant: API key aanmaken als we ook onze eigen aanvoer willen ontsluiten.
10. Git initialiseren — het project is nog geen repository.

**Eerste bouwstap:** de sync-loop over `clock-presales-supply` met opslag van het laatst
verwerkte sequence number, plus `/trade-items/sync` en `/organizations/sync` als
lookup-tabellen voor productnaam en kwekernaam.

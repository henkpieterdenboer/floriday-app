# Wat er gebouwd is

Bijgewerkt: 7 augustus 2026.

Dit document is de inventaris: wat er staat, waar het staat, en waarom het zo werkt.
Voor gebruik zie `README.md`; voor de omgevingen `docs/omgevingen.md`.

---

## In het kort

Middleware tussen Floriday en de eigen informatievoorziening van Coloriginz. Het haalt het
klokvoorverkoop-aanbod op, archiveert het met versiehistorie in een eigen database, en
ontsluit het via een doorzoekbaar scherm achter een inlog.

De aanleiding: Royal FloraHolland stopte met de e-mailservice die het aanbod voor de klok
doorgaf. Dit vervangt die route.

| | |
|---|---|
| Aanbodregels in de testdatabase | 525.458 |
| Versies | 525.458 |
| Artikelen | 79.004 |
| Organisaties | 67.342 |
| Kwekers in het aanbod | 2.410 |
| Veildagen | 761, van 21-05-2024 t/m 02-08-2027 |
| Broncode | 92 bestanden |
| Tests | 315, verdeeld over 37 bestanden |
| Commits | 68 op `develop` |

**Belangrijke beperking, deels opgelost:** wat de Floriday-koppeling ophaalt is het
**voorverkoopaanbod**, niet het volledige klokaanbod. Gemeten op productie: 20,7% van het
klokaanbod heeft geen voorverkooplink en blijft voor die route dus onzichtbaar (spec
`2026-08-06-rfh-preauction-klokaanbod-design.md`, §3.2). Er ligt inmiddels een tweede,
zelfstandige bron die het volledige klokaanbod wél binnenhaalt — zie laag 4 hieronder. Die
koppeling staat alleen op staging; op productie moet een mens hem nog met de hand leggen
(`docs/openstaand.md`).

---

## De vier lagen

### 1. Ophalen en archiveren

`src/features/floriday/`

| Map | Wat het doet |
|---|---|
| `client/` | HTTP naar Floriday: token-cache (3540 s), rate limiter (3/s), retry op 429, 5xx én verbroken verbindingen, dubbele headers |
| `schemas/` | Zod-schema's per bron, gevalideerd tegen echt opgehaalde antwoorden |
| `mappers/` | API-payload naar databasekolommen |
| `sync/` | De synchronisatie zelf: pagineren, wijzigingen bepalen, wegschrijven, cursor en runlog |

De kern is `sync/write-supply-page.ts`. Die verwerkt een pagina in één transactie: eerst
lezen wat er staat, dan bepalen wat er inhoudelijk veranderd is, dan de hoofdtabel bijwerken
met één bulk-statement, dan de versies bijschrijven.

Twee dingen daarin zijn niet vrijblijvend. De volgorde van bijwerken en versies bijschrijven
ligt vast door een foreign key. En de transactie eromheen is dragend: sneuvelt het proces
ertussenin, dan staat de hoofdtabel al bij terwijl de versie ontbreekt, en de volgende run
ziet geen verschil meer — precies het gegeven waarvoor het archief bestaat zou dan
stilzwijgend verdwijnen.

### 2. Toegang

`src/features/auth/`

Inloggen met e-mailadres en wachtwoord (NextAuth, JWT-sessies, argon2id). Geen
zelfregistratie: een beheerder nodigt uit, de uitgenodigde stelt via een eenmalige link een
wachtwoord in.

Microsoft Entra staat voorbereid maar uit. `entra-linking.ts` bevat de beslisregels als
pure functie, met tien tests eromheen — die kunnen dus volledig getest worden zonder
identity provider.

De regel die alles draagt: **SSO geeft toegang tot bestaande accounts en maakt er nooit
zelf een aan.** Zonder die regel kan iedereen met een werkmailadres binnenlopen op het
moment dat de koppeling live gaat.

### 3. Zoeken

`src/features/supply-search/` en `src/app/(protected)/aanbod/`

Eén scherm met datumpresets, filters, en een schakelaar tussen losse regels en een
samenvatting over vier assen. De database filtert, sorteert en pagineert; het scherm toont
vijftig rijen tegelijk.

De hele filterstand staat in de URL. Daarmee is een selectie deelbaar, werkt de terugknop,
en kan doorklikken vanuit de samenvatting de filters behouden.

### 4. Klokaanbod (tweede bron)

`src/features/rfh-preauction/`

Een tweede, zelfstandige ingest, opgebouwd naar hetzelfde patroon als laag 1 — client,
Zod-schema, mapper, wijzigingsdetectie, versiearchief, `SyncRun` — maar tegen een andere
bron: niet de Floriday-API, maar de JSON-API achter het RFH Pre-Auction-scherm zelf
(`clock-supply-search`). Zie `docs/superpowers/specs/2026-08-06-rfh-preauction-klokaanbod-design.md`.

Twee verschillen bepalen het ontwerp:

- **Sneden in plaats van een cursor.** Er is geen volgnummerreeks, dus de sync loopt over
  veildatum × veillocatie. Daarmee is er ook geen bewijs van volledigheid zoals de
  `max-sequence-number` aan de Floriday-kant dat geeft.
- **Een roulerende gebruikerssessie in plaats van client credentials.** Dit spreekt hetzelfde
  verzoek na dat de webapplicatie zelf doet, met een persoonlijk gebruikerstoken. De refresh
  token erachter rouleert bij elk gebruik en staat daarom in `RfhSession` in de database, niet
  in een omgevingsvariabele — een cronrun kan geen env-var terugschrijven. Het koppelen zelf
  (`npm run rfh-koppel`) is en blijft een handmatige stap: de token is maar één keer zichtbaar,
  in een browser, en er is geen manier om een verlopen sessie vanuit code te herstellen.

De koppeling met de bestaande voorverkoop loopt via `clockPresalesSupplyLineId`, en die is
vergankelijk: RFH laat de verwijzing los zodra de veildag geweest is (nul van 540 gemeten op
al voorbije veildagen). Vandaar dat de vijfminutensync (`/api/cron/klok`) belangrijker is dan
de eenmalige inhaalslag (`npm run backfill-klok`) — alleen de lopende sync vangt de koppeling
terwijl zij nog leeft. Eenmaal opgeslagen blijft de koppeling staan, ook als RFH hem later
loslaat.

Scope: uitsluitend snijbloemen, vastgelegd in het ontwerp — kamerplanten en tuinplanten
blijven buiten beschouwing.

---

## Wat waar staat

```
prisma/schema.prisma          11 tabellen, 5 enums
prisma/applied.prisma         wat er is toegepast — niet met de hand aanpassen

src/lib/                      env-validatie, Prisma-client, mail, load-env
src/middleware.ts             beschermt /aanbod en /beheer

src/features/floriday/        ophalen en archiveren (24 bestanden)
src/features/auth/            toegang (12 bestanden)
src/features/supply-search/   zoeken, pure logica (9 bestanden)
src/features/rfh-preauction/  klokaanbod, tweede bron (13 bestanden)

src/app/(public)/             login, uitnodiging
src/app/(protected)/          aanbod, gebruikersbeheer
src/app/api/cron/             drie cron-routes
src/app/api/auth/             NextAuth

scripts/                      backfill, backfill-klok, create-admin, invite, db-push,
                               fixtures, rfh-koppel, rfh-typeproef
tests/                        494 tests: unit (zonder netwerk) en integration (tegen Neon)
```

## De elf tabellen

| Tabel | Waarvoor |
|---|---|
| `SupplyLine` | Actuele stand van elke voorverkoop-aanbodregel |
| `SupplyLineVersion` | Append-only archief: elke inhoudelijke wijziging |
| `TradeItem` | Artikelen, voor de productnaam |
| `Organization` | Kwekers, voor de naam |
| `SyncState` | Laatst verwerkte sequencenummer per bron |
| `SyncRun` | Uitvoeringslog: wat draaide wanneer, met welke uitkomst — voor beide bronnen |
| `User` | Toegang, met rol en actief-vlag |
| `Invitation` | Uitnodigingen, alleen de hash van het token |
| `ClockSupplyLine` | Actuele stand van elke klokregel (RFH Pre-Auction) |
| `ClockSupplyLineVersion` | Append-only archief van de klokregels |
| `RfhSession` | Eén rij, draagt de roulerende refresh token voor RFH Pre-Auction |

---

## Wat er draait, en wanneer

| Wat | Wanneer | Waar |
|---|---|---|
| Voorverkoopaanbod bijwerken | elk uur, 5 over | `/api/cron/sync` |
| Klokaanbod bijwerken (RFH Pre-Auction) | elke 5 minuten | `/api/cron/klok` |
| Organisaties bijwerken | dagelijks 04:30 UTC | `/api/cron/organizations` |
| Volledige inhaalslag, voorverkoop | met de hand | `npm run backfill` |
| Inhaalslag klokaanbod, over de beschikbare maand | met de hand, eenmalig | `npm run backfill-klok` |

Alle drie de cron-routes zitten achter `CRON_SECRET`. De uurlijkse run is begrensd op twintig
pagina's, wat ongeveer dertig seconden kost van de driehonderd die Vercel toestaat. Loopt
hij achter, dan haalt de volgende run het in — de cursor bepaalt waar hervat wordt, niet
de klok.

**Vercel Cron draait alleen op productie.** Preview-deployments krijgen geen cron-taken, dus
de testdatabase bevriest tenzij daar met de hand een backfill draait.

`/api/cron/klok` staat wel al in `vercel.json`, maar heeft op productie nog niets te doen:
zonder een gekoppelde `RfhSession` faalt elke run met een leesbare fout in plaats van stil te
blijven. De koppeling is een handmatige stap die nog moet gebeuren — zie `docs/openstaand.md`.

---

## Beslissingen die niet vanzelfsprekend zijn

**Sequencenummers, geen tijdstempels.** De synchronisatie onthoudt waar hij was, niet
wanneer hij draaide. Daardoor is er geen tijdvenster dat gemist kan worden en is elke run
herhaalbaar. Bewezen: de volledige backfill twee keer draaien levert de tweede keer nul
nieuwe archiefregels op.

**Een versietabel naast de actuele stand.** Tijdens de voorverkoop daalt `numberOfPieces`
naarmate er gekocht wordt. De eindstand is dus het onverkochte restant, niet wat er is
aangeboden. Zonder archief is dat verschil onherstelbaar weg.

**Bulk-statements in plaats van rij-voor-rij.** Gemeten: een upsert per rij kost 45 ms tegen
Neon Frankfurt, wat neerkomt op vijftien uur voor een volledige backfill en meer dan de
transactietimeout per pagina. Eén bulk-statement doet duizend rijen in een seconde.

**Offset-paginering, geen keyset.** Gemeten: 61 ms op pagina honderd. De complexiteit van
keyset levert hier niets op.

**De database filtert, het scherm toont.** Ook na filteren op één veildag en één locatie
blijven het bijna zesduizend regels. Alles in het geheugen laden schaalt niet.

**Filterstand in de URL.** Maakt een selectie deelbaar en de terugknop bruikbaar — dat is
wat "een partij opzoeken" bruikbaar maakt.

---

## Wat er onderweg misging

Van de negentien plantaken in deelproject A bevatten er tien een fout in het plan. In
deelproject B kwamen daar nog eens vier bij. Alle veertien gevonden doordat er echt
gedraaid en gemeten werd, of doordat een subagent weigerde een tegenstrijdigheid glad te
strijken.

De volledige lijst staat in `docs/voortgang.md`. De vier die het meest hadden kunnen kosten:

**Integratietests wisten echte archiefregels.** De fixtures zijn echte API-antwoorden en
dragen dus echte primaire sleutels; de opruimstap verwijderde daarmee 25 aanbodregels per
testrun. Hersteld, en er staat nu een bewaker omheen.

**De retry-lus ving geen netwerkfouten.** `fetch` gooit bij een verbroken verbinding in
plaats van een antwoord terug te geven. De backfill sneuvelde erop na twaalf minuten.

**`email_verified` bestaat niet in Entra.** De spec schreef die controle voor, waardoor elke
Entra-aanmelding zou weigeren zodra de koppeling aangezet wordt. De juiste controle is de
tenant-id.

**Client secrets stonden in een gecommit document.** In `docs/inventarisatie.md`, vanaf de
eerste commit. Gevonden vlak voor de eerste push naar GitHub en uit de volledige historie
verwijderd — het moment waarop dat nog kosteloos kon.

## Twee eigenaardigheden in de Floriday-data

**Ontbrekend is vaak een lege string, niet `null`.** 34.461 organisaties hebben `name = ''`,
en 46.731 aanbodregels hebben een lege partijbriefverwijzing. `COALESCE` en `??` vangen dat
niet af.

**349 aanbodregels hebben een negatief aantal stuks**, tot −98.200, allemaal `UNAVAILABLE`.
Vermoedelijk correcties in de feed.

---

## Wat er nog niet is

- **Deelproject C**: de dagelijkse doorgifte naar de interne informatievoorziening. Waar die
  data heen moet is nog niet bepaald.
- **Het verloop per aanbodregel in het scherm.** Het archief legt het vast, maar er is nog
  geen verloop om tegen te ontwerpen: geen enkele regel heeft meer dan één versie, omdat
  alles in één keer is opgehaald. Dat ontstaat pas als de uurlijkse sync een tijd meeloopt.
- **Entra**, tot de tenant-controle er is.
- **Productiedata.** De productiedatabase heeft het schema maar is leeg; er zijn nog geen
  Floriday-productiecredentials.
- **De RFH-koppeling op productie.** Staging is gekoppeld (`npm run rfh-koppel`) en heeft 540+
  klokregels via de inhaalslag. Op productie moet een mens nog met een refresh token uit een
  privévenster koppelen — zie `docs/openstaand.md`.
- **Het zoekscherm voor het klokaanbod.** De ingest levert een werkende, geteste bron; het
  scherm zelf schakelen tussen voorverkoop en volledig klokaanbod krijgt een eigen plan zodra
  er productiedata is om tegen te ontwerpen.

## Verder lezen

| Document | Waarover |
|---|---|
| `README.md` | Gebruik: commando's, opzet, valkuilen |
| `docs/omgevingen.md` | Databases, branches, Vercel, welk `.env`-bestand waarvoor |
| `docs/vragen-voor-rfh.md` | Openstaande vragen aan Royal FloraHolland, met data onderbouwd |
| `docs/inventarisatie.md` | Hoe de koppeling met Floriday tot stand kwam |
| `docs/voortgang.md` | Wat er is gebouwd en wat er onderweg misging |
| `docs/concept-mail-arjan.md` | Conceptmail, wacht op twee gegevens |
| `docs/superpowers/specs/` | De drie ontwerpen |
| `docs/superpowers/plans/` | De vier implementatieplannen |

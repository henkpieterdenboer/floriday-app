# Wat er gebouwd is

Bijgewerkt: 2 augustus 2026.

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

**Belangrijke beperking:** wat we ophalen is het **voorverkoopaanbod**, niet het volledige
klokaanbod. De API-documentatie noemt het "een percentage van de potentiële klokvoorraad",
uitsluitend via FloraMondo. Intern mag dus niet beloofd worden dat dit hét klokaanbod is.
De vraag ligt bij Royal FloraHolland; zie `docs/vragen-voor-rfh.md`.

---

## De drie lagen

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

---

## Wat waar staat

```
prisma/schema.prisma          8 tabellen, 5 enums
prisma/applied.prisma         wat er is toegepast — niet met de hand aanpassen

src/lib/                      env-validatie, Prisma-client, mail, load-env
src/middleware.ts             beschermt /aanbod en /beheer

src/features/floriday/        ophalen en archiveren (24 bestanden)
src/features/auth/            toegang (12 bestanden)
src/features/supply-search/   zoeken, pure logica (9 bestanden)

src/app/(public)/             login, uitnodiging
src/app/(protected)/          aanbod, gebruikersbeheer
src/app/api/cron/             twee cron-routes
src/app/api/auth/             NextAuth

scripts/                      backfill, create-admin, invite, db-push, fixtures
tests/                        315 tests: unit (zonder netwerk) en integration (tegen Neon)
```

## De acht tabellen

| Tabel | Waarvoor |
|---|---|
| `SupplyLine` | Actuele stand van elke aanbodregel |
| `SupplyLineVersion` | Append-only archief: elke inhoudelijke wijziging |
| `TradeItem` | Artikelen, voor de productnaam |
| `Organization` | Kwekers, voor de naam |
| `SyncState` | Laatst verwerkte sequencenummer per bron |
| `SyncRun` | Uitvoeringslog: wat draaide wanneer, met welke uitkomst |
| `User` | Toegang, met rol en actief-vlag |
| `Invitation` | Uitnodigingen, alleen de hash van het token |

---

## Wat er draait, en wanneer

| Wat | Wanneer | Waar |
|---|---|---|
| Klokaanbod bijwerken | elk uur, 5 over | `/api/cron/sync` |
| Organisaties bijwerken | dagelijks 04:30 UTC | `/api/cron/organizations` |
| Volledige inhaalslag | met de hand | `npm run backfill` |

Beide cron-routes zitten achter `CRON_SECRET`. De uurlijkse run is begrensd op twintig
pagina's, wat ongeveer dertig seconden kost van de driehonderd die Vercel toestaat. Loopt
hij achter, dan haalt de volgende run het in — de cursor bepaalt waar hervat wordt, niet
de klok.

**Vercel Cron draait alleen op productie.** Preview-deployments krijgen geen cron-taken, dus
de testdatabase bevriest tenzij daar met de hand een backfill draait.

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

## Verder lezen

| Document | Waarover |
|---|---|
| `README.md` | Gebruik: commando's, opzet, valkuilen |
| `docs/omgevingen.md` | Databases, branches, Vercel, welk `.env`-bestand waarvoor |
| `docs/vragen-voor-rfh.md` | Openstaande vragen aan Royal FloraHolland, met data onderbouwd |
| `docs/inventarisatie.md` | Hoe de koppeling met Floriday tot stand kwam |
| `docs/voortgang.md` | Wat er is gebouwd en wat er onderweg misging |
| `docs/concept-mail-arjan.md` | Conceptmail, wacht op twee gegevens |
| `docs/superpowers/specs/` | De twee ontwerpen |
| `docs/superpowers/plans/` | De drie implementatieplannen |

# Floriday middleware

Haalt het klokvoorverkoop-aanbod uit Floriday op en legt het met volledige versiehistorie
vast in een Neon-database, zodat het doorzoekbaar wordt op assen die de API zelf niet
ondersteunt: veildatum, veillocatie, kweker en artikel.

**De Floriday-koppeling hierboven levert het voorverkoopaanbod, niet het volledige
klokaanbod** — zie `docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`,
paragraaf 2. Er is inmiddels een tweede, zelfstandige bron die dat gat dicht: het volledige
klokaanbod via RFH Pre-Auction. Zie "Het volledige klokaanbod (tweede bron)" hieronder. De
koppeling daarvoor is op dit moment alleen op staging gelegd; op productie moet een mens dat
nog met de hand doen, zie `docs/openstaand.md`.

## Aan de slag

```bash
npm install
cp .env.example .env      # vul de waarden in
npm run db:push
npm run capture-fixtures  # haalt echte API-antwoorden op als testinvoer
npm test
```

## Commando's

| Commando | Wat het doet |
|---|---|
| `npm run dev` | Start de app met webpack. |
| `npm test` | Alles: unit- én integratietests (die laatste raken Neon). |
| `npm run test:unit` | Alleen de snelle tests, zonder netwerk. |
| `npm run backfill` | Eenmalige inhaalslag vanaf sequencenummer nul. Hervatbaar. |
| `npm run backfill -- --pages 5` | Stopt na vijf pagina's. Voor een eerste proef. |
| `npm run backfill -- --reset` | Zet de cursor terug op nul. |
| `npm run backfill -- --items-only` | Dicht alleen de gaten in de artikeltabel. |
| `npm run create-admin -- --email ... --naam "..."` | Maakt een beheerder en drukt de uitnodigingslink af. |
| `npm run invite -- --email ... --url https://...` | Nieuwe uitnodigingslink voor een bestaand account. |
| `npm run db:push` | Past `prisma/schema.prisma` toe. Zie de waarschuwing hieronder. |
| `npm run db:push:dry` | Toont de DDL zonder die uit te voeren. |
| `npm run capture-fixtures` | Vernieuwt de testinvoer in `tests/fixtures/`. |
| `npm run rfh-koppel -- --token <refresh-token>` | Koppelt (eenmalig) een RFH-refresh token, uit een privévenster gehaald. Zie "Het volledige klokaanbod" hieronder. |
| `npm run rfh-koppel -- --status` | Toont of er gekoppeld is, wanneer de sessie voor het laatst ververst is en de laatste fout. |
| `npm run backfill-klok -- --vanaf 2026-07-10 --tot 2026-08-05` | Inhaalslag voor het klokaanbod over een periode van veildagen. Niet hervatbaar zoals `backfill` — draait per dag opnieuw een `SyncRun`. |
| `npm run rfh-typeproef -- --dagen 20260806,20260807` | Meet de werkelijke veldtypen van `clock-supply-search` tegen staging, om het Zod-schema te toetsen. |

### Tegen welke database draait dit?

Standaard tegen **test**. Voeg `--env .env.lokaal-productie` toe voor productie:

```bash
npm run create-admin -- --env .env.lokaal-productie --email jij@bedrijf.nl --naam "Jouw Naam"
```

Elk script drukt vóór het iets doet af welk bestand het leest en tegen welke databasehost
het gaat werken. Klopt dat niet met wat je verwacht, breek dan af.

Let op: `DOTENV_CONFIG_PATH` werkt **niet** — die wordt door de geïnstalleerde
dotenv-versie stilzwijgend genegeerd. Gebruik altijd `--env`.

### Ergens ingesloten geraakt?

Vergeten wachtwoord van de enige beheerder, of een nieuwe omgeving waar nog niemand binnen
is? Er is geen zelfregistratie, dus dan kom je er via het beheerscherm niet meer in:

```bash
npm run invite -- --email jij@bedrijf.nl --url https://<url-van-die-omgeving>
```

De `--url` is nodig omdat `APP_URL` lokaal op `localhost:3000` staat; zonder die vlag krijg
je een link die alleen op je eigen machine werkt.

## Hoe het werkt

De synchronisatie is gebaseerd op **sequencenummers, niet op tijd**. Elke pagina wordt in
één transactie weggeschreven en pas daarna gaat de cursor vooruit, dus een afgebroken run
laat geen gaten achter — hooguit werk dat opnieuw gedaan wordt. Een pagina opnieuw
verwerken voegt niets toe. Dat is bewezen: de volledige backfill twee keer draaien levert
de tweede keer nul nieuwe archiefregels op.

Twee tabellen dragen de kern. `SupplyLine` houdt de actuele stand bij;
`SupplyLineVersion` is een append-only archief dat een regel bijschrijft zodra er
inhoudelijk iets verandert. Dat tweede bestaat omdat `numberOfPieces` daalt naarmate er in
de voorverkoop gekocht wordt: de eindstand is het **onverkochte restant**, niet wat er is
aangeboden. Zonder archief is dat verschil onherstelbaar weg.

Drie bronnen, elk met een eigen ritme:

| Bron | Methode | Frequentie |
|---|---|---|
| Voorverkoopaanbod | `clock-presales-supply/sync` | elk uur, `/api/cron/sync` |
| Organisaties | `organizations/sync` | dagelijks 04:30 UTC, `/api/cron/organizations` |
| Artikelen | `GET /trade-items?tradeItemIds=` per 100 | na elke aanbodslag, alleen ontbrekende |

Artikelen hebben geen bruikbare sync: `/trade-items/sync` geeft `403 There are no
connected suppliers`. Ophalen per ID werkt wel, en welke ontbreken wordt uit de database
afgeleid, niet uit wat een run toevallig in het geheugen had.

### Het volledige klokaanbod (tweede bron)

Wat hierboven staat is het **voorverkoopaanbod** uit Floriday. Dat is niet hetzelfde als het
klokaanbod: gemeten op productie had 20,7% van het klokaanbod op een gewone veildag geen
voorverkooplink — die partijen zijn voor de Floriday-route onzichtbaar. Zie
`docs/superpowers/specs/2026-08-06-rfh-preauction-klokaanbod-design.md`, §3.2.

Daarom is er een tweede, zelfstandige ingest in `src/features/rfh-preauction/`, opgebouwd
naar hetzelfde patroon als hierboven (client, schema, mapper, wijzigingsdetectie,
versiearchief, `SyncRun`), maar tegen een andere bron: niet de Floriday-API, maar de JSON-API
achter het RFH Pre-Auction-scherm zelf (`clock-supply-search`). Twee verschillen bepalen het
ontwerp:

- **Geen volgnummerreeks.** De sync loopt over sneden van veildatum × veillocatie in plaats
  van over een cursor, en er is geen bewijs van volledigheid zoals `max-sequence-number` dat
  aan de Floriday-kant geeft.
- **Andere authenticatie.** Dit spreekt hetzelfde verzoek na dat de webapplicatie zelf doet,
  met een persoonlijk gebruikerstoken in plaats van onze API-sleutel — een bewuste keuze van
  de opdrachtgever, met impliciete toestemming van de RFH-contactpersoon. Zie de spec, §2,
  voor de volledige toelichting en de afweging.

**De koppeling is handmatig en verloopt.** De refresh token achter die sessie is maar één
keer zichtbaar, in de browser, en rouleert bij elk gebruik. Koppelen doe je met
`npm run rfh-koppel -- --token <token>` (zie de kop van `scripts/rfh-koppel.ts` voor hoe je
aan zo'n token komt). Raakt de sessie kwijt of verlopen, dan moet een mens opnieuw inloggen
in een privévenster — er is geen manier om dat vanuit code te herstellen. **Draai
`rfh-koppel` daarom nooit lichtzinnig met een echte token: een bestaande koppeling
overschrijven kost de oude sessie.**

De klokregels worden gekoppeld aan de bestaande `SupplyLine` via
`clockPresalesSupplyLineId`, zolang die koppeling nog leeft. RFH laat die verwijzing namelijk
los zodra de veildag geweest is (nul van 540 gemeten op al voorbije veildagen) — vandaar dat
de vijfminutensync (`/api/cron/klok`, zie `vercel.json`) belangrijker is dan de eenmalige
inhaalslag: alleen de lopende sync vangt de koppeling terwijl zij nog bestaat.

## Het zoekscherm

`/aanbod` (achter inloggen) doorzoekt het gearchiveerde klokvoorverkoop-aanbod: datumpresets
met hun concrete bereik erbij, een vrij zoekveld (artikel, kweker of partijbrief), een
locatiekeuze en een "alleen beschikbaar"-schakelaar. Alles staat in de URL, dus een selectie
is deelbaar en de terugknop werkt.

Twee standen op dezelfde data: **regels** (TanStack Table, vijftig per pagina, sorteren en
pagineren via de database) en **samenvatting** (per tijdvak, kweker, artikel of veillocatie,
met een totaalregel). Klikken op een samenvattingsregel zet die groep als extra filter en
schakelt terug naar de regels.

De database filtert, sorteert en pagineert — het scherm laadt nooit meer dan een venster van
vijftig rijen tegelijk, ook niet bij een half miljoen regels in de archieftabel. Zie
`src/features/supply-search/` voor de pure logica (presets, filters, sorteerwhitelist,
queries, samenvatting) en `src/app/(protected)/aanbod/` voor het scherm zelf.

## Toegang

Er is geen zelfregistratie. De allereerste beheerder maak je met een script:

```bash
npm run create-admin -- --email jij@bedrijf.nl --naam "Jouw Naam"
```

Dat print de uitnodigings-URL op de terminal — bewust, want bij de eerste beheerder is er
nog geen werkende mailconfiguratie. Daarna nodigt een beheerder collega's uit via
`/beheer/gebruikers`.

Een uitgenodigd account kan op twee manieren in gebruik genomen worden: via de link in de
mail een wachtwoord instellen, of straks direct aanmelden met het werkaccount. In dat
tweede geval bestaat er nooit een wachtwoord.

**E-mail.** Zonder `SMTP_*` in `.env` gaat alles via Ethereal: er wordt niets echt
verstuurd, maar elke mail is via een preview-link te bekijken. Die link verschijnt op het
scherm na het uitnodigen en op de terminal bij `create-admin`. Voor productie zet je de
`SMTP_*`-variabelen (Resend).

**Microsoft Entra** staat voorbereid maar uit. Zonder `AZURE_AD_CLIENT_ID`,
`AZURE_AD_CLIENT_SECRET` en `AZURE_AD_TENANT_ID` verschijnt de aanmeldknop niet. Let op
voordat je het aanzet: de verificatiecontrole moet nog van `email_verified` naar de
tenant-id — dat claimveld blijkt in Entra niet te bestaan, waardoor elke aanmelding nu zou
weigeren. Zie de spec, §4.

Aanmelden via Entra koppelt alleen op accounts die al bestaan en niet gedeactiveerd zijn;
er wordt er nooit een aangemaakt.

## Let op: `prisma db push` werkt hier niet

Uitgaand TCP **5432 is geblokkeerd** op dit netwerk, dus de Prisma schema engine bereikt
Neon niet. De Neon serverless driver praat WebSocket over 443 en komt er wel doorheen.

`npm run db:push` draait daarom `scripts/db-push.mjs`: dat genereert de DDL met
`prisma migrate diff` (heeft geen verbinding nodig) en voert die uit over de
WebSocket-driver. `prisma/applied.prisma` houdt bij wat er is toegepast — **niet met de
hand aanpassen**.

## Versies die vastliggen

- **Prisma 6**, niet 7. Vastgezet omdat npm anders 7 installeert, wat breaking changes heeft.
- **TypeScript 6**, niet 7. Next.js 16 weigert te bouwen met TypeScript 7.

## Omgevingen

Twee gescheiden Neon-databases en twee branches:

| Branch | Vercel | Database | Floriday |
|---|---|---|---|
| `develop` | Preview | test (gevuld met staging-data) | staging |
| `main` | Production | productie (leeg) | productie — nog aan te vragen |

De volledige inrichting, inclusief welke omgevingsvariabele waar hoort en welk
`.env`-bestand waarvoor dient, staat in `docs/omgevingen.md`.

## Verder lezen

| Document | Waarover |
|---|---|
| `docs/wat-er-gebouwd-is.md` | **Begin hier** — de complete inventaris |
| `docs/openstaand.md` | Wat er nog te doen is, op volgorde van urgentie |
| `docs/omgevingen.md` | Databases, branches, Vercel, configuratiebestanden |
| `docs/design-system.md` | Welke gedeelde onderdelen we gebruiken en hoe je ze bijwerkt |
| `docs/vragen-voor-rfh.md` | Openstaande vragen aan Royal FloraHolland, met data onderbouwd |
| `docs/inventarisatie.md` | Hoe de koppeling met Floriday tot stand kwam |
| `docs/voortgang.md` | Wat er is gebouwd en wat er onderweg misging |
| `docs/concept-mail-arjan.md` | Conceptmail, wacht op twee gegevens |
| `docs/superpowers/specs/` | De drie ontwerpen |
| `docs/superpowers/plans/` | De vier implementatieplannen |

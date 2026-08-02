# Voortgang deelproject A — ingest en database

Bijgewerkt: 1 augustus 2026. **Deelproject A is af.**

Plan: `docs/superpowers/plans/2026-07-31-floriday-ingest-database.md`
Spec: `docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`
Gebruik: `README.md`

## Waar we staan

Alle negentien taken klaar. 145 tests groen, typecheck schoon, productiebuild slaagt.
Alles gecommit op `develop`; nog niet gepusht, er is nog geen remote.

De backfill van de staging-omgeving is volledig gedraaid:

| | |
|---|---|
| Aanbodregels | 525.458 |
| Versies | 525.458 (exact gelijk — geen ruis) |
| Artikelen | 79.004 |
| Organisaties | 67.342 |
| Kwekers in het aanbod | 2.410 |
| Veildagen | 761, van 21-05-2024 t/m 02-08-2027 |
| Veillocaties | Aalsmeer 231.750 · Naaldwijk 136.474 · Rijnsburg 121.165 · Eelde 17.489 · RheinMaas 14.525 · Plantion 4.055 |

Koppelbaarheid: **nul** aanbodregels zonder bekende kweker, 709 (0,13%) zonder artikelnaam
— dat zijn de 64 artikelen die Floriday met een 403 of 404 weigert.

## De doorslaggevende controle

Drie pagina's verwerkt: 3000 regels, 3000 versies. Dezelfde drie pagina's opnieuw: 3000
regels, **0 versies**. En na de volledige backfill nog eens alles opnieuw: 0 pagina's, 0
rijen, 0 versies, in twee seconden.

Opnieuw draaien voegt dus niets toe. Daar rust het hele herstelverhaal op: bij twijfel kun
je altijd overdoen.

## Wat er onderweg misging

Tien dingen bleken anders dan het plan zei. Alle tien gevonden doordat subagents weigerden
een tegenstrijdigheid glad te strijken, of doordat er echt gedraaid en gemeten werd. Spec
en plan zijn op alle punten gecorrigeerd.

**Fouten in mijn eigen ontwerp**

1. **De schrijfvolgorde was onmogelijk.** `SupplyLineVersion` heeft een foreign key naar
   `SupplyLine`, dus bij de eerste waarneming van een regel kan de versie niet vóór de
   hoofdrij worden ingevoegd. Volgorde omgedraaid; het *bepalen* van het verschil moet nog
   steeds vóór de update.
2. **Een per-rij upsert zou vijftien uur kosten.** Gemeten: 45 ms per rij tegen Neon
   Frankfurt, dus 45 seconden per pagina van duizend — meer dan de transactietimeout.
   Vervangen door één bulk-statement per pagina: één seconde per duizend regels. Hetzelfde
   gold voor organisaties (41 s per pagina tegen 131 ms).
3. **De pagineerlus kon eeuwig draaien.** De sync levert rijen vanaf `>=` de cursor, dus de
   rij óp de cursor kan altijd terugkomen. Zonder guard blijft een cron-job hetzelfde
   verzoek herhalen. Ook de cursor komt nu van het maximum in de pagina in plaats van de
   laatste rij, zodat een ongesorteerde pagina niet stilletjes data overslaat.
4. **De retry-lus ving geen netwerkfouten.** `fetch` gooit een exception bij een verbroken
   verbinding in plaats van een response terug te geven, en die viel er volledig buiten. De
   backfill sneuvelde erop na twaalf minuten. Een verbroken verbinding telt nu als een 5xx.
5. **De artikel-aanvulling overleefde geen onderbreking.** De ids werden in het geheugen
   verzameld en pas aan het eind opgehaald; een onderbroken run liet ze verdampen. Nu leidt
   een left join de gaten af uit de database zelf.
6. **`satisfies` bewaakt geen volledigheid.** `CONTENT_FIELDS` bepaalt welke wijzigingen in
   het archief belanden. Een verzonnen veldnaam werd afgekeurd, een *vergeten* veld niet —
   een onzichtbare en onherstelbare fout. Nu een `Record<ContentField, true>`, waarmee de
   compiler beide gevallen afvangt.
7. **De rate limiter spreidt, hij burst niet.** Mijn test ging uit van drie gratis
   verzoeken aan het begin; de implementatie geeft alleen het eerste direct door.
8. **Een `Response`-body kan maar één keer gelezen worden.** De client las de body bij elke
   mislukte poging, ook bij pogingen die daarna alsnog slaagden.
9. **Twee velden hadden het verkeerde type.** `vbnProductCode` is een string (`"105127"`),
   `rfhRelationId` juist een getal. In mijn schema stonden ze omgekeerd. Gevonden door de
   Zod-schemas tegen echt opgehaalde antwoorden te valideren.
10. **Plain `null` in een `Json?` kolom is geen SQL NULL.** Prisma slaat dan het
    jsonb-literal `null` op. `Prisma.DbNull` is nodig voor een echte NULL.

**Eigenaardigheden van de Floriday-data**

- Ongeveer 3 tot 7 van elke 1000 aanbodregels falen op validatie, en 15 van 508
  organisatierecords hadden een `organizationId` dat geen geldige UUID is — even later
  waren die uit dezelfde query verdwenen. Records worden nu per stuk gevalideerd: wat
  faalt wordt overgeslagen, geteld en in de `warning` van de run gemeld, en de cursor
  springt eroverheen.
- 64 artikelen geven 403 of 404. Vermoedelijk klantspecifieke artikelen van andere kopers,
  plus één nul-UUID die als placeholder in de data staat.

## Omgeving en valkuilen

| | |
|---|---|
| Neon | project `floriday-middleware-test`, Frankfurt, Postgres 18 |
| Prisma | 6.19.3, vastgezet op 6 — npm wil anders 7 installeren |
| TypeScript | 6.0.3, vastgezet — Next.js 16 weigert te bouwen met TypeScript 7 |
| Fixtures | `tests/fixtures/*.json`, buiten git, op te halen met `npm run capture-fixtures` |

**Poort 5432 staat dicht** op dit netwerk, dus `prisma db push` bereikt Neon niet.
`npm run db:push` draait `scripts/db-push.mjs`, dat de DDL genereert met `prisma migrate
diff` en die over de WebSocket-driver uitvoert. `prisma/applied.prisma` houdt bij wat is
toegepast — niet met de hand aanpassen.

## Wat nu

**Openstaand bij Royal FloraHolland.** `docs/vragen-voor-rfh.md` bevat de volledige lijst,
onderbouwd met cijfers uit de gevulde database. De drie die het zwaarst wegen:

1. Zien we het volledige klokaanbod of een percentage? De API-docs en het Helpcenter
   spreken elkaar tegen.
2. Komt er een sync-endpoint op clock supply voor kopers?
3. Geldt het netwerkfilter op productie wel? Wij hebben nul connecties en krijgen 2.410
   kwekers binnen — als dat op productie anders is, wordt ons beeld veel smaller.

**Nog te regelen aan onze kant**

- Naam en e-mailadres van de ontwikkelaar voor het Slack-kanaal van RFH.
- Antwoord op de Daytrade-vraag.
- Productiecredentials en een productie-API-key. Let op: die key wordt maar één keer
  getoond.
- Een tweede Neon-project voor productie — geen branch, conform de projectafspraak.
- Een git remote; er is er nog geen, dus `develop` staat alleen lokaal.

**Volgende deelprojecten**

- **B — zoekinterface.** Een grid dat serverside filtert, sorteert en pagineert. Bij een
  half miljoen rijen doet Postgres het werk en toont het grid een klein venster. Zie
  hieronder — inmiddels opgeleverd.
- **C — distributie.** De dagelijkse doorgifte naar de interne informatievoorziening. Waar
  die data heen moet is nog niet bepaald.

---

# Voortgang deelproject B — toegang en zoekinterface

Bijgewerkt: 2 augustus 2026.

Plan: `docs/superpowers/plans/2026-08-01-zoekscherm.md`
Spec: `docs/superpowers/specs/2026-08-01-toegang-en-zoekinterface-design.md`

## Waar we staan

**Fase 1 (toegang)** was al opgeleverd voor dit werk begon: inloggen met e-mailadres en
wachtwoord (NextAuth, JWT, argon2id), gebruikersbeheer met uitnodiging per e-mail, en de
middleware die `/aanbod` en `/beheer/gebruikers` afschermt. Entra staat voorbereid maar uit
(zie de spec, §4, voor de openstaande tenant-controle).

**Fase 2 (het zoekscherm) is nu af.** Alle zes taken uit het plan: datumpresets, filters en
sortering, de regelquery, de samenvatting over vier assen, en het scherm zelf. 315 tests
groen (285 + 30 nieuwe, allemaal puur/unit — de integratietests van taak 3 en 4 waren al
groen), typecheck schoon, productiebuild slaagt.

Het scherm zelf leunt op drie server components die rechtstreeks bevragen
(`page.tsx`, `freshness.tsx`) en client components die alleen tonen wat ze al hebben
(`filter-bar.tsx`, `supply-table.tsx`) — nergens wordt dezelfde data twee keer opgehaald.
Sorteren, pagineren en het wisselen tussen regels/samenvatting lopen allemaal via de URL naar
de database, nooit in de browser.

## Wat er anders liep dan het plan

Het plan gaf de kant-en-klare interfaces voor `filters.ts`, `queries.ts`, `sort.ts`, `date-
presets.ts` en `summary.ts` als vaststaand mee ("alles wat eronder ligt is af en getest").
Die klopten. Wat niet in het plan stond, en er tijdens het bouwen bij moest:

1. **Geen `useSearchParams()` gebruikt, nergens.** De App Router eist daar een Suspense-
   boundary voor. In plaats daarvan leest alleen `page.tsx` (server component) de URL en
   geeft `filters`/`view` als props door aan de client components. Die navigeren met
   `<Link>` of `router.push`, maar lezen de URL nooit zelf. Voordeel naast het vermijden van
   de Suspense-eis: geen enkele client component hoeft zijn eigen databron te verzinnen.
2. **`view`/`axis`/`granularity` horen niet bij `SearchFilters`.** Dat type ligt vast (taak
   2, al getest). Screen-only state kreeg een eigen puur module,
   `src/features/supply-search/view.ts`, met `parseView`/`buildHref`/`drillDownFilters` -
   dezelfde spiegel-garantie (URL erin, object eruit, en weer terug) als `filters.ts` zelf.
3. **`summary.ts` importeren vanuit een client component was een architectuurfout in
   wording.** `view.ts` heeft de as-typen en de `UNKNOWN_ARTICLE_LABEL`-constante nodig, ook
   in `filter-bar.tsx` (client). Een gewone import vanuit `summary.ts` had Prisma via
   `queries.ts` in de clientbundel getrokken. Opgelost met een derde, afhankelijkheidsvrij
   bestand, `summary-types.ts`, waar zowel `summary.ts` als `view.ts` uit putten.
4. **Doorklikken vanuit de samenvatting op kweker/artikel gaat via het vrije zoekveld, niet
   via een eigen filter.** `SearchFilters` heeft geen apart kweker- of artikel-ID-filter
   (bewust, per de gegeven contractlijst) - de spec noemt kweker/artikel wel als aparte
   filters in §5, maar de enige weg die er in de praktijk voor gebouwd is, is vrij zoeken op
   naam. Een groep waarvan het label op de id terugvalt (geen echte naam - 34.461 van de
   67.342 organisaties heten leeg) is daarom expres **niet** doorklikbaar: zoeken op een
   ruwe UUID levert nul regels op, en dat zou eruitzien als een bug in plaats van als
   "geen naam bekend". `isDrillableGroup` in `view.ts` regelt dat.
5. **Een echte databug, gevonden door te kijken, niet door te redeneren.** De eerste versie
   van de partijbrief-kolom deed `waarde ?? "-"`. In de browser bleek een groot deel van de
   rijen een lege partijbrief-cel te tonen in plaats van een streepje. Query: 46.731 van de
   525.458 regels hebben `deliveryNoteReference = ''`, **nooit** `NULL` - exact dezelfde
   valkuil als de lege organisatienaam die taak 4 al blootlegde, hier op een veld waar hij
   niet gedocumenteerd stond. `??` ving dat niet af (het reageert alleen op `null`/
   `undefined`); een waarheidscontrole (`value ? value : "-"`) wel.

## Verificatie

Handmatig gecontroleerd in de browser (Chrome, tegen de gevulde staging-database):

- Elke preset toont het juiste concrete bereik en filtert ook echt (gecontroleerd voor
  "Komende 3 dagen", "Dit jaar" en "Zelf kiezen").
- Vrij zoeken op een artikelnaam ("Rosa Avalanche") geeft alleen treffers met die naam,
  gedebounced, URL bijgewerkt.
- Pagineren werkt en de URL verandert mee (`page=1` → `page=2`, geen overlap).
- Samenvatting per week over "Dit jaar": het totaal (107.158) is exact gelijk aan het
  regeltotaal voor dezelfde filters.
- Doorklikken vanuit een tijdvak-groep (17.864 regels, week van 6 april) zet het bereik op
  precies die week en toont exact 17.864 regels terug. Doorklikken op een kweker-groep
  (Fa G.C. Kuipers, 12.242 regels) idem via het zoekveld.
- Een selectie zonder resultaten (verzonnen zoekterm + EELDE + alleen-beschikbaar) toont de
  actieve filters in woorden en vier specifieke verruim-links; "Wis alle filters" werkt.
- Een regel zonder artikelnaam toont het `tradeItemId` gedempt en cursief in plaats van een
  lege cel (geverifieerd op een echte regel uit 12 nov 2025, Plantion).
- Een URL delen (rechtstreeks navigeren naar een opgebouwde link met preset, locatie,
  zoekterm, sortering en pagina) reproduceert exact dezelfde selectie.

Twee schermafbeeldingen staan in `docs/screenshots/` (regels en samenvatting).

## Een terugkerend patroon in de Floriday-data: lege strings

Drie keer in dit deelproject bleek een veld niet leeg te zijn maar een **lege string** te
bevatten, waar `null` verwacht werd. Elke keer gevonden door naar echte data te kijken, niet
door te redeneren:

- **34.461 van de 67.342 organisaties** hebben `name = ''`. Een `COALESCE(name, ...)` liet
  daardoor lege labels in de samenvatting staan; `NULLIF(name, '')` was nodig.
- **46.731 van de 525.458 aanbodregels** hebben `deliveryNoteReference = ''`, en nooit
  `NULL`. De kolom gebruikte `waarde ?? "-"`, wat lege cellen opleverde in plaats van een
  streepje.
- Drie artikelen hebben eveneens een lege naam.

Wie hier een nieuw veld toevoegt: ga er niet van uit dat ontbrekend `null` betekent. Kijk
eerst naar de werkelijke verdeling.

En één die geen lege string was maar wel dezelfde les: **349 aanbodregels hebben een
negatief aantal stuks**, tot −98.200, allemaal `UNAVAILABLE` — vermoedelijk correcties in
de feed. Opmaak mag dus niet aannemen dat aantallen positief zijn.

## Wat nog openstaat

- **De "komende drie dagen"-preset valideren met een inkoper** (spec, open punt 2) - nog
  niet gebeurd, staat los van dit werk.
- **Neon-koude-start-melding is niet met een echte trage query getest.** De timer
  (`WakingUpNotice`, drie seconden) is functioneel geverifieerd door code en door het
  laadscherm te zien verschijnen bij navigatie, maar een koude start van vijf-plus-minuten
  stilte was in deze sessie niet te forceren.
- **Entra-koppeling** (spec, open punt 1) - ongewijzigd, blijft uitgeschakeld tot de
  tenant-id-controle er is.
- **Kweker/artikel als eigen filter** (los van vrij zoeken) stond in de spec als
  mogelijkheid maar niet in de gegeven contractlijst voor dit scherm - zou een uitbreiding
  van `SearchFilters` en de query-laag vergen, bewust buiten deze taak gelaten.

---

# Uitrol naar Vercel

Bijgewerkt: 2 augustus 2026.

## Wat er is ingericht

Een tweede Neon-project voor productie (`floriday-middleware-prod`, Frankfurt), met een
schema dat regel voor regel gelijk is aan test: 108 kolommen, 25 indexen. Leeg, want er
zijn nog geen Floriday-productiecredentials.

De repository staat op GitHub (`henkpieterdenboer/floriday-app`) met twee branches:
`develop` voor Preview tegen de testdatabase, `main` voor Production tegen de nieuwe.

## Wat er onderweg misging

**Client secrets stonden in een gecommit document.** `docs/inventarisatie.md` bevatte de
echte client secrets van beide Floriday staging-omgevingen, letterlijk uitgeschreven, vanaf
de allereerste commit. Gevonden bij een scan vlak vóór de eerste push. De historie is
herschreven zodat ze in geen van de 65 commits meer voorkomen; gecontroleerd door elke
commit af te lopen. De secrets hebben nooit buiten de eigen machine gestaan.

Les: scan vóór de eerste push, niet erna. Daarna is het niet meer terug te draaien.

**`DOTENV_CONFIG_PATH` werkt niet.** Dat is de standaardmanier om een script tegen een
andere omgeving te draaien, en het werd bijna aangeraden. Bij het uitproberen bleek de
geïnstalleerde dotenv-versie de variabele stilzwijgend te negeren: hij laadt gewoon `.env`
en meldt niets. Een backfill die je dénkt tegen productie te draaien had dan staging-data in
de productiedatabase gezet.

Opgelost met een expliciete `--env`-vlag én een regel op het scherm met de doeldatabase,
vóór elk script iets doet.

**De homepage was nooit vervangen.** Wie de gedeployde URL opende kreeg een kale
placeholderpagina uit de allereerste opzet. Stuurt nu door naar `/aanbod`, waarna de
middleware zo nodig naar `/login` leidt.

**Het wachtwoord van de enige beheerder was onbekend.** Ingesteld door een subagent tijdens
zijn browsercontrole en niet doorgegeven. Daar is nu `npm run invite` voor, die een verse
uitnodigingslink maakt voor een bestaand account — nodig zodra hetzelfde op productie
gebeurt.

## Wat er nog moet

1. `APP_URL` in Vercel per omgeving invullen; zonder de juiste waarde wijzen
   uitnodigingslinks naar de verkeerde plek.
2. Floriday-productiecredentials en API-key aanvragen bij Royal FloraHolland.
3. Die invullen in `.env.lokaal-productie` en in Vercel bij Production.
4. `npm run create-admin -- --env .env.lokaal-productie` draaien.
5. Pas dán de backfill tegen productie.

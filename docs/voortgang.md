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
  half miljoen rijen doet Postgres het werk en toont het grid een klein venster.
- **C — distributie.** De dagelijkse doorgifte naar de interne informatievoorziening. Waar
  die data heen moet is nog niet bepaald.

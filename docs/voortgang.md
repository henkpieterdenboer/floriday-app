# Voortgang deelproject A — ingest en database

Bijgewerkt: 31 juli 2026, einde eerste bouwsessie.

Plan: `docs/superpowers/plans/2026-07-31-floriday-ingest-database.md`
Spec: `docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`

## Waar we staan

Tien van de negentien taken klaar. 44 tests groen, typecheck schoon, alles gecommit op
`develop`. Nog niet gepusht — er is nog geen remote.

| Taak | Status |
|---|---|
| 1 Git en projectskelet | klaar |
| 2 Next.js, TypeScript, Vitest | klaar |
| 3 Omgevingsvariabelen | klaar |
| 4 Prisma-schema en Neon | klaar |
| 5 Rate limiter | klaar |
| 6 Token-cache | klaar |
| 7 HTTP-client | klaar |
| 8 Zod-schemas en fixtures | klaar |
| 9 Mapper aanbodregels | klaar |
| 10 Wijzigingsdetectie | klaar |
| 11 Cursor en uitvoeringslog | **volgende** |
| 12 Pagina wegschrijven | open |
| 13 Pagineerlus | open |
| 14 Artikelen ophalen | open |
| 15 Organisaties | open |
| 16 Sync samenstellen | open |
| 17 Backfill draaien | open |
| 18 Cron-routes | open |
| 19 Afronden en documenteren | open |

De database is leeg: er is nog geen enkele synchronisatie gedraaid. Dat gebeurt pas bij
taak 17.

## De doorslaggevende controle is geslaagd

Drie pagina's verwerkt: 3000 regels, 3000 versies. Daarna exact dezelfde drie pagina's
opnieuw: 3000 regels, **0 versies**. Opnieuw draaien voegt dus niets aan het archief toe,
en bij twijfel kunnen we altijd overdoen zonder ruis te veroorzaken. Dat is de eigenschap
waar het hele herstelverhaal op rust.

## Wat de eerste echte run aan het licht bracht

**Een deel van de organisatierecords is kapot.** Vijftien van 508 in één pagina hadden een
`organizationId` die strikte UUID-validatie niet haalt, en die waren even later uit
dezelfde query verdwenen — het lijkt een tijdelijke toestand aan Floriday's kant. Zonder
ingrijpen laat één zo'n record een pagina van duizend mislukken, en daarmee een backfill
van uren. Records worden nu per stuk gevalideerd: wat faalt wordt overgeslagen, geteld en
in de `warning` van de run gemeld, en de cursor springt eroverheen zodat hij niet blijft
hangen op hetzelfde record.

**De artikel-aanvulling werkte alleen bij een run die helemaal afliep.** De ids werden
tijdens de run in het geheugen verzameld en pas aan het eind opgehaald. Een onderbroken
backfill — een time-out, een dichtgeklapte laptop — liet die ids verdampen, met
aanbodregels die permanent naar een niet-opgehaalde naam wijzen. Nu leidt
`findSupplyLinesWithoutTradeItem` de gaten af uit de database zelf, met een left join. Het
gat is daarmee altijd zichtbaar en altijd te dichten, ongeacht hoeveel halve runs
eraan voorafgingen. Los aan te roepen met `npm run backfill -- --items-only`.

## Vier dingen die anders liepen dan het plan zei

Alle vier gevonden doordat subagents weigerden een tegenstrijdigheid glad te strijken.
Het plan is op alle punten gecorrigeerd.

**1. De rate limiter spreidt, hij burst niet.** Mijn test ging uit van drie gratis
verzoeken aan het begin; de implementatie geeft alleen het eerste verzoek direct door en
laat elk volgend verzoek op zijn eigen tijdslot wachten. De implementatie was juist, de
test niet.

**2. Een `Response`-body kan maar één keer gelezen worden.** De HTTP-client las de body
bij elke mislukte poging, ook bij pogingen die daarna alsnog slaagden. In combinatie met
een mock die hetzelfde `Response`-object hergebruikte gaf dat "Body has already been
read" in plaats van de statuscode. Nu leest hij de body alleen nog op het moment dat hij
werkelijk een fout gooit.

**3. Twee velden hadden het verkeerde type.** `vbnProductCode` blijkt een string
(`"105127"`) en `rfhRelationId` juist een getal. In mijn schema stonden ze omgekeerd.
Gevonden door de Zod-schemas tegen echt opgehaalde API-antwoorden te valideren in plaats
van tegen verzonnen JSON.

**4. `satisfies` bewaakt geen volledigheid.** `CONTENT_FIELDS` bepaalt welke
veldwijzigingen in het archief belanden. Met `as const satisfies` werd een verzonnen
veldnaam wél afgekeurd, maar een *vergeten* veld niet. Dat is een onzichtbare en
onherstelbare fout: wijzigingen aan dat veld zouden nooit gearchiveerd worden. Nu een
`Record<ContentField, true>`, waarmee de compiler beide gevallen afvangt. Bewezen door
beide faalmodi te forceren.

## Poort 5432 staat dicht

Uitgaand TCP 5432 is geblokkeerd op dit netwerk, dus `prisma db push` en `prisma migrate`
kunnen Neon niet bereiken. De Neon serverless driver praat WebSocket over 443 en komt er
wel doorheen.

`npm run db:push` draait daarom `scripts/db-push.mjs`: dat genereert de DDL met
`prisma migrate diff` (heeft geen verbinding nodig) en voert die uit over de
WebSocket-driver. `prisma/applied.prisma` houdt bij wat er is toegepast, zodat
incrementele wijzigingen werken. `npm run db:push:dry` toont alleen de DDL.

Niet met de hand aanpassen: `prisma/applied.prisma`.

## Omgeving

| | |
|---|---|
| Neon | project `floriday-middleware-test`, Frankfurt, Postgres 18 |
| Prisma | 6.19.3, vastgezet op 6 (npm wilde 7 installeren) |
| Fixtures | `tests/fixtures/*.json`, buiten git, opnieuw op te halen met `npm run capture-fixtures` |
| `.env` | compleet: Floriday staging, Neon, en een cron-geheim |

## Zo pak je het weer op

Taak 11 is aan de beurt: `SyncState` en `SyncRun`, met integratietests tegen de database.
Vanaf hier raakt elke taak de database, dus dit is het punt waarop de sync echt gaat
draaien.

Twee dingen om in gedachten te houden bij taak 12, de schrijflaag:

- Prisma geeft `pricePerPiece` terug als `Decimal`. Voor de vergelijking moet dat weer
  een vaste-punt-string worden met `.toFixed(4)`, anders lijkt elke regel gewijzigd.
- De volgorde binnen de transactie is niet vrijblijvend: eerst de bestaande rijen lezen,
  dan de versies bijschrijven, dan pas de hoofdtabel bijwerken. Andersom is de
  vergelijkingsbasis al overschreven.

De doorslaggevende controle komt in taak 17: de backfill twee keer over dezelfde pagina's
draaien moet de tweede keer `versions: 0` opleveren.

## Nog steeds open richting Royal FloraHolland

`docs/concept-mail-arjan.md` is klaar op twee placeholders na (naam ontwikkelaar voor
Slack, antwoord op de Daytrade-vraag). De inhoudelijke vraag daarin — welk deel van het
klokaanbod we via klokvoorverkoop zien — staat nog open en bepaalt wat we intern over dit
overzicht mogen beweren.

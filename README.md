# Floriday middleware

Haalt het klokvoorverkoop-aanbod uit Floriday op en legt het met volledige versiehistorie
vast in een Neon-database, zodat het doorzoekbaar wordt op assen die de API zelf niet
ondersteunt: veildatum, veillocatie, kweker en artikel.

**Wat hier ligt is het voorverkoopaanbod, niet het volledige klokaanbod.** Zie
`docs/superpowers/specs/2026-07-31-floriday-ingest-database-design.md`, paragraaf 2 — dat
onderscheid is belangrijk voor wat je intern belooft.

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
| `npm run backfill` | Eenmalige inhaalslag vanaf sequencenummer nul. Hervatbaar. |
| `npm run backfill -- --pages 5` | Stopt na vijf pagina's. Voor een eerste proef. |
| `npm run backfill -- --reset` | Zet de cursor terug op nul. |
| `npm run backfill -- --items-only` | Dicht alleen de gaten in de artikeltabel. |
| `npm run capture-fixtures` | Vernieuwt de testinvoer in `tests/fixtures/`. |
| `npm test` | Alles: unit- én integratietests (die laatste raken Neon). |
| `npm run test:unit` | Alleen de snelle tests, zonder netwerk. |
| `npm run db:push` | Past `prisma/schema.prisma` toe. Zie de waarschuwing hieronder. |
| `npm run db:push:dry` | Toont de DDL zonder die uit te voeren. |
| `npm run dev` | Start de app met webpack. |

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
| Klokaanbod | `clock-presales-supply/sync` | elk uur, `/api/cron/sync` |
| Organisaties | `organizations/sync` | dagelijks 04:30 UTC, `/api/cron/organizations` |
| Artikelen | `GET /trade-items?tradeItemIds=` per 100 | na elke aanbodslag, alleen ontbrekende |

Artikelen hebben geen bruikbare sync: `/trade-items/sync` geeft `403 There are no
connected suppliers`. Ophalen per ID werkt wel, en welke ontbreken wordt uit de database
afgeleid, niet uit wat een run toevallig in het geheugen had.

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

## Verder lezen

- `docs/vragen-voor-rfh.md` — openstaande vragen aan Royal FloraHolland, onderbouwd met data
- `docs/inventarisatie.md` — hoe de koppeling met Floriday tot stand kwam
- `docs/voortgang.md` — wat er gebouwd is en wat er onderweg misging
- `docs/superpowers/specs/` — het ontwerp
- `docs/superpowers/plans/` — het implementatieplan

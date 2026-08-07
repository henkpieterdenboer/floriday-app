# Omgevingen, branches en deployment

Bijgewerkt: 7 augustus 2026.

## De twee databases

| | Test | Productie |
|---|---|---|
| Neon-project | `floriday-middleware-test` | `floriday-middleware-prod` |
| Host | `ep-gentle-tooth-asqde1be` | `ep-aged-king-asmvwqu8` |
| Regio | Frankfurt | Frankfurt |
| Inhoud | 525.458 aanbodregels uit Floriday **staging** | leeg |
| Schema | 8 tabellen, 5 enums, 25 indexen | identiek |

Beide schema's zijn regel voor regel gelijk; gecontroleerd op 108 kolommen en 25 indexen.

Aparte projecten, geen branches — een Neon-branch deelt rekencapaciteit en factuurplafond
met zijn ouder, dus een zware backfill op test zou productie kunnen raken.

## Branches en deployments

| Git-branch | Vercel | Database | Floriday |
|---|---|---|---|
| `develop` | Preview | test | staging |
| `main` | Production | productie | productie |

Werk op `develop`, merge naar `main` na akkoord. Nooit rechtstreeks naar `main`.

## Dit moet je weten voordat je het inricht

**Vercel Cron draait alleen op productie.** Preview-deployments krijgen geen cron-taken. De
testdatabase wordt dus niet vanzelf bijgewerkt zodra `main` bestaat — daar moet je de
synchronisatie met de hand starten (`npm run backfill`) of accepteren dat de testdata
bevriest op wat er nu staat.

Voor de eerste tijd is dat prima: de staging-dataset verandert nauwelijks, en het scherm is
er goed op te beoordelen.

**Elke omgeving krijgt eigen geheimen.** `NEXTAUTH_SECRET` en `CRON_SECRET` moeten per
omgeving verschillen. Deel je ze, dan is een sessiecookie van test geldig op productie en
kan wie het testgeheim kent de productie-cron aanroepen.

**`APP_URL` moet kloppen per omgeving**, want die staat in de uitnodigingslinks. Met de
verkeerde waarde wijzen uitnodigingsmails naar de andere omgeving.

**De eerste beheerder bestaat alleen op test.** Productie is leeg, dus daar moet
`npm run create-admin` opnieuw draaien zodra de omgeving staat.

## Welk configuratiebestand is welk

Vier bestanden met een `.env`-naam, en ze doen verschillende dingen. Alleen `.env.example`
staat in git; de rest bevat geheimen en blijft lokaal.

| Bestand | Waarvoor | Waar gebruikt |
|---|---|---|
| `.env` | Lokaal werken tegen de **test**database | jouw machine, standaard |
| `.env.lokaal-productie` | Lokaal scripts draaien tegen **productie** | jouw machine, met `--env` |
| `.env.vercel-preview` | **Importeren** in Vercel bij Preview | Vercel |
| `.env.vercel-production` | **Importeren** in Vercel bij Production | Vercel |
| `.env.example` | Sjabloon zonder waarden | staat in git |

De twee `vercel-`bestanden gaan één keer naar Vercel en worden daarna niet meer gelezen —
de applicatie draait op wat er in Vercel staat, niet op wat hier op schijf ligt.

`.env.lokaal-productie` blijft wél nodig, voor de dingen die je met de hand tegen productie
doet: de beheerder aanmaken, het schema bijwerken, de eerste backfill.

```bash
npm run create-admin -- --env .env.lokaal-productie --email jij@bedrijf.nl --naam "Jouw Naam"
npm run backfill -- --env .env.lokaal-productie
```

Elk script drukt vóór het iets doet af welk bestand het gebruikt en tegen welke
databasehost het gaat werken. Klopt dat niet met wat je verwacht, breek dan af.

## Omgevingsvariabelen in Vercel

Zet deze per omgeving (Production en Preview apart):

| Variabele | Test / Preview | Productie |
|---|---|---|
| `DATABASE_URL` | test, mét `-pooler` | productie, mét `-pooler` |
| `DIRECT_URL` | test, zónder `-pooler` | productie, zónder `-pooler` |
| `FLORIDAY_TOKEN_URL` | `idm.staging.floriday.io/...` | `idm.floriday.io/...` |
| `FLORIDAY_CUSTOMERS_API_BASE_URL` | `api.staging.floriday.io/...` | `api.floriday.io/...` |
| `FLORIDAY_CUSTOMERS_CLIENT_ID` | staging | productie — nog aan te vragen |
| `FLORIDAY_CUSTOMERS_CLIENT_SECRET` | staging | productie — nog aan te vragen |
| `FLORIDAY_CUSTOMERS_API_KEY` | staging | productie — wordt één keer getoond |
| `NEXTAUTH_SECRET` | eigen waarde | **andere** waarde |
| `CRON_SECRET` | eigen waarde | **andere** waarde |
| `APP_URL` | de preview-URL | de productie-URL |
| `SMTP_*`, `MAIL_FROM` | leeg laten (Ethereal) | Resend |
| `AZURE_AD_*` | leeg tot Entra er is | idem |
| `SYNC_ENABLED` | leeg (aan) | `false` tot de Floriday-productiecredentials er zijn |
| `CLOCK_SYNC_ENABLED` | leeg (aan) | leeg (aan) — onafhankelijk van `SYNC_ENABLED` |

**Twee losse schakelaars, expres.** `SYNC_ENABLED` legt alleen de Floriday-synchronisatie
stil (`/api/cron/sync`, `/api/cron/organizations`) — die faalt op `invalid_client` zolang de
Floriday-productiecredentials er niet zijn. `CLOCK_SYNC_ENABLED` legt alleen het klokaanbod
stil (`/api/cron/klok`, RFH Pre-Auction), en heeft niets met Floriday te maken. Om het
klokaanbod op productie te laten draaien terwijl Floriday nog stil moet blijven: laat
`CLOCK_SYNC_ENABLED` leeg (of zet hem op `true`) en laat `SYNC_ENABLED` op `false` staan. Zie
`docs/openstaand.md` §2 voor de volgorde waarin de rest van het klokaanbod op productie
klaargezet wordt.

Genereer een geheim met:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Volgorde bij het inrichten van productie

1. Floriday-productiecredentials en API-key aanvragen. **De key wordt maar één keer
   getoond** — meteen vastleggen.
2. Die in `.env.lokaal-productie` zetten en in Vercel bij Production.
3. `npm run create-admin` draaien tegen productie, zodat er een beheerder is.
4. Pas dán de backfill draaien tegen productie. Eerder zou staging-data in de
   productiedatabase belanden.
5. Controleren dat de cron loopt: kijk in `SyncRun` of er runs met status `SUCCEEDED`
   binnenkomen.

## Nooit `vercel deploy` of `vercel --prod`

De CLI stuurt lokale `.env`-bestanden mee, waardoor testconfiguratie op productie
terechtkomt. Altijd deployen via `git push`. In geval van nood:
`vercel redeploy <url-van-laatste-goede-deploy>`.

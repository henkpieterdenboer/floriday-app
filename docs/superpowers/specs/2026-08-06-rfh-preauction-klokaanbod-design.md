# Deelproject D — Het volledige klokaanbod via RFH Pre-Auction

Datum: 6 augustus 2026
Status: goedgekeurd, klaar voor implementatieplan

---

## 1. Doel en afbakening

Het **volledige klokaanbod** binnenhalen en archiveren, naast het voorverkoopaanbod dat
deelproject A al ophaalt. Bron is de JSON-API achter het RFH Pre-Auction-scherm, niet de
Floriday-API — die ontsluit het klokaanbod voor kopers namelijk niet.

**Binnen scope**

- Een tweede ingest in `src/features/rfh-preauction/`, met eigen client, schema, sync en tabellen.
- Sessiebeheer op een roulerende refresh token, met de token in de database.
- Een versiearchief op klokregels, in dezelfde vorm als `SupplyLineVersion`.
- Koppeling aan de bestaande voorverkoopregels via `clockPresalesSupplyLineId`.
- Het zoekscherm laten kiezen tussen volledig klokaanbod en voorverkoop.

**Buiten scope**

- Wijzigingen aan de Floriday-ingest. Die blijft ongemoeid draaien.
- Bieden, markeren of orders plaatsen. Wij lezen.
- Deelproject C, de distributie naar de interne informatievoorziening.

---

## 2. Waarom deze bron bestaat

`docs/floriday-api-inzichten.md` stelt vast dat het klokaanbod voor een koper via de
Floriday-API **niet op te sommen** is: er is alleen `GET /auction/clock-supply/{supplyLineId}`,
geen sync en geen max-sequence. Er bestaat wel een koppeling, `clockPresalesSupplyReference`,
maar die staat óp de klokregel — en juist die klokregel kunnen wij niet vinden zolang we het
id niet al kennen. De verwijzing is er dus wel en is onbruikbaar.

Het RFH Pre-Auction-scherm somt datzelfde klokaanbod wél op, via een geversioneerde JSON-API,
en levert per klokregel een `clockPresalesSupplyLineId` mee. Dat is dezelfde koppeling, maar
nu vanaf een regel die we daadwerkelijk in handen hebben. **Daarmee wordt een verwijzing die
via de Floriday-API dood is, hier bruikbaar.**

### Grondslag

Wij spelen hiermee het verzoek na dat RFH's eigen webapplicatie doet, met een persoonlijk
gebruikerstoken in plaats van onze API-sleutel. Dat is een bewuste keuze van de
opdrachtgever, vastgelegd op 6 augustus 2026:

> De contactpersoon bij Royal FloraHolland heeft aangemoedigd dit via hun eigen site te
> doen. Daarin ziet de opdrachtgever impliciete toestemming. Mocht daar later discussie
> over ontstaan, dan wordt die op dat moment gevoerd.

Dit staat hier zodat een volgende lezer de grond kent en niet hoeft te reconstrueren.
De keerzijde is bekend en meegewogen: `van-staging-naar-live.md` houdt intrekking van
API-toegang als sanctie open. Daarom is dit ontwerp uitdrukkelijk een tweede bron **naast**
de Floriday-ingest en geen vervanging ervan — valt deze route weg, dan blijft het product
overeind.

---

## 3. Wat we vooraf hebben vastgesteld

Alles hieronder is gemeten op 6 augustus 2026 tussen ongeveer 17:00 en 19:30 lokale tijd
(CEST, UTC+2), op productie én staging. Niets is aangenomen.

### 3.1 Het endpoint

| Wat | Waarde |
|---|---|
| Route | `POST /v16.0/clock-supply-search` |
| Host productie | `pre-auction-api.rfh-auction.com` |
| Host staging | `pre-auction-api.staging.rfh-auction.com` |
| Verzoekvelden | `query`, `skip`, `take`, `sorting{field,direction}`, `hasPresale`, `searchFilterItems[]`, `searchRangeFilterItems[]`, `auctionDate`, `includeMarkings` |
| `auctionDate` | tekst in de vorm `20260807` |
| Antwoordvelden | `results[]`, `totalDocuments`, `markings[]`, `filterItems[]` |
| Velden per regel | 43 |
| Kopregels | `Content-Type`, `Accept`, `X-Rfh-Synthetic`, `X-Language-Code`, `X-Rfh-Preset-Id`, `Authorization` |

`take: 500` werkt. `skip` pagineert echt: op veildag 03-08-2026 (954 regels) gaven
`skip 0`, `skip 100` en `skip 900` drie verschillende pagina's met een staart van 54.

### 3.2 Dekking — de vraag waar deelproject A op vastliep

Veildag 7 augustus 2026:

| Omgeving | Klokregels | Met voorverkooplink | Zonder |
|---|---|---|---|
| **Productie** | 15.175 | 12.039 | **3.136 (20,7%)** |
| **Staging, echte regels** | 165 | 156 | **9 (5,5%)** |

Dit beantwoordt vraag 1.1 uit `docs/vragen-voor-rfh.md`: **niet elke klokpartij komt door de
voorverkoop.** Wat deelproject A toont is structureel onvolledig.

De twee percentages verschillen sterk en staan hier allebei met opzet. Staging is te dun om
een verhouding op te baseren; het productiecijfer is de betekenisvolle meting, maar is één
momentopname van één veildag. De verhouding moet over meerdere dagen bevestigd worden.

Op staging draait RFH synthetische regels mee: van de 339 klokregels voor 7 augustus waren
er **174 synthetisch**, herkenbaar aan een `reference` die met `synth_` begint. Het veld
`isFromSyntheticRequest` staat bij álle regels op `false` en is dus **niet** de marker.
Daarmee is ook vraag 3.6a beantwoord: er is een manier om staging-testdata te herkennen
zonder naar productnamen te kijken.

### 3.3 De sleutel

Van de 156 klokregels met een `clockPresalesSupplyLineId` op staging lossen er **156 op** in
onze eigen `SupplyLine`, allemaal op dezelfde veildag. Nul missers, nul treffers op een
andere datum.

De sleutel is daarmee bewezen, en tegelijk is aangetoond dat onze Floriday-ingest compleet
is voor het deel dat hij hoort te dekken.

### 3.4 De omgekeerde kant

Onze 252 voorverkoopregels voor 7 augustus, na een verse `npm run delta`:

| | Regels |
|---|---|
| Wel op de klok | 156 — alle `AVAILABLE`, alle met stuks > 0 |
| Niet op de klok | 96 |

Die 96 uiteengelegd: 79 `UNAVAILABLE` mét stuks, 10 `UNAVAILABLE` op nul, 4 `AVAILABLE` op
nul, 3 `AVAILABLE` met stuks.

Die 79 zijn precies de categorie waarvan `clock-pre-sales-supply-1.md` zegt dat ze als
klok-supply worden toegewezen. Ze stonden er op het meetmoment niet. De meest waarschijnlijke
verklaring is dat de meting midden in de overgang viel: de handelsvensters van die partijen
sloten die dag tussen 14:00 en 18:00 **UTC**, oftewel 16:00 en 20:00 lokaal. Zie §11.1 — dit
is een toetsbare voorspelling, geen conclusie.

### 3.5 Houdbaarheid en horizon

| Veildag | Klokregels productie |
|---|---|
| 01-07-2026 | 0 |
| 31-07-2026 | 16.729 |
| 05-08-2026 | 15.869 |
| 06-08-2026 | 12.131 |
| 07-08-2026 | 15.175 |
| 08-08-2026 (zaterdag) | 0 |
| 10-08-2026 (maandag) | 440 |
| 14-08-2026 | 0 |

Ongeveer een maand terug beschikbaar, en één tot twee dagen vooruit gevuld — hetzelfde
ritme dat deelproject A in de Floriday-data mat. Een eenmalige inhaalslag over die maand is
mogelijk en de moeite waard, want daarna is die geschiedenis weg.

### 3.6 Stabiliteit van sleutels

Over ongeveer een half uur op staging: van 337 klokregels verdween er **één** id en kwamen er
**drie** bij. Ids zijn dus stabiel genoeg om als primaire sleutel te dienen.

`reference` is dat **niet**: 336 unieke waarden op 337 regels. Niet als sleutel gebruiken.

---

## 4. Authenticatie

De tokens komen van Floriday IDM, maar van een **andere authorization server** dan die van
onze API-sleutel.

| | Productie | Staging |
|---|---|---|
| Issuer | `idm.floriday.io/oauth2/ausbh16jzskq0dsN50i7` | `idm.staging.floriday.io/oauth2/aus1w6civoyW4EdjE0h8` |
| Client-id | `0oa88yyomvXp9o3Fp0i7` | `0oa19yrfd96Maphyz0h8` |

Scopes: `role:customer`, `role:app`, `profile`, `openid`, `offline_access`.
Access token: 60 minuten. Het is een **gebruikerstoken**, geen client-credentials-token;
onze bestaande API-sleutel komt hier niet in.

De `refresh_token`-grant is uitgeprobeerd en werkt: status 200, nieuw access token van 3600
seconden. **De refresh token rouleert bij elk gebruik.**

Daaruit volgen drie harde ontwerpregels:

1. **De token hoort in de database.** Een cronrun op Vercel kan geen omgevingsvariabele
   terugschrijven, dus een env-var kan een roulerende token niet dragen.
2. **Eén schrijver.** Twee runs die dezelfde token inwisselen slaan elkaars sessie dood.
   Een Postgres advisory lock rond het verversen sluit dat af.
3. **Bootstrappen blijft handwerk.** De koppeling begint ermee dat een beheerder in een
   privévenster inlogt op Pre-Auction en de refresh token daar uitleest; een script zet hem
   eenmalig in de database. Het privévenster is wezenlijk: zo krijgt de server een eigen
   sessie en vecht die niet met het dagelijks gebruik van de site door dezelfde persoon.

Sterft de token, dan stopt de sync en verschijnt op de statuspagina "RFH-sessie verlopen,
opnieuw koppelen". Geen stille storing.

---

## 5. Tijdzone

`auctionDate` gaat als `20260807` naar RFH. Welke dag dat is, moet in **Europe/Amsterdam**
worden uitgerekend, niet in UTC.

Doe je dat in UTC, dan haalt de sync tussen middernacht en 02:00 zomertijd stelselmatig de
verkeerde veildag op — precies de uren waarin het aanbod voor die dag compleet wordt.

Dit geldt ook de andere kant op. Alles wat wij opslaan is `timestamptz` en dus UTC; de
handelsvensters uit `docs/vragen-voor-rfh.md` §4.2 staan in UTC. Het scherm rekent naar
lokale tijd om, de opslag doet dat niet.

---

## 6. Ophaalstrategie

Per veildag pagineren, maar niet in één rechte lijn. De reeks wordt gesneden op
**veildatum × hoofdgroep × veillocatie**. Op productie zijn dat drie hoofdgroepen en zes
veillocaties, waardoor 15.000 regels uiteenvallen in sneden van hooguit enkele honderden.

Twee redenen:

- Zoek-API's kennen vaak een bovengrens op `skip` — Elasticsearch stopt standaard bij
  10.000 en productie zit daarboven. Met sneden is die vraag niet meer relevant.
- Een mislukte snede kost één snede, niet de hele veildag.

Welke dagen per run: **gisteren, vandaag en de twee volgende veildagen.** Gisteren om de
eindstand vast te leggen, vooruit omdat het aanbod daar volloopt.

Ritme: elke vijf minuten, aansluitend op de bestaande cron. Bij `take: 500` en sneden komt
dat op enkele tientallen verzoeken per run. De momenten die er het meest toe doen zijn het
sluiten van de voorverkoopvensters (14:00–18:00 UTC) en de vroege ochtend vlak voor de klok.

Een run die begint terwijl de vorige nog loopt, slaat over. Overlappende runs zijn hier
schadelijker dan gemiste runs, vanwege de roulerende token.

---

## 7. Datamodel

### `ClockSupplyLine`

Primaire sleutel is `id`, de UUID uit het antwoord. Elke run doet een **upsert** op die
sleutel; dezelfde partij twintig keer ophalen levert één rij op. Dit is hetzelfde patroon
als `SupplyLine.supplyLineId` en het antwoord op de vraag naar dubbele rijen.

Kolommen, gegroepeerd:

- **Identiteit** — `id`, `reference`, `auctionDate`, `clockPresalesSupplyLineId` (nullable,
  geïndexeerd, optionele relatie naar `SupplyLine`)
- **Kweker** — `supplierOrganizationId`, naam, relatienummer, logo, certificaten
- **Artikel** — `productCode`, `vbnProductName`, `productName`, `name`, `characteristics`,
  `positiveCharacteristics`, `negativeCharacteristics`, `qualityCode`,
  `qualityIndexClassification`, `mainGroupCode`, `productGroupName`, `potSizeInCm`,
  `plantHeightInCm`, `photoUrl`, `topLevelMainColor`, `rgbMainColor`
- **Aantallen en fust** — `currentNumberOfPieces`, `numberOfPackages`, `piecesPerPackage`,
  `packagesPerLayer`, `layersPerLoadcarrier`, `numberOfLoadCarriers`,
  `numberOfPackagesPerLoadCarrier`, `packageTypeCode`, `packageTypeName`, `loadCarrierCode`,
  `sequenceOnLoadCarrier`
- **Voorverkoop** — `preSaleInitialNumberOfPieces`, `preSaleCurrentNumberOfPieces`,
  `preSalePriceValue`, `preSalePriceCurrency`
- **Veiling** — `auctionLocation`, `clockShortName`, `auctioningSequence`, `isAuctioned`,
  `digitalAuctionSupplyType`, `deliveryFormBarcode`, `lastCommercialMutationMoment`
- **Administratie** — `isFromSyntheticRequest`, `firstSeenAt`, `lastSeenAt`

`preSaleInitialNumberOfPieces` naast `preSaleCurrentNumberOfPieces` verdient nadruk: dat is
aangeboden tegenover restant, het onderscheid waarvoor `SupplyLineVersion` is opgetuigd, hier
gewoon als twee velden in één antwoord.

Kenmerken komen al uitgeschreven binnen. De VBN-codelijsten uit
`scripts/haal-vbn-kenmerkcodes.mjs` zijn voor deze bron niet nodig; ze blijven staan voor de
Floriday-kant.

### `ClockSupplyLineVersion`

Append-only, exact het patroon van `SupplyLineVersion`.

Hier ligt de enige echte valkuil van dit ontwerp. Bij vijf minuten en 15.000 regels zou een
naïeve implementatie 4,3 miljoen archiefregels per dag wegschrijven. De vergelijking gaat
daarom over een **expliciet vastgelegde set inhoudelijke velden**, met `lastSeenAt` en
`firstSeenAt` er nadrukkelijk buiten. Verandert er niets, dan komt er niets bij.

De velden die er hier het meest toe doen zijn `currentNumberOfPieces`, `isAuctioned`,
`preSaleCurrentNumberOfPieces` en `lastCommercialMutationMoment` — die bewegen tijdens het
veilen zelf, wat aan de Floriday-kant nooit waarneembaar was.

### `RfhSession`

Eén rij: de huidige refresh token, wanneer hij voor het laatst werkte, en de laatste fout.
Alleen te benaderen achter de advisory lock uit §4.

### Verdwenen regels

Een regel die in een run niet meer terugkomt wordt **niet verwijderd**. `lastSeenAt` blijft
staan op het laatste moment waarop hij er was. Verwijderen zou het archief onbetrouwbaar
maken, en §3.6 laat zien dat regels inderdaad kunnen verdwijnen.

---

## 8. Het scherm

Een keuze bovenin tussen **volledig klokaanbod** en **voorverkoop**, met volledig als
standaard. Bij een regel die beide kent toont de detailweergave het voorverkoopaanbod naast
het restant, en de voorverkoopprijs.

Deze bron draagt product, kweker, kenmerken, prijs en foto zelf. Er is geen join met
`TradeItem` of `Organization` nodig. **Het scherm kan dus productiedata tonen zonder dat de
Floriday-productiecredentials binnen zijn** — de blokkade uit `docs/openstaand.md` §2 geldt
voor deze bron niet.

De waarschuwing uit `docs/wat-er-gebouwd-is.md` dat dit voorverkoopaanbod is en geen
klokaanbod, verhuist mee: hij hoort nu bij de voorverkoop-weergave, niet bij het geheel.

---

## 9. Risico's

- **`v16.0` staat in het pad.** Bij een versiesprong breekt het. De base-url staat in
  configuratie en het Zod-schema weigert onbekende waarden hard, zodat een wijziging
  zichtbaar faalt in plaats van stil data te verliezen. Hetzelfde principe als aan de
  Floriday-kant.
- **De token sterft.** Zie §4. Gevolg is stilstand met een melding, geen gaten in het archief
  zonder dat iemand het merkt — al is elke gemiste dag wel permanent verlies, want er is geen
  volgnummer om op terug te vallen.
- **Geen bewijs van volledigheid.** Anders dan bij Floriday is er geen
  `max-sequence-number`. Wij weten nooit zeker dát we alles hebben van een veildag. Wat wij
  wel kunnen doen is `totalDocuments` per snede vergelijken met wat we opsloegen, en dat
  verschil rapporteren.
- **De relatie met RFH.** Zie §2. Gewogen en aanvaard door de opdrachtgever.

---

## 10. Testen

Volgt de bestaande opzet: fixtures uit echte antwoorden, unit tests zonder netwerk,
integratietests tegen staging.

Twee aandachtspunten:

- Fixtures uit dit endpoint bevatten **echte sleutels van echte partijen**. Dat is eerder
  misgegaan in dit project; opruimende tests mogen nooit op een gevulde database draaien.
- Staging levert synthetische regels mee (§3.2). Een test die op aantallen leunt, moet die
  eruit filteren op het `synth_`-voorvoegsel, anders is hij van dag tot dag instabiel.

---

## 11. Wat er nog getoetst moet worden

Geen van beide blokkeert de bouw.

### 11.1 Komen de onverkochte voorverkooppartijen alsnog op de klok?

De 79 `UNAVAILABLE`-regels mét stuks uit §3.4 zouden er de volgende ochtend moeten staan.
Staan ze er, dan is de klokbron over de tijd een superset van de voorverkoop en is `2.5` uit
`vragen-voor-rfh.md` beantwoord. Staan ze er niet, dan klopt de documentatie van RFH niet en
is dat op zichzelf een melding waard.

Meet dit vóór het ordervenster van de volgende veildag sluit, anders meet je opnieuw een
overgang.

### 11.2 Loopt `skip` op productie voorbij 10.000?

Met de sneden uit §6 niet relevant, maar goed om te weten. De productietab verloor tijdens
het onderzoek de site-toestemming van de browserextensie voordat dit gemeten kon worden.

---

## 12. Wat dit betekent voor de vragen aan Royal FloraHolland

`docs/vragen-voor-rfh.md` verandert hierdoor op vier plaatsen. Bijwerken hoort bij de
uitvoering van dit ontwerp.

| Vraag | Nieuwe stand |
|---|---|
| **1.1** Zien we het volledige klokaanbod? | Beantwoord, gemeten: nee. 20,7% van het klokaanbod op productie heeft geen voorverkooplink. |
| **1.2** Komt er een sync-endpoint voor kopers? | Wordt scherper. Wij weten nu dat RFH de omgekeerde verwijzing `clockPresalesSupplyLineId` al bezit en serveert. De vraag is niet meer "bouw dit" maar "geef ons toegang tot wat er is". |
| **2.5** Wat gebeurt er na sluiting van het venster? | Deels gemeten, zie §11.1. |
| **3.6a** Is staging-testdata herkenbaar? | Beantwoord: aan het `synth_`-voorvoegsel in `reference`. Niet aan `isFromSyntheticRequest`. |

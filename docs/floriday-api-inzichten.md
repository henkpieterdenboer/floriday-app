# Wat de Floriday-documentatie zegt

Opgesteld 5 augustus 2026, na het uitlezen van alle 131 pagina's van
developer.floriday.io en beide swagger-specs, met de kennis van ons eigen archief erbij.

De ruwe pagina's staan in `docs/floriday-portal/` (opgehaald met de index op
`developer.floriday.io/llms.txt`), de swaggers in `docs/api-specs/`. Elke bewering hieronder
is naar een bestandsnaam te herleiden, zodat een volgende lezer niet opnieuw hoeft te zoeken.

**Lees dit voordat je aan de synchronisatie of aan het archief werkt.** Er staan drie dingen
in die het ontwerp raken en één die geld kost.

---

## Het korte antwoord op onze hoofdvraag

**`clock-presales-supply` is niet het klokaanbod.** Het is een fase ervóór, en per definitie
maar een deel:

> "Availability based on: **A percentage of available quantity of potential Clock sales
> supply**" — `supply-type-overview.md`

> "After the expiration of the clock pre sales order window, non sold clock pre sales supply
> will be allocated as clock sales supply." — `clock-pre-sales-supply-1.md`

Een kweker kan klokaanbod aanmelden **zonder** voorverkoop: `AddClockSupplyLine` in de
suppliers-API heeft `clockPresales` als optioneel veld. Bij Daytrade staat een concreet
percentage: "if the unsold goods are offered as Auction supply, **only 50%** of these
products are made available for pre sales" (`daily-trade.md`).

Wat wij tonen is dus het voorverkoopaanbod, niet het klokaanbod. Dat onderscheid moet in de
interface staan voordat iemand het als vervanging van de RFH-mailservice gaat lezen.

En het klokaanbod zelf is voor een koper **niet op te sommen**. Er is alleen
`GET /auction/clock-supply/{supplyLineId}`, geen sync en geen max-sequence. De enige
koppeling, `clockPresalesSupplyReference`, staat op de klokregel en wijst naar de
voorverkoop — de verkeerde kant op. Aan de suppliers-kant bestaat
`/clock-supply-lines/sync/{sequenceNumber}` wél.

---

## Drie dingen die onze code raken

### 1. Een lege pagina is geen bewijs dat je bij bent

Floriday waarschuwt hier expliciet voor, in `how-do-i-fetch-and-send-data-to-floriday.md`:

> "❗️ **Why zero new results does not have to mean you are up to date!** In some cases it
> can happen that the results are empty, but the MaximumSequenceNumber is incremented. This
> is due to a filtering that happens in the sync endpoint itself. (...) This is why you
> should keep fetching sequence numbers until the `MaximumSequenceNumber` is reached."

Wij stoppen op een korte pagina (`rawResults.length < pageSize` in
`src/features/floriday/sync/supply-lines.ts`). Dat is voor deze feed verdedigbaar — hij
filtert niet op connecties, zie punt 2 — maar het is niet wat Floriday voorschrijft.

De `maximumSequenceNumber` **in de sync-respons** kunnen we niet gebruiken: gemeten is die
gescoped op de teruggegeven pagina en gelijk aan het hoogste volgnummer daarin. Het **aparte
endpoint** geeft wel een feed-brede bovengrens:

```
GET /auction/clock-presales-supply/max-sequence-number
```

Geverifieerd op 4 augustus 2026: gaf 501532193, exact ons hoogste volgnummer.

### 2. `postFilterConnections` staat op `false` en moet daar blijven

De sync-route heeft een queryparameter die wij niet meesturen:

```
"name": "postFilterConnections", "in": "query", "default": false
```

Ongefilterd is dus de standaard. Dat is precies waarom wij met nul connecties 2.410 kwekers
zien, en het strookt met `clock-pre-sales-supply-1.md`: *"Supply is available for all
auction sales channel customers. (not customer specific)"*.

**Zet die parameter nooit aan.** Wie hem "voor de netheid" op `true` zet, verliest in één
klap het overgrote deel van de markt. Ter contrast: bij `/supply-lines/sync/` en
`/trade-items/sync/` staat het connectiefilter wél in de beschrijving en is het niet uit te
zetten.

### 3. Aanbodregels leven veertien dagen

`data-retention.md`:

| Wat | Via de API bereikbaar | Daarna |
|---|---|---|
| **Supply lines** | **14 dagen** vanaf `deliveryPeriodEndDate` | koud archief, 5 jaar |
| Batches | 30 dagen | — |
| Sales orders | 1 jaar | 5 jaar |
| Trade items, organisaties | > 5 jaar | > 5 jaar |
| Connecties | 1 maand | 5 jaar |

En: *"Cold storage data can only be accessed manually."*

**Een gemiste synchronisatie is permanent dataverlies.** Er is geen inhaalmogelijkheid via
de API zodra het venster voorbij is. Dat is tegelijk het sterkste bestaansargument voor dit
project en het grootste operationele risico ervan.

Op dit moment loopt de synchronisatie op productie niet, omdat daar geen Floriday-gegevens
staan. Elke dag dat dat zo blijft is een dag die later niet meer op te halen is — maar
alleen voor productie; op staging draaien wij zelf.

De tabel noemt overigens geen aparte rij voor clock presales supply. Dat het onder "supply
lines" valt is een aanname; het is de moeite waard dat bevestigd te krijgen.

---

## Wat Floriday adviseert en wij anders doen

**Synchroniseer vaker.** `best-practices.md`: *"we recommend syncing data such as supply
lines **at least every minute**"*, en elders *"1-5 minutes"* voor near-realtime endpoints.
Wij draaien elk uur — een factor zestig trager. Voor een archief van eindstanden is dat te
verdedigen, maar het verklaart wel waarom wij het verloop binnen een ordervenster niet zien:
aanbod dat binnen het uur ontstaat, verkoopt en naar de klok gaat, passeert ongemerkt.

**Vermijd een vaste kloktijd.** Ook `best-practices.md`: *"if your software is running at 20
companies and syncing every 5 minutes, this creates server spikes every 5 minutes that we
would prefer to spread out. By introducing a delay, where the next sync cycle only occurs
after data has been fetched and processed, these spikes can be distributed more evenly."*
Onze cron staat op een vast uur; een lus die herstart ná verwerking is wat zij willen.

**Rate limit.** 3,4 verzoeken per seconde, burst 1000, per API-sleutel. De burst is een
emmer die met 3,4 per seconde bijvult: *"The time to fully recover to 1000 tokens is
1000 / 3.4 = ~294 seconds"*. Voor een uurlijkse sync ruim voldoende; bij een backfill vanaf
nul loop je de emmer leeg en zak je terug naar 3,4/s. Er is **geen 429 gedocumenteerd** in
`error-codes.md` — bouw terugvalgedrag op statusklasse, niet op een verwachte 429.

---

## Webhooks zijn voor ons geen optie

Drie blokkades in `webhooks.md`:

- Doelgroep: *"Supplier organizations; Supplier warehouse organizations."* Geen kopers.
- Er is geen aggregate voor aanbod. Alleen `BATCH`, `SALESORDER`, `DELIVERYORDER`,
  `FULFILLMENTORDER`.
- *"They are intended to supplement the polling of the public API, not as a replacement."*
  En: *"Floriday does not guarantee delivery of events."*

Uurlijks pollen blijft dus de enige route.

---

## Naar productie

`van-staging-naar-live.md` beschrijft acht stappen. Voor ons zijn deze bindend:

1. Registratie via het aanmeldformulier voor softwareleveranciers; een implementatieconsulent
   neemt contact op.
2. Intake, waarin scope, volgorde, planning en **launching customer** worden vastgelegd.
3. **Acceptatietest op staging** — dit is de poort: *"Once the application development tests
   have been successfully completed, you can contact your implementation consultant for an
   acceptance test."* Met sanctie: *"Without a Floriday acceptance test, Floriday will not
   (be able to) provide live support (...) and depending on the situation we can decide to
   revoke access to the API."*
4. **Finale live-test** samen met de launching customer.

Praktische gevolgen:

- **Nieuwe API-sleutel.** *"the API keys used for staging environments are not the same as
  the API keys for the live environments."* En hij is eenmalig zichtbaar — kwijt betekent de
  applicatie verwijderen en opnieuw toevoegen (staat ook in onze memory).
- **Andere OAuth-server.** Live is `https://idm.floriday.io/oauth2/aus3testdcf2vyfs70i7`,
  staging `https://idm.staging.floriday.io/oauth2/ausmw6b47z1BnlHkw0h7`. Onze configuratie
  ondersteunt dat al via `FLORIDAY_TOKEN_URL`.
- **Eén sleutel = één organisatie = één GLN.**
- **Doorlooptijd staat er niet.** Geen enkele termijn of SLA genoemd. Dat is dus een vraag
  aan RFH, geen aanname.

---

## Floricode-codelijsten moeten gekocht worden

`general-starting-conditions.md` noemt vijf voorwaarden, waaronder actuele codelijsten voor
GLN, VBN-productcodes, VBN-productkenmerken, VBN regulatory characteristics en VBN-verpakking.
Met een waarschuwing:

> "**Important: Access to these codelists need to be purchased from Floricode. Prices may
> differ per codelist.**"

Wij hebben de kenmerknamen afgeleid uit de pdf's die Floricode publiek aanbiedt
(`scripts/haal-vbn-kenmerkcodes.mjs`). Dat werkt en die downloads staan open, maar het is
niet dezelfde route als de betaalde codelijsten die Floriday als voorwaarde stelt. Voor
productie is het verstandig na te gaan of dat volstaat of dat een abonnement nodig is —
zeker voor de waardecodes, waar wij nu alleen de kenmerknamen van hebben.

Er is **geen enkel Floriday-endpoint dat VBN-codes naar namen vertaalt.** Gezocht op
`GetVbn*`, `/vbn*` en `characteristicName`: geen treffers. De codelijst is de enige weg.

Bruikbaar detail: trade items dragen een vlag `hasInvalidFloricodeData`, toegevoegd in
2023v1, die aangeeft dat een productcode, verpakkingscode of kenmerkcode een **verlopen**
waarde bevat. Dat verklaart codes die niet in de lijst voorkomen.

---

## Artikelen: drie dingen die ons archief raken

**Oude versies zijn opvraagbaar.** `GetTradeItemByIdAndVersion` bestaat in de customers-API.
Onze aanbodregels dragen `tradeItemVersion`, dus wij kunnen de kenmerken ophalen zoals ze
golden op het moment van aanbieden. De sync levert alleen de *huidige* versie.

Dat is meer dan een nettigheid. `trade-items-2.md` zegt dat versies *"commercially identical"*
horen te zijn, maar noemt in dezelfde adem als geldige wijziging: *"changing a VBN product
code 'other' to a specific VBN product code"*. Dat is voor een zoekscherm allesbehalve
identiek. Bewaar dus de kenmerken zoals ze bij de aanbodregel hoorden.

**Sommige artikelen staan in geen enkele catalogus.** Sinds 2025v1 kan een kweker een batch
aanmaken op basis van losse kenmerken, *"without actually creating a Trade item"*; die
heten "Clock trade items" en zijn bedoeld *"only for the Daytrade and Auction workflow"*
(`batches-from-trade-item-properties.md`, `batches.md`). Dat is een plausibele verklaring
voor onze 64 artikelen die wij niet konden ophalen — de moeite waard om te toetsen.

**Filter niet op `isHiddenInCatalog`.** `trade-items-2.md`: *"Supplier organizations usually
use these trade items for auctioning only"*. Wie verborgen artikelen wegfiltert als
opschoning, gooit precies het klokaanbod weg.

---

## Organisaties: waarom er 67.342 zijn

`organizations.md` verklaart onze verbazing over dat aantal, en waarschijnlijk ook de 70%
met een einddatum:

> "📘 **Organizations without GLN codes** — The sync endpoint currently returns Organization
> data **which is retrieved directly from Floricode**. Unfortunately, Floricode still lists
> organization data without GLN codes. **These results should be ignored, as these
> organizations no longer exist.**"

De organisatie-feed is dus niet een lijst Floriday-deelnemers maar een doorgifte van de
Floricode-sectorregistratie, historie inbegrepen. Dat geeft ons een gedocumenteerd
filtercriterium dat wij nog niet toepassen: **organisaties zonder GLN horen genegeerd te
worden.**

`Organization.endDate` zelf staat nergens in de documentatie beschreven. Wees dus voorzichtig
met "deze kweker is gestopt" in de interface — bij een kweker die vandaag aanbod levert is
een gevulde einddatum waarschijnlijk een historische registratie, niet een status.

---

## Kleinere vondsten die we kunnen gebruiken

- **`GET /auction/delivery-time-frame-quotes`** — levertijdvakken voor voorverkooporders, met
  `latestDeliveryOrderTime`: *"The latest time to place an order to get it delivered"*. Dat
  is precies wat een inkoper wil weten. Wij gebruiken dit endpoint niet.
- **Afbeeldingen mogen herschaald worden** via de URL, met een puntkomma als scheidingsteken:
  `...jpg?width=300;height=100;crop=fit` (`media-2.md`). Handig voor een lijstweergave.
- **Hotlink foto's, kopieer ze niet.** `data-retention.md`: *"Storage costs money especially
  media storage (...) by e.g. reusing image URLs."* Maar let op: media wordt bewaard
  *"In use >5 years / If not in use 'clean-up'"* — oude archiefregels krijgen dus op termijn
  dode fotolinks.
- **Prijzen mogen na de eerste verkoop alleen omhoog** (`supply-type-overview.md`). Een
  stijgende prijs is dus een signaal dát er verkocht is — mogelijk betrouwbaarder dan
  `numberOfPieces`, waarvan het aftelgedrag nergens gedocumenteerd staat.
- **Kopers krijgen geen `batchId`.** Het suppliers-model heeft het, het customers-model niet.
  `supplyLineId` is ons enige anker.

---

## Twee dingen die de documentatie níet zegt

Belangrijk om te weten waar de grens van onze kennis ligt.

**Dat `numberOfPieces` aftelt bij verkoop staat nergens.** Wat er staat is een bovengrens:
*"Available quantity is the maximum available amount for the given period"*. Ter contrast
wordt het aftellen bij Customer Offers wél expliciet beschreven. Het enige indirecte bewijs
is een schemagrens: `ClockPresalesSupplyLine.numberOfPieces` heeft `minimum: 0`, de klokvariant
`minimum: 1`. Onze eigen meting van 4 augustus (84 regels naar nul) is dus voorlopig het
beste bewijs dat we hebben.

**Wanneer de status omslaat staat nergens.** De enum heeft precies twee waarden, AVAILABLE en
UNAVAILABLE, maar geen enkele passage koppelt die overgang aan uitverkopen, aan het sluiten
van het venster of aan de overgang naar de klok. Ook hier is onze eigen meting (145 regels
UNAVAILABLE met het aantal onaangeroerd) het beste dat we hebben.

---

## Versiebeleid: 2026v1 heeft een houdbaarheidsdatum

`welcome.md`:

> "Every six months, a new update of the API is released. (...) The current **Main** version
> is 2026v1. The 2026v1 version will be **Deprecated after October 2026**. The 2026v1 version
> will be **taken offline after April 2027**."

Wij gaan live op 2026v1 en moeten dus binnen ongeveer een jaar migreren. Twee praktische
gevolgen: houd de versie in configuratie (dat doen wij al, via de base-url in `.env`), en
behandel een plotselinge 401 of 403 op productie als mogelijk versieprobleem —
`error-codes.md` zegt dat 401 *"mostly generic, except for when a deprecated version is
used"* is en dat 403 kan betekenen dat *"the version you are using is deactivated and/or
offline"*.

Veldverwijderingen tussen versies komen gewoon voor: bij een eerdere overgang verdween
`packingConfigurations` (meervoud) uit `ClockPresalesSupplyLine` ten gunste van
`packingConfiguration`, en verdwenen `salesChannel` en `tradeInstrument` volledig.

---

## Wat hierna moet gebeuren

In volgorde van belang:

1. **Productiegegevens regelen.** Zolang die er niet zijn draait de synchronisatie daar niet,
   en met veertien dagen bewaartermijn is elke dag onherstelbaar.
2. **De stopconditie van de sync onderbouwen of aanpassen** met het
   `max-sequence-number`-endpoint, zodat "we zijn bij" een gemeten uitspraak wordt in plaats
   van een afleiding uit de paginalengte.
3. **Vaker synchroniseren** dan eens per uur, en de cyclus laten herstarten na verwerking in
   plaats van op een vaste kloktijd.
4. **Organisaties zonder GLN filteren** in het zoekscherm.
5. **Uitzoeken of de Floricode-codelijsten gekocht moeten worden** voor productie.
6. **In de interface duidelijk maken** dat dit voorverkoopaanbod is en niet het volledige
   klokaanbod.

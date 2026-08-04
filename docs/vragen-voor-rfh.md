# Mail aan Arjan — voorstel, ter vergelijking

*Herschreven op 5 augustus 2026. Zelfde boodschap als het origineel hieronder, met drie
aanpassingen: de tijdshorizon staat er nu in, de dekkingsvraag is scherper gesteld zodat er
meer uit komt dan "ja klopt", en productietoegang is een concrete vraag met een aanleiding
vóór de vakantie in plaats van een suggestie. De originele versie staat er ongewijzigd onder.*

---

Beste Arjan,

Zoals per Teams al even getikt: hierbij een paar vragen. Passen wellicht ook in het
Slack-kanaal, maar die uitnodiging hebben we volgens mij nog niet binnen.

We bouwen een intern schermpje waarop onze inkopers het klokaanbod van morgen en overmorgen
kunnen doorzoeken. Meer dan ophalen en tonen doen we er niet mee. Daar lopen we tegen drie
dingen aan:

1. **Zien we alles?** Het endpoint heet clock-presales-supply, en als ik het goed begrijp
   gaat onverkochte voorverkoop door naar de klok. Maar komt élke klokpartij eerst door de
   voorverkoop, of gaat een deel er rechtstreeks naartoe? Anders gezegd: als ik dit scherm
   "het klokaanbod van morgen" noem, klopt dat dan?

2. **Wat betekent `numberOfPieces` precies?** Is dat het oorspronkelijk aangeboden aantal,
   of wat er op dat moment nog te koop is? Voor onze inkopers maakt dat nogal uit — die
   willen weten wat er nog ligt.

3. **En `UNAVAILABLE`?** Wij nemen aan: niet meer beschikbaar voor voorverkoop, gaat door
   naar de klok. Klopt die lezing?

Dan het praktische punt. We zitten nu op staging, en daar is het lastig valideren — ik kan
de cijfers niet naast de live Floriday-pagina leggen, en een deel van wat er staat is
duidelijk testdata. Aangezien we niet veel spannenders doen dan aanbod ophalen en tonen:
**wat is er nodig om naar productie te gaan, en hoe lang duurt zo'n aanvraag?** Als we dat
vóór je vakantie in gang kunnen zetten scheelt ons dat weken wachten.

Zullen we morgen even bellen? Dan tikken we bovenstaande in tien minuten door.

groet,
Henk Pieter

---
---

# Mail aan Arjan, door Henk Pieter

Beste Arjan,

Zoals ook per Teams al even getikt, bijgaand alvast een mail met een paar vragen. Wellicht dat deze ook goed in het Slack kanaal passen, maar daarvoor hebben we de uitnodiging volgens mij nog niet binnen? Daarom ook alvast zo even.

1. Grootste vraag zit eigenlijk rond wat de API serveert. De API is 'clock-presales-supply', maar is het ook alleen maar presales? Als ik het goed begreep is dit al het aanbod en neemt het nummer wat af door KVV, maar gaat het restant door naar de klok. Wel fijn om even je bevestiging te hebben daar. 
2. In de data vinden we 'numberOfPieces'. Daalt dat nummer als er klokvoorverkoop plaatsvindt? Of is dit het origineel aangeboden aantal? Is er dan op een andere manier uit de API te halen welke pieces in de voorverkoop inmiddels verkocht zijn?
3. We zien een status 'UNAVAILABLE' en nemen daarbij even aan dat een item dan niet meer available is voor voorverkoop en naar de klok gaat? Als bij een volgende sync het numberOfPieces naar 0 gedaald is, betekent dat dan dat alles in KVV verkocht is?

Bovenstaande vragen richten zich eigenlijk allemaal op de vraag hoe een aangemelde partij zich door KVV naar de klok beweegt en wat de data betekent die de API weergeeft. Omdat het stage-data is, is het ook moeilijk met de live floriday pagina te valideren. Aangezien we niet veel meer spannends doen dan aanbod ophalen is het wellicht een idee om voor deze applicatie binnen afzienbare tijd door te stappen naar de productie-omgeving; dan kunnen we dit soort zaken ook zelf valideren met de online omgeving. 

Goed om elkaar nog even te spreken voor je vakantie denk ik? Ik zal het morgen iig nog even proberen.

groet,
Henk Pieter












# Vragen voor Royal FloraHolland

Opgesteld: 31 juli 2026, na de eerste volledige backfill van de staging-omgeving.
Contactpersoon: Arjan Duijkers, Integration Consultant.

Alle cijfers hieronder komen uit onze eigen database, gevuld met een volledige
synchronisatie van `clock-presales-supply` op staging: **525.458 aanbodregels, 79.004
artikelen, 67.342 organisaties, 2.410 kwekers, 761 veildagen van 21-05-2024 tot
02-08-2027.**

De vragen zijn gegroepeerd en binnen elke groep gesorteerd op belang. De eerste drie
bepalen wat we intern over dit overzicht mogen beweren; de rest gaat over correct en
betrouwbaar bouwen.

---

## 1. Dekking — wat zien we eigenlijk?

Dit is de kern. Zolang dit niet helder is, weten we niet of ons overzicht "het
klokaanbod" is of een deelverzameling daarvan.

**1.1** De API-documentatie beschrijft klokvoorverkoop als *"a percentage of available
quantity of potential Clock sales supply"*, uitsluitend via FloraMondo. Het Helpcenter
beschrijft het juist als een compleet aanbod: *"Het aanbod via de API is heel compleet"*.
Welke van de twee klopt, en welk deel van het werkelijke klokaanbod zien wij via
`clock-presales-supply`?

> **Bijgesteld op 4 augustus 2026.** Twee correcties op onze eigen aanname hierboven, uit
> jullie documentatie:
>
> - Voorverkoop loopt **niet** uitsluitend via FloraMondo. De documentatie noemt
>   *"RFH (FloraMondo), VRM en Plantion auction sales channels"*.
> - Voorverkoop is een **fase vóór de klok**, geen deelverzameling ervan. Onverkochte
>   voorverkoop wordt klok-supply (zie 2.5).
>
> Wat daarmee de kernvraag wordt: **komt élke klokpartij eerst in de voorverkoop, of gaat
> een deel rechtstreeks naar de klok zonder ooit in `clock-presales-supply` te verschijnen?**
> Bij het eerste zien wij alles, alleen in zijn voorverkoop-vorm. Bij het tweede is ons
> overzicht structureel onvolledig, en dat moeten wij intern weten voordat we dit "het
> klokaanbod" noemen.

**1.2** Aan de customers-kant bestaat `/auction/clock-supply/{supplyLineId}` alleen per
individueel ID — er is geen lijst- of sync-endpoint. Aan de suppliers-kant bestaat die
volledige sync wél. Voorziet de roadmap in een sync-endpoint op clock supply voor kopers?
Zo ja, wanneer?

> **Aangescherpt op 4 augustus 2026 na uitproberen.** Dit is voor ons het zwaarste punt
> geworden, want het endpoint is voor ons in de praktijk onbereikbaar:
>
> - `/auction/clock-supply/{id}` met een `supplyLineId` uit clock-presales geeft
>   **404 "ClockSupplyLine ... was not found"**. Klok en voorverkoop gebruiken dus
>   verschillende identifiers.
> - `/auction/clock-supply/sync/0` geeft **404 `route-not-found`** — de route bestaat niet.
> - De enige koppeling die er is, `clockPresalesSupplyReference`, zit **op** `ClockSupplyLine`
>   en wijst naar de voorverkoop. Wij hebben de voorverkoopregel en zoeken de klokregel; die
>   verwijzing loopt dus precies de verkeerde kant op.
>
> Netto: wij kunnen een `ClockSupplyLine` alleen ophalen als we het id al kennen, en er is
> geen enkele manier om dat id te ontdekken. Aan de suppliers-kant bestaat
> `/clock-supply-lines/sync/{sequenceNumber}` wél, met bovendien meer velden (`batchId`,
> `isDeleted`, `salesStrategyId`).
>
> **1.2a** Is er een route die wij over het hoofd zien, of is dit inderdaad niet beschikbaar
> voor kopers? Als het laatste: staat het op de roadmap, en zou een omgekeerde verwijzing
> (een `clockSupplyReference` op de voorverkoopregel) een lichtere tussenoplossing zijn?

**1.3** De documentatie beschrijft het endpoint als *"clock presales supply lines from all
the suppliers in your network"*. Wij hebben **nul connecties** staan en krijgen toch
**2.410 verschillende kwekers** en alle zes veillocaties binnen. Wat betekent "network"
hier precies? En vooral: geldt dat op productie ook, of gaat daar wél een netwerkfilter
gelden waardoor ons beeld ineens veel smaller wordt?

> **Beantwoord op 4 augustus 2026, uit jullie eigen documentatie.** De pagina over clock
> pre sales supply stelt: *"Supply is available for all auction sales channel customers.
> (not customer specific)"*. En de swagger bevestigt het door het contrast: bij
> `/supply-lines/sync/` staat expliciet *"The results are filtered based on your connected
> suppliers"*, bij `/auction/clock-presales-supply/sync/` staat die zin **niet**.
>
> Wij gaan er dus van uit dat ons beeld op productie niet smaller wordt. Graag alleen nog
> een bevestiging dat die "in your network"-formulering achterhaald is en niet iets is dat
> later alsnog gaat gelden.

**1.4** Is er een route — via de API of anderszins — die het volledige klokaanbod ontsluit
zoals de gestopte e-mailservice dat deed? En hoe verhoudt de VMP-koppeling voor
Klokvoorverkoop zich daartoe: een volwaardig alternatief, of een verouderde route die we
beter kunnen laten liggen?

---

## 2. Wijzigingsgedrag — het hart van ons archief

Wij leggen elke inhoudelijke wijziging van een aanbodregel vast, omdat `numberOfPieces`
daalt naarmate er in de voorverkoop gekocht wordt. De eindstand is dus het *onverkochte
restant*, niet wat er is aangeboden. Dat onderscheid is de reden dat dit project bestaat.

**2.1** Klopt dat beeld? Daalt `numberOfPieces` daadwerkelijk bij elke verkoop in de
voorverkoop, en is dat de enige manier waarop een verkoop zichtbaar wordt? Er is geen
aparte status "verkocht" en geen veld met een verkocht aantal.

**2.2** In onze volledige staging-dataset heeft **geen enkele van de 525.458 regels meer
dan één versie**. Wij haalden alles in één keer op, dus we zagen elke regel maar eenmaal —
maar het betekent dat we het verloop dat we willen archiveren nog nooit hebben zien
gebeuren. Hoe vaak wijzigt een regel op productie typisch tijdens het ordervenster?

> **Deels beantwoord op 4 augustus 2026.** We hebben opnieuw gesynchroniseerd, drie dagen na
> de eerste vulling, en toen wél mutaties gezien: **231 regels kregen een tweede versie**,
> naast 1.362 volledig nieuwe regels.
>
> Wat er verandert, over die 231:
>
> | Veld | Aantal |
> |---|---|
> | `lastModifiedDateTime` | 231 (per definitie) |
> | `status` van AVAILABLE naar UNAVAILABLE | 145 |
> | `numberOfPieces` | 86, waarvan **84 naar nul** |
> | `pricePerPiece` | **0** |
>
> Dat bevestigt 2.1 grotendeels: het aantal is inderdaad de plek waar verkoop zichtbaar
> wordt, en de prijs staat vast zodra de regel bestaat. Maar het valt vrijwel altijd in één
> keer naar nul in plaats van geleidelijk af te lopen — één regel nam gedeeltelijk af, één
> werd juist groter. Daarnaast werden 145 regels UNAVAILABLE met hun aantal onaangeroerd,
> wat eerder op "venster gesloten" lijkt dan op "verkocht". Dat is precies het verschil dat
> wij willen archiveren.
>
> **Nieuwe vraag 2.2a:** zien we hier het einde van de voorverkoop in één klap, of mist onze
> synchronisatie de tussenliggende standen doordat wij maar eens per uur kijken? Anders
> gezegd: hoe vaak zouden wij moeten synchroniseren om het werkelijke verloop te zien?

**2.3** Wanneer krijgt een regel een nieuw `sequenceNumber`? Alleen bij een inhoudelijke
wijziging, of ook bij technische operaties aan jullie kant (herindexering, migratie,
datalaad)? Dit is voor ons belangrijk: wij schrijven alleen een archiefregel weg als er
inhoudelijk iets verandert, juist om te voorkomen dat een technische operatie het archief
vervuilt met miljoenen betekenisloze regels.

**2.4** Eerder zagen we 558 regels met exact hetzelfde `lastModifiedDateTime`
(`2026-05-22T08:34`), terwijl die partijen uit april kwamen en hun handelsperiode toen al
gesloten was. Dat oogt als een bulkoperatie, niet als handel. Gebeuren zulke operaties ook
op productie, en zo ja hoe vaak?

**2.5** Wat gebeurt er met een regel na sluiting van het ordervenster? Gaat de status naar
`UNAVAILABLE`, en is het onverkochte deel dat doorschuift naar de klok ergens via de API
zichtbaar?

> **Beantwoord op 4 augustus 2026, uit jullie documentatie.** Er staat: *"After the
> expiration of the clock pre sales order window, non sold clock pre sales supply will be
> allocated as clock sales supply"*, en *"allocated clock pre sales supply is not allocated
> for clock sales supply"*.
>
> Dat verklaart precies het tweedelige patroon dat wij in de 231 mutaties zagen:
>
> | Wat wij zagen | Wat het betekent |
> |---|---|
> | 84 regels naar **0 stuks** | in de voorverkoop verkocht; gaat niet naar de klok |
> | 145 regels **UNAVAILABLE met het aantal onaangeroerd** | niet verkocht; wordt klok-supply |
>
> Onze aanname in 2.1 klopte dus maar half: het aantal is de plek waar verkoop zichtbaar
> wordt, maar de *meeste* regels verlaten de voorverkoop juist **zonder** verkoop, en dat
> zijn precies de regels die op de klok komen.
>
> Daarmee wordt 1.2 des te belangrijker: wij zien nu wel dát er 145 partijen naar de klok
> doorschuiven, maar niet wat daar mee gebeurt — `auctionStatus` kent twaalf waarden
> (`QUEUED_FOR_AUCTION`, `IN_AUCTION`, `AUCTION_COMPLETED`, `NOT_AUCTIONED`,
> `RETOUR_SUPPLIER`, ...) en die zijn voor ons allemaal onbereikbaar.

**2.6** Bij het bekijken van de 231 mutaties uit 2.2 viel iets op: **vrijwel geen enkele
gemuteerde regel had een afleverbon.**

| | Zonder `deliveryNoteReference` |
|---|---|
| Hele archief | 8,9% (46.972 van 526.820) |
| Alleen `AVAILABLE` | 7,7% (70 van 913) |
| **Regels die gemuteerd zijn** | **99,6% (230 van 231)** |

Tegenover 8,9% in het archief als geheel lijkt dat geen toeval. Onze veronderstelling: een
aanbodregel krijgt zijn afleverbon pas als de partij daadwerkelijk wordt aangeleverd, en
regels die nog bewegen in de voorverkoop zijn dat punt nog niet gepasseerd.

Klopt dat? Zo ja, dan is de aanwezigheid van een bonnummer voor ons een bruikbaar signaal
dat een regel definitief is. Wij baseren dit nu op 231 mutaties op staging — te weinig om
op te bouwen zonder bevestiging.

---

## 3. Staging versus productie

Wij bouwen en testen op staging. Voor we live gaan moeten we weten waar de verschillen
zitten.

**3.1** Is de staging-dataset representatief qua volume? Wij hebben 525.458 regels over
ruim twee jaar. Wat is de orde van grootte op productie — per dag, en in totaal?

**3.2** Wordt staging periodiek ververst, gereset of opgeschoond? Dit raakt ons direct:
onze synchronisatie onthoudt het laatst verwerkte sequencenummer. Als dat nummer op
staging ooit **terugloopt** na een reset, denkt onze koppeling dat hij bij is terwijl er
data ontbreekt.

**3.3** Kunnen sequencenummers op productie ooit teruglopen of hergebruikt worden? Wij gaan
ervan uit van niet.

**3.4** Hoe ver terug gaat de historie op productie? Onze staging-set begint op 21-05-2024.
Wij willen een archief vanaf 1 januari 2025. Wordt oude data ooit verwijderd, en zo ja na
hoeveel tijd?

**3.5** Wij zien veildatums tot **2 augustus 2027**, ruim een jaar vooruit (21 regels op die
datum, 4 op 30-04-2027). Is dat staging-testdata, of wordt er op productie ook zo ver
vooruit aanbod aangemaakt?

> **Grotendeels beantwoord op 4 augustus 2026, door onszelf.** De regel van 30-04-2027 blijkt
> voluit *"Agapanthus Blue - Presale Test"* te heten, met 998.319 stuks in één regel. Dat is
> geen langetermijnaanbod maar een testrecord. Zie 3.6.

**3.6** Het levende aanbod op staging is niet alleen klein, het is ook grotendeels
kunstmatig. Van de **913 regels met status `AVAILABLE` is naar onze schatting 62% testdata**
— 569 regels. Herkenbaar aan de naam, of aan een aantal stuks dat over tientallen regels
geen enkele variatie vertoont:

| Regels | Kweker | Artikel |
|---|---|---|
| 256 | M v.d. Knaap Cymbidium BV | CYMB T GEM. — alle 256 exact hetzelfde aantal |
| 156 | Fa G.C. Kuipers | **TEST (do not delete)** |
| 53 | Fa G.C. Kuipers | Purple Phalaenopsis **(DND)** — alle 53 exact 5.700 stuks |
| 43 + 43 | Satter Phalaenopsis BV | Ema White / Rio Grande 12cm |
| 14 | Mts. Handelskwekerij Borgstein | TU EN CASSINI |
| 1 | Fa G.C. Kuipers | **Agapanthus Blue - Presale Test** — 998.319 stuks |
| 1 | Kwekerij de Barreveld BV | **Daytrade-testplant** |
| 1 + 1 | Zwettulips BV, W.T. Buis | artikel heet letterlijk **"test"** |

Die 53 Phalaenopsis-regels zijn illustratief: identiek aantal, identieke verpakking,
identiek fust, maar 37 verschillende prijzen tussen € 0,12 en € 0,91, verdeeld over drie
veillocaties, aangemaakt in batches van enkele seconden. Wij hebben nagegaan dat ze
werkelijk als 53 losse records met eigen `supplyLineId` uit de API komen — het is dus geen
vertekening aan onze kant.

**3.6a** Klopt het dat dit bewust klaargezette testdata is, en is er een manier om die te
herkennen anders dan aan de productnaam? Een vlag of een aparte kweker-id zou ons helpen
om staging-resultaten te beoordelen.

**3.6b** Belangrijker: hierdoor blijven er zo'n **344 regels** over die op echt aanbod
lijken, verdeeld over een handvol kwekers. Dat is te weinig om onze aannames over
prijsverloop, ordervensters en mutatiegedrag op te toetsen. Dit is voor ons het sterkste
argument om op korte termijn naar productie te gaan — zie ook de mail hierboven.

---

## 4. Ritme, vensters en synchronisatiefrequentie

**4.1** Wij synchroniseren nu elk uur, wat ongeveer 21 meetpunten per veildag oplevert. Is
dat een verstandig ritme voor klokvoorverkoop — te vaak, te weinig, of precies goed?

**4.2** Wij zien meerdere handelsvensters naast elkaar bestaan:

| Start (UTC) | Einde (UTC) | Aantal regels |
|---|---|---|
| 07:00 | 03:55 | 163.253 |
| 08:00 | 04:55 | 158.098 |
| 08:00 | 05:25 | 104.794 |
| 07:00 | 04:25 | 68.522 |
| 07:00 | 02:55 | 7.659 |
| 07:00 | 14:00 | 6.540 |

Waar komt die variatie vandaan — per veillocatie, per productgroep, per kweker? En zijn
deze tijden vast of verschuiven ze (zomertijd, feestdagen)?

**4.3** Het overgrote deel van het aanbod wordt kort voor de veildag aangemaakt: 352.066
regels 1 tot 2 dagen vooruit, 99.618 op de dag zelf, 73.405 drie tot zeven dagen vooruit.
Klopt dat patroon met de praktijk? Het bepaalt hoe ver vooruit een overzicht zinvol is.

**4.4** Wat is het aanbevolen moment om te synchroniseren als je maar één keer per dag zou
draaien? Wij vermoeden vlak voor sluiting van het ordervenster, maar horen graag jullie
beeld.

---

## 4b. Productkenmerken — de VBN-codelijst

De kenmerken van een artikel komen binnen als paren van `vbnCode` en `vbnValueCode`, zonder
namen. Wij zien **182 verschillende codes** in het aanbod.

Dit hebben we grotendeels zelf opgelost: het zijn de VBN-kenmerkcodes van Floricode, en die
lijsten staan publiek als pdf. Wij halen ze op met een script en koppelen ze aan de codes
uit de API — daarmee hebben **155 van de 182 codes** een naam, inclusief alle tien de
drukste:

| Code | Naam | Aanbodregels |
|---|---|---|
| `S98` | Kwaliteitsklasse | 525.711 |
| `S62` | Land van herkomst | 396.217 |
| `S05` | Rijpheidsstadium | 386.929 |
| `S20` | Minimum steellengte | 301.554 |
| `V14` | RFH-milieucertificeringsstatus | 270.054 |
| `S15` | Transporthoogte | 265.389 |
| `L11` | Aantal stelen per bos | 248.856 |
| `S01` | Potmaat | 223.909 |
| `S02` | Min. planthoogte incl. pot | 218.032 |
| `S56` | Teeltwijze | 118.412 |

Ter controle hebben we dit naast het RFH Pre-Auction-scherm gelegd, dat de kenmerken wél
uitgeschreven toont. Gekoppeld via het VBN-productnummer klopt het: VBN 6325 toont
"steellengte 60, rijpheid 2-3, stelen/bos 10" waar onze data `S20=070 S05=023 L11=010`
heeft, en VBN 53071 "potmaat 11 cm" bij `S01=011`.

**4b.1** Er blijven **27 codes over zonder naam**, waarvan enkele veel voorkomen: `P01` op
104.939 aanbodregels, `P02` op 46.211, `K01` op 43.937, `K02` op 26.528, `P03` op 24.091.
Die staan niet in de twee kenmerkcodelijsten die publiek staan (snijbloemen en planten). In
welke lijst staan de P-, K- en A-codes, en kunnen wij daarbij?

**4b.2** Is er een machineleesbare vorm van deze lijsten — via de API, als csv, of via
FloriBook? Wij trekken de namen nu uit pdf's, wat werkt maar breekt zodra Floricode de
opmaak verandert.

**4b.3** Zijn deze codes stabiel, of kan een code van betekenis veranderen? Wij tonen de
namen inmiddels in ons eigen overzicht, dus we willen weten hoe hard ze zijn.

---

## 5. Datakwaliteit — dingen die we tegenkwamen

Geen van deze punten blokkeert ons; ze zijn allemaal opgevangen. Maar we willen weten of
het bekend gedrag is of iets wat gemeld moet worden.

**5.1** Bij het synchroniseren van organisaties faalden **15 van 508 records** in één
pagina op validatie: hun `organizationId` is geen geldige UUID. Bij een herhaling van
dezelfde query waren ze verdwenen. Is dat een bekende tijdelijke toestand? Wij slaan zulke
records nu over en gaan door, in plaats van de hele pagina te laten mislukken.

**5.2** Hetzelfde gebeurt bij aanbodregels: gemiddeld 3 tot 7 van elke 1000 records in een
pagina falen op validatie. Zelfde vraag.

**5.3** Er bestaan aanbodregels met `tradeItemId` = `00000000-0000-0000-0000-000000000000`
(bij ons 2 stuks). `GET /trade-items/{id}` geeft daarop een 404. Wat betekent zo'n
nul-UUID — een placeholder, of een fout?

**5.4** 64 van de 79.068 gerefereerde artikelen kunnen we niet ophalen: `GET
/trade-items/{id}` geeft **403**. Onze aanname is dat dit klantspecifieke artikelen van
andere kopers zijn. Klopt dat, en is er een manier om er tenminste de productnaam van te
krijgen? Nu blijven 709 aanbodregels (0,13%) zonder artikelnaam.

**5.5** In `photos[].id` van trade items komt een waarde voor die UUID-vormig is maar geen
geldige UUID (`8bb25702-90f6-4123-d59c-08dc1b2a061e` — het vierde blok begint met `d`,
wat volgens de standaard niet kan). Bewust, of een generatiefout?

**5.6** `vbnProductCode` komt door als **string** (`"105127"`, `"973"`), terwijl
`rfhRelationId` juist als **getal** komt. Bij `vbnProductCode`: kunnen daar ooit
niet-numerieke waarden in staan, of is het altijd een getal in een string?

**5.7** Wij zien 419 aanbodregels met een prijs van **0,00** en een hoogste prijs van
**9999,00**. Zijn dat reële waarden of placeholders?

**5.8** **Hetzelfde afleverbonnummer komt voor bij verschillende kwekers.** Van de 286.390
bonnummers in ons archief worden er **30.964 (11%) door meer dan één kweker gebruikt**,
oplopend tot acht kwekers op één nummer.

Een concreet voorbeeld, bon `65902A`:

| Veildatum | Status | Kweker | Artikel |
|---|---|---|---|
| 02-08-2024 | UNAVAILABLE | Satter Phalaenopsis BV | Rio Grande Phalaenopsis 12cm |
| 03-08-2026 | AVAILABLE | Fa G.C. Kuipers | Purple Phalaenopsis (DND) |

Het patroon wijst op **hergebruik na verloop van tijd**, niet op gelijktijdige botsingen:
de mediane afstand tussen eerste en laatste gebruik van zo'n nummer is **273 dagen** (max
796), en slechts **215** van de 30.964 gevallen vallen op dezelfde veildag. Dat oogt als een
nummerreeks die periodiek opnieuw begint.

**5.8a** Is een afleverbonnummer bedoeld uniek te zijn, en zo ja binnen welke scope — per
kweker, per veildag, per jaar? Wij gebruiken `supplyLineId` als sleutel, dus voor onze
opslag is dit geen probleem. Maar zodra een inkoper "laat mij die partij zien" vraagt, is
het bonnummer wat hij noemt, en dan moeten wij weten wat het identificeert.

**5.8b** Wij zien twee vormen naast elkaar: **227.008 regels met een nummer dat met cijfers
begint** (`65902A`, `51203A`) en **252.804 met een letter** (`F2DDPWA`, `FDRW17A`). Zijn dat
twee verschillende systemen of bronnen, en betekent de letter achteraan iets vasts (wij
zien A, B, C oplopen binnen dezelfde code)?

**5.8c** Zien wij dit hergebruik alleen doordat staging al twee jaar meeloopt zonder
opschoning, of gebeurt het op productie net zo goed?

---

## 6. Techniek en operationeel

**6.1** De rate limit is 3,4 verzoeken per seconde met een burst van 1000. Geldt die per
API-key, per organisatie, of per IP-adres? Wij draaien straks vanaf Vercel, waar het
IP-adres kan wisselen.

**6.2** Is er een limiet op het aantal ID's in `GET /trade-items?tradeItemIds=`? Wij
gebruiken nu 100 per verzoek (URL van circa 3,8 kB), wat werkt.

**6.3** Stuurt de API bij een `429` een `Retry-After` header mee? Wij hanteren nu een
oplopende wachttijd.

**6.4** Hoe worden releases aangekondigd? Er zijn twee per jaar, en wij moeten weten wanneer
velden of enumwaarden wijzigen — onze validatie weigert bewust onbekende waarden in plaats
van ze stil te negeren.

**6.5** Wij zien in onze data alleen `AVAILABLE` en `UNAVAILABLE` als status, en zes van de
zeven veillocaties (`DIGITAL` kwam niet voor). Zijn er waarden die wij nog niet gezien
hebben maar die wel kunnen voorkomen?

**6.6** Wij zien 97 aanbodregels die *ná* hun eigen veildatum zijn aangemaakt. Hoe kan dat?

---

## 7. Naar productie

**7.1** Wat is er nodig om productiecredentials en een productie-API-key te krijgen?

**7.2** Wat houdt het API-abonnementstarief precies in — waar wordt op afgerekend, en welk
bedrag hoort bij ons gebruik? Bij het toevoegen van de integratie verscheen de melding dat
API-gebruik onder een abonnementstarief valt, zonder bedrag.

**7.3** Klopt het dat een API-key maar één keer getoond wordt, en dat verwijderen en
opnieuw toevoegen van de integratie de enige manier is om een nieuwe te krijgen? Dat is
wat wij gedaan hebben. Bestaat er een manier om een key te roteren zonder de koppeling te
verbreken?

**7.4** Uitgaand TCP-verkeer op poort 5432 blijkt bij ons geblokkeerd, waardoor de Prisma
CLI de database niet kan bereiken. Niet jullie probleem, maar wel de reden dat we alles
over WebSocket doen. Zijn er bij andere partijen vergelijkbare netwerkbeperkingen bekend
richting de Floriday API zelf (poorten, IP-whitelisting)?

---

## 8. Nog openstaand uit eerder contact

**8.1** De naam en het e-mailadres van de ontwikkelaar die aan het Slack-kanaal moet worden
toegevoegd. *(Wij moeten dit nog doorgeven.)*

**8.2** De vraag of er een collega langskomt voor Daytrade. *(Wij moeten dit nog
beantwoorden.)*

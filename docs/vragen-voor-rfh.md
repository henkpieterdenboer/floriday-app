# Mail aan Arjan, door Henk Pieter

Beste Arjan,

Zoals ook per Teams al even getikt, bijgaand alvast een mail met een paar vragen. Wellicht dat deze ook goed in het Slack kanaal passen, maar daarvoor hebben we de uitnodiging volgens mij nog niet binnen? Daarom ook alvast zo even.

1. Grootste vraag zit eigenlijk rond wat de API serveert. De API is 'clock-presales-supply', maar is het ook alleen maar presales? Ik kreeg eerder de indruk van je (en ook als ik de documentatie lees) dat het juist ook het daadwerkelijke klokaanbod zou moeten zijn, maar uitsluitsel daarover is wel van belang
2. In de data vinden we 'numberOfPieces'. Daalt dat nummer als er klokvoorverkoop plaatsvindt? Of is dit het origineel aangeboden aantal? Is er dan op een andere manier uit de API te halen welke pieces in de voorverkoop inmiddels verkocht zijn?
3. We zien een status 'UNAVAILABLE' en nemen daarbij even aan dat een item dan niet meer available is voor voorverkoop en naar de klok gaat? 
Bovenstaande vragen richten zich eigenlijk allemaal op de vraag hoe een aangemelde partij zich door KVV naar de klok beweegt en wat de data betekent die de API weergeeft.



Daarbij: omdat het stage-data is, is het ook moeilijk met de live floriday pagina te valideren. Wellicht is het een idee om voor deze applicatie binnen afzienbare tijd door te stappen naar de productie-omgeving; dan kunnen we dit soort zaken ook zelf valideren. 

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

**1.2** Aan de customers-kant bestaat `/auction/clock-supply/{supplyLineId}` alleen per
individueel ID — er is geen lijst- of sync-endpoint. Aan de suppliers-kant bestaat die
volledige sync wél. Voorziet de roadmap in een sync-endpoint op clock supply voor kopers?
Zo ja, wanneer?

**1.3** De documentatie beschrijft het endpoint als *"clock presales supply lines from all
the suppliers in your network"*. Wij hebben **nul connecties** staan en krijgen toch
**2.410 verschillende kwekers** en alle zes veillocaties binnen. Wat betekent "network"
hier precies? En vooral: geldt dat op productie ook, of gaat daar wél een netwerkfilter
gelden waardoor ons beeld ineens veel smaller wordt?

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

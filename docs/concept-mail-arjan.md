Beste Arjan,

Nogmaals dank voor de credentials, de uitleg en de admin-rechten. De koppeling op
staging staat inmiddels: token via de client credentials flow, API key aangemaakt
onder Instellingen > Apps & koppelingen > Integraties, en we halen daadwerkelijk
klokvoorverkoop-aanbod op. Dank daarvoor.

Er is nog één inhoudelijke vraag waar ik graag jouw beeld bij heb.

**1. Het volledige klokaanbod aan de customers-kant**

Dit is voor ons de kern van de koppeling. Wij willen intern een overzicht van al het
aanbod dat voor de klok komt — dat hadden we voorheen via een e-mailservice, en die
is gestopt. De API moet daar nu in gaan voorzien.

In de Customers API (2026v1) zie ik voor de klok het volgende:

- `/auction/clock-presales-supply/` — met max-sequence en sync, dus volledig te
  synchroniseren
- `/auction/clock-supply/{supplyLineId}` — alleen op te vragen per individueel ID

Aan de suppliers-kant bestaat wél een volledige synchronisatie op `/clock-supply-lines/`,
maar die geeft uiteraard alleen onze eigen aanvoer.

Wat we op staging zien is bemoedigend: we halen via `clock-presales-supply` regels op
van alle zes veillocaties en van 35 verschillende aanbieders, terwijl wij nog geen
enkele connectie hebben staan. Het lijkt dus niet op onze connecties gefilterd te
worden, wat mooi zou zijn.

Wat ik niet kan beoordelen is de dekking. De API-documentatie beschrijft clock
pre sales als een percentage van de potentiële klokvoorraad, exclusief via FloraMondo.
Het Helpcenter beschrijft Klokvoorverkoop juist als een compleet aanbod. En de
staging-data is testmateriaal uit 2024, dus daar kan ik het niet aan afmeten.

Concreet:

- Welk deel van het werkelijke klokaanbod zien we via `clock-presales-supply`?
- Is dit de bedoelde route voor een aanvoeroverzicht, of bestaat er een ander
  endpoint of kanaal, eventueel buiten de Customers API om?
- Voorziet de roadmap in een sync-endpoint op clock supply aan de customers-kant?
  Nu is `/auction/clock-supply/{supplyLineId}` alleen per individueel ID op te vragen.

Als er een bestaande route is die de oude e-mailservice vervangt, horen we die
natuurlijk graag. Ik zag de VMP-koppeling voor Klokvoorverkoop staan — is dat wat
je ons zou aanraden, of is de API daar inmiddels in alle opzichten beter voor?

**2. Slack**

De ontwikkelaar die je aan het kanaal kunt toevoegen is [NAAM + E-MAILADRES].

**3. Daytrade**

[ANTWOORD OP DE VRAAG OF ER EEN COLLEGA LANGS MOET KOMEN VOOR DAYTRADE]

Ik hoor graag van je.

Met vriendelijke groet,

Henk Pieter den Boer
Financieel Directeur
Coloriginz

---

## Aantekeningen bij dit concept

- Bijgewerkt 31-07-2026: de API key is inmiddels zelf aangemaakt, dus dat punt is
  uit de mail gehaald. Wat overblijft is de inhoudelijke dekkingsvraag.
- Twee blokken staan nog als placeholder: de naam van de ontwikkelaar voor Slack,
  en het antwoord op de Daytrade-vraag.
- De onderbouwing van de dekkingsvraag staat in `docs/inventarisatie.md` §4.
- Als je liever eerst even belt: de drie opsommingsvragen kunnen dan flink korter,
  en dient de mail alleen als bevestiging achteraf.

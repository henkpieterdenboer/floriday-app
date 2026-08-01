# Deelproject B — toegang en zoekinterface

Datum: 1 augustus 2026
Status: goedgekeurd, klaar voor implementatieplan

---

## 1. Doel en afbakening

Het gearchiveerde klokvoorverkoop-aanbod doorzoekbaar maken voor collega's, achter een
inlog. Deelproject A vulde de database; dit maakt hem bruikbaar.

**Drie manieren van kijken**, allemaal in één scherm:

1. **Vooruit, voor de inkoop** — wat komt er de komende dagen voor de klok.
2. **Terug, voor analyse** — hoeveel is er aangeboden van wat, door wie, tegen welke prijs.
3. **Gericht opzoeken** — een specifieke partij, kweker of artikel terugvinden.

**Binnen scope**

- Inloggen met e-mailadres en wachtwoord, met Microsoft Entra voorbereid maar uitgeschakeld.
- Gebruikersbeheer door een beheerder, met uitnodiging per e-mail.
- Eén zoekscherm met datumpresets, filters, en een schakelaar tussen losse regels en een
  samenvatting daarvan.

**Buiten scope** — deelproject C: de dagelijkse doorgifte naar de interne
informatievoorziening.

### Ook buiten scope: het verloop per aanbodregel

Deelproject A legt elke inhoudelijke wijziging van een aanbodregel vast in
`SupplyLineVersion`, juist om zichtbaar te maken hoeveel er vóór de klok wegging. Dit
scherm laat dat verloop nog niet zien, en dat is een bewuste keuze.

De reden is dat er nog niets te tonen valt. In de volledige staging-vulling heeft **geen
enkele van de 525.458 regels meer dan één versie** — wij haalden alles in één keer op en
zagen elke regel dus maar eenmaal. Verloop ontstaat pas zodra de uurlijkse synchronisatie
een tijd meeloopt met echte handel.

Een schermonderdeel ontwerpen voor data die we nog nooit hebben zien bewegen levert bijna
zeker het verkeerde onderdeel op. Zodra er een paar weken verloop in zit, weten we hoe vaak
een regel verandert en hoe groot de stappen zijn, en dan is dit een gerichte toevoeging in
plaats van een gok. Het datamodel ligt er al klaar voor.

## 2. Wat we vooraf hebben gemeten

Alles hieronder komt uit de gevulde database (525.458 aanbodregels), niet uit een aanname.

### Hoeveel keuzes heeft elk filter

| Filter | Aantal | Wat daarbij past |
|---|---|---|
| Veillocatie | 6 | Vinkjes, alles zichtbaar |
| Veildatum | 761 dagen | Presets plus een eigen bereik |
| Kweker | 2.410 | Zoekend keuzeveld |
| Artikelnaam | 10.942 | Zoekveld met suggesties |
| Partijbrief | 213.457 | Alleen vrij zoeken |

### Hoe groot een selectie is

Een drukke veildag telt 13.940 regels; diezelfde dag op één locatie nog altijd 5.989. Ook
na stevig filteren blijven het er dus duizenden. Het scherm mag nooit alles tegelijk willen
laden: de database filtert en sorteert, het scherm toont een venster van vijftig.

### Wat de database aankan

Gemeten tegen Neon Frankfurt, beste van drie, met een warme database:

| Query | Tijd |
|---|---|
| Eerste vijftig regels van een veildag | 37 ms |
| Vijftig regels op offset 5000 | 61 ms |
| Aantal regels van een veildag | 38 ms |
| Aantal regels over een heel jaar | 65 ms |
| Samenvatting per week over een heel jaar | 296 ms |
| Samenvatting per kweker over een heel jaar | 224 ms |
| Samenvatting per artikel over een heel jaar | 862 ms |
| Vrij zoeken op artikelnaam over een heel jaar | 237 ms |

Twee conclusies. **Eenvoudige offset-paginering volstaat** — diep pagineren kost 61 ms, dus
de complexiteit van keyset-paginering levert hier niets op. En **er is geen cachelaag
nodig**: zelfs het zwaarste geval blijft ruim onder een seconde.

### Het echte prestatieprobleem zit ergens anders

Diezelfde queries kostten koud 638 ms, 1.819 ms en 3.864 ms. Neon schakelt de compute uit
na vijf minuten stilte, en onze uurlijkse cron houdt hem niet wakker. De eerste query van
de ochtend duurt dus seconden, daarna is alles snel.

Dat is te leven, maar het moet zichtbaar zijn in plaats van als haperen overkomen. Zie §7.

## 3. Architectuur

```
Next.js App Router
├─ (public)
│   ├─ /login                      wachtwoord nu, Entra-knop zodra geconfigureerd
│   └─ /uitnodiging/[token]        eerste wachtwoord instellen
├─ (protected)                     middleware weigert zonder geldige sessie
│   ├─ /aanbod                     het zoekscherm
│   └─ /beheer/gebruikers          alleen voor ADMIN
└─ /api/cron/*                     bestaand, blijft ongemoeid

src/features/supply-search/        presets, filters, queries, het grid
src/features/auth/                 providers, gebruikersbeheer, wachtwoorden, uitnodigingen
src/lib/mail.ts                    Nodemailer: Ethereal in ontwikkeling, Resend in productie
```

Dit komt naast de bestaande synchronisatie, in dezelfde applicatie en dezelfde database.

## 4. Toegang

### Datamodel

```prisma
enum UserRole {
  ADMIN
  VIEWER
}

model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique
  name         String
  passwordHash String?
  role         UserRole  @default(VIEWER)
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime? @db.Timestamptz
  createdAt    DateTime  @default(now()) @db.Timestamptz

  invitations  Invitation[]

  @@index([email])
}

model Invitation {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  tokenHash String    @unique
  expiresAt DateTime  @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  createdAt DateTime  @default(now()) @db.Timestamptz

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

`passwordHash` is nullable: tussen uitnodigen en het instellen van een wachtwoord bestaat
het account al zonder er een te hebben. In de database staat alleen de **hash** van het
uitnodigingstoken, nooit het token zelf — wie de database inziet mag daarmee geen
uitnodiging kunnen inwisselen.

### Inloggen

NextAuth met JWT-sessies. Wachtwoorden gehasht met argon2id.

De Azure Entra-provider staat in de code maar wordt alleen geregistreerd als de bijbehorende
omgevingsvariabelen aanwezig zijn. Ontbreken die, dan verschijnt de knop niet. Entra
aanzetten is straks dus configuratie, geen verbouwing.

**Bij aanmelden via Entra koppelen we uitsluitend op e-mailadres, en alleen op een account
dat al bestaat en actief is.** SSO geeft toegang tot bestaande accounts en maakt er nooit
zelf een aan. Zonder die regel kan iedereen met een werkmailadres binnenlopen zodra de
koppeling live gaat.

### Gebruikersbeheer

Geen zelfregistratie. Een beheerder voert naam en e-mailadres in; het systeem maakt het
account aan en verstuurt een uitnodiging met een eenmalige link die na zeven dagen verloopt.
Bij het instellen van het wachtwoord wordt het token als gebruikt gemarkeerd.

Een beheerder kan een account deactiveren. Dat blokkeert zowel wachtwoord- als
Entra-aanmelding, en is te verkiezen boven verwijderen omdat het bij een audit navolgbaar
blijft.

Twee rollen. `ADMIN` beheert gebruikers, `VIEWER` gebruikt het zoekscherm. Meer rollen zijn
er niet nodig zolang iedereen dezelfde data mag zien.

## 5. De queries

### Filters

| Filter | Vorm |
|---|---|
| Periode | Preset of eigen bereik, op `auctionDate` |
| Veillocatie | Meerdere aan te vinken uit zes |
| Kweker | Meerdere te kiezen, zoekend |
| Artikel | Zoekend op naam |
| Vrij zoeken | Artikelnaam, kwekernaam of partijbriefnummer |
| Status | Optioneel: alleen `AVAILABLE` |

### Presets

Pure functies: een preset gaat erin, een concreet datumbereik komt eruit. Los te testen, en
het scherm gebruikt dezelfde uitkomst om de datums erbij te tonen.

| Preset | Bereik |
|---|---|
| Komende drie dagen | vandaag t/m vandaag + 2 |
| Deze week | maandag t/m zondag van de huidige week |
| Vorige week | maandag t/m zondag van de vorige week |
| Deze maand | eerste t/m laatste dag van de huidige maand |
| Dit jaar | 1 januari t/m vandaag |
| Vorig jaar | 1 januari t/m 31 december van vorig jaar |
| Zelf kiezen | twee datums |

**Een preset toont altijd de concrete datums die erbij horen.** "Komende drie dagen" zonder
te zeggen welke dagen dat zijn, laat de lezer raden wat hij ziet.

De keuze voor drie dagen in plaats van alleen morgen komt uit de data: 352.066 regels worden
één tot twee dagen voor de veildag aangemaakt en 99.618 op de dag zelf. Strikt morgen zou
een deel van wat er werkelijk aankomt buiten beeld laten. Dit wordt gevalideerd met een
inkoper en kan daarna nog verschuiven.

### Twee resultaatvormen

**Regels** — vijftig per pagina, gesorteerd op een kolom uit een vaste lijst, met het totaal
apart opgehaald. Sorteerkolommen komen nooit rechtstreeks uit de URL in de query terecht.

**Samenvatting** — dezelfde filters, gegroepeerd op een van vier assen:

| As | Groepering |
|---|---|
| Tijdvak | dag, week of maand |
| Kweker | `supplierOrganizationId`, met naam |
| Artikel | artikelnaam |
| Veillocatie | `initialAuctionLocation` |

Per groep: aantal regels, totaal aantal stuks, gemiddelde prijs per stuk, aantal
verschillende kwekers. Plus een totaalregel onderaan.

## 6. Het scherm

### De filterstand staat in de URL

Dat lijkt een detail maar het bedient het derde gebruik rechtstreeks: wie een partij heeft
opgezocht, kan die link doorsturen en de ander ziet exact dezelfde selectie. Het maakt ook
de terugknop van de browser bruikbaar en een selectie bookmarkbaar.

### Indeling

Van boven naar beneden: de presets met hun datums, de zoek- en filtervelden, de schakelaar
tussen regels en samenvatting, en dan de tabel. Bij een samenvatting staat ernaast waarop
gegroepeerd wordt.

### Doorklikken

Klikken op een regel in de samenvatting zet die groep als extra filter en schakelt terug
naar de regels. Uitzoomen en weer inzoomen zonder de selectie te verliezen — dat is de
beweging die één scherm met twee standen boven twee losse schermen doet verkiezen.

### Actualiteit altijd zichtbaar

Boven de tabel staat permanent wanneer de laatste geslaagde synchronisatie was, uit
`SyncRun`. Niemand mag naar verouderde cijfers kijken zonder dat te weten. Is de laatste
geslaagde run ouder dan drie uur, dan wordt die melding nadrukkelijk in plaats van
terloops.

### De tabel

TanStack Table, headless, met eigen opmaak in Tailwind en shadcn/ui. Het regelt sorteerstand,
kolomzichtbaarheid en selectie; wij bepalen hoe het eruitziet. Omdat de database filtert,
sorteert en pagineert, toont het grid nooit meer dan vijftig regels tegelijk — een zwaarder
grid met eigen serverside-model levert hier niets op en kost een licentie.

## 7. Foutafhandeling en de trage eerste query

Het scherm toont onmiddellijk zijn opbouw met een laadindicator in plaats van een leeg vlak.
Duurt een query langer dan drie seconden, dan komt er een regel bij dat de database wakker
wordt — dat is eerlijker dan een spinner die niets uitlegt, en het voorkomt dat iemand denkt
dat het scherm stuk is.

Een lege selectie zegt wat er is uitgefilterd en biedt aan het te verruimen, in plaats van
alleen te melden dat er niets is.

Een query die faalt toont een nette melding met de mogelijkheid het opnieuw te proberen. De
onderliggende fout gaat naar de serverlog, niet naar het scherm.

## 8. Testaanpak

**Unittests, zonder netwerk.** De presets (elke preset naar een bereik, ook rond
jaarwisselingen en zomertijd), de vertaling van filters naar queryonderdelen, en de
sorteerwhitelist.

**Integratietests tegen de gevulde database.** Die bevat 525.458 echte regels, dus we kunnen
tegen realistische volumes testen in plaats van tegen drie verzonnen rijen: dat filters
combineren wat ze moeten combineren, dat paginering geen regels overslaat of dubbel toont,
en dat een samenvatting optelt tot hetzelfde totaal als de regels eronder.

**Toegang.** Dat de middleware zonder geldige sessie weigert, dat een uitnodigingstoken maar
één keer werkt en na verloop niet meer, dat een gedeactiveerde gebruiker niet binnenkomt, en
dat een `VIEWER` het beheerscherm niet kan openen.

## 9. Randvoorwaarden

| | |
|---|---|
| Grid | TanStack Table met shadcn/ui en Tailwind |
| Auth | NextAuth, JWT-sessies, argon2id voor wachtwoorden |
| E-mail | Nodemailer: Ethereal in ontwikkeling, Resend in productie |
| Database | Bestaande Neon-database, uitgebreid met `User` en `Invitation` |
| Schemawijziging | Via `npm run db:push` — poort 5432 is geblokkeerd, zie het README |
| Volgorde | Het plan levert eerst toegang volledig werkend op, daarna het scherm |

### Openstaande punten

1. **Entra.** De koppeling moet nog ingericht worden. Tot die tijd blijft de knop
   onzichtbaar; er is verder niets aan te bouwen.
2. **De preset "komende drie dagen".** Onderbouwd met data, maar te valideren met een
   inkoper. Kan daarna verschuiven.
3. **Neon in slaap.** Wordt nu opgevangen in het scherm. Als het storend blijkt, is de
   database wakker houden een kwestie van geld, geen herbouw.
4. **Het verloop per regel.** Bewust uitgesteld tot er verloopdata is om tegen te
   ontwerpen; zie §1. Terugkomen zodra de uurlijkse synchronisatie een aantal weken op
   echte handel heeft meegelopen.
5. **De statusfilter.** Op staging is 543 van de 525.458 regels `AVAILABLE`, dus dat filter
   is daar nauwelijks te beoordelen. Op productie ligt die verhouding vermoedelijk heel
   anders en wordt het waarschijnlijk juist een van de nuttigste filters voor de inkoop.

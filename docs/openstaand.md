# Wat er nog openstaat

Bijgewerkt: 2 augustus 2026.

Gesorteerd op wat het meest in de weg zit. Streep af wat klaar is.

---

## 1. Bij Royal FloraHolland

Dit blokkeert het meeste, en het loopt via een ander.

- [ ] **De vragenlijst sturen.** `docs/vragen-voor-rfh.md`, acht groepen, onderbouwd met
      cijfers uit de gevulde database. De drie zwaarste: zien we het volledige klokaanbod of
      een percentage, komt er een sync-endpoint voor kopers, en geldt het netwerkfilter op
      productie wel.
- [ ] **Productiecredentials en API-key aanvragen.** Zonder dit blijft de productiedatabase
      leeg. Let op: de API-key wordt **één keer** getoond bij het aanmaken van de integratie.
- [ ] **Twee gegevens voor de conceptmail** (`docs/concept-mail-arjan.md`): de naam en het
      e-mailadres van de ontwikkelaar voor het Slack-kanaal, en het antwoord op de vraag of
      er een collega langskomt voor Daytrade.

### De vraag die het meest uitmaakt

Wij hebben **nul connecties** in Floriday en krijgen toch 2.410 kwekers en alle zes
veillocaties binnen. De documentatie beschrijft het endpoint als *"from all the suppliers in
your network"*. Klopt dat filter wél op productie, dan wordt ons beeld ineens veel smaller
en verandert dat wat dit systeem kan beloven.

---

## 2. Productie in gebruik nemen

Pas te doen als de credentials binnen zijn. In deze volgorde:

- [ ] Credentials invullen in Vercel (Production) en in `.env.lokaal-productie`.
- [ ] `npm run create-admin -- --env .env.lokaal-productie --email ... --naam "..."`
- [ ] `npm run invite -- --env .env.lokaal-productie --email ... --url https://<productie-url>`
      als je de link nodig hebt om een wachtwoord te zetten.
- [ ] De backfill draaien: `npm run backfill -- --env .env.lokaal-productie`. **Niet eerder**
      — met staging-credentials zou staging-testdata in het productiearchief belanden, en dat
      is achteraf niet meer te scheiden.
- [ ] `SYNC_ENABLED` in Vercel op `true` zetten of weghalen.
- [ ] Controleren dat de cron loopt: kijk in `SyncRun` of er runs met `SUCCEEDED` binnenkomen.

---

## 3. Microsoft Entra

- [ ] **De tenant-controle bouwen.** De spec schreef `profile.email_verified` voor, en dat
      veld bestaat niet in Entra — elke aanmelding zou nu weigeren. De juiste controle is dat
      de `tid` in het token overeenkomt met de eigen tenant-id, en dat
      `AZURE_AD_TENANT_ID` dus niet op `common` staat. Zie de spec, §4.
- [ ] **De koppeling inrichten in Azure** en de drie `AZURE_AD_*`-variabelen zetten. Zolang
      die ontbreken blijft de aanmeldknop onzichtbaar, wat de bedoeling is.

Niet te bouwen of te testen zonder een geconfigureerde tenant.

---

## 4. E-mail voor productie

- [ ] **Resend inrichten** en de `SMTP_*`-variabelen zetten. Zolang die ontbreken loopt alles
      via Ethereal: er wordt niets echt verstuurd, maar elke mail is via een preview-link te
      bekijken. Dat is prima voor test, niet voor productie — een uitgenodigde collega krijgt
      dan nooit iets.

---

## 5. Aan het scherm, na gebruik

Deze wachten bewust op ervaring in plaats van op een beslissing nu.

- [ ] **De preset "komende drie dagen" valideren met een inkoper.** Onderbouwd met data
      (352.066 regels worden 1 tot 2 dagen vooruit aangemaakt, 99.618 op de dag zelf), maar
      niet met de praktijk.
- [ ] **Het verloop per aanbodregel tonen.** Het archief legt elke wijziging vast, maar er
      is nog geen verloop om tegen te ontwerpen: geen enkele van de 525.458 regels heeft meer
      dan één versie, omdat alles in één keer is opgehaald. Dat ontstaat pas als de uurlijkse
      sync een paar weken op echte handel meeloopt. Dán weten we hoe vaak en hoe grof regels
      veranderen, en is dit een gerichte toevoeging in plaats van een gok.
- [ ] **Kweker en artikel als eigen filter**, los van het vrije zoekveld. Doorklikken vanuit
      de samenvatting loopt nu via het zoekveld, wat werkt maar minder precies is.
- [ ] **Vrij zoeken sneller maken** als dat gaat storen. Gemeten 700–800 ms warm, want een
      `ILIKE '%term%'` kan geen index gebruiken. Een `pg_trgm` GIN-index op `TradeItem.name`,
      `Organization.name` en `SupplyLine.deliveryNoteReference` lost dat op.

---

## 6. Deelproject C — distributie

- [ ] **Bepalen waar de data heen moet.** Dit is de enige echte open ontwerpvraag: een
      export, een mail, een koppeling met een bestaand systeem? Zonder dat antwoord valt er
      niets te ontwerpen.

---

## 7. Kleinere dingen

- [ ] **`middleware.ts` hernoemen naar `proxy.ts`.** Next.js 16 noemt de oude naam
      verouderd. Werkt nog volledig; puur opruimen.
- [ ] **Overwegen de staging-credentials te roteren.** Ze stonden in `docs/inventarisatie.md`
      en dus in de git-historie, maar die is herschreven vóór de eerste push — ze hebben nooit
      buiten de eigen machine gestaan. Roteren is dus niet nodig, wel het zekere voor het
      onzekere.
- [ ] **De testdatabase actueel houden.** Vercel Cron draait alleen op productie, dus de
      testdata bevriest op wat er nu staat tenzij daar met de hand een backfill draait. Voor
      het beoordelen van het scherm is dat prima.

---

## Wat géén actie nodig heeft

Deze zijn bekeken en bewust zo gelaten:

- **Neon slaapt na vijf minuten.** De eerste query van de ochtend kost een seconde of twee.
  Het scherm vangt dat op met een melding dat de database wakker wordt. Wakker houden kost
  geld en levert weinig op.
- **709 aanbodregels zonder artikelnaam** (0,13%). Floriday weigert 64 artikelen met een 403
  of 404 — klantspecifieke artikelen van andere kopers, plus één nul-UUID. Het scherm toont
  daar het artikel-ID in gedempte opmaak.
- **349 regels met een negatief aantal stuks.** Vermoedelijk correcties in de feed. De
  opmaak gaat er correct mee om.
- **Zeven mislukte cron-runs op productie.** Die zijn van vóór `SYNC_ENABLED=false` en laten
  zien dat de keten werkt. Ze blijven staan als markering van waar de echte synchronisatie
  begint.

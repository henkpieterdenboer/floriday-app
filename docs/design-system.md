# Design system

Bijgewerkt: 6 augustus 2026.

Deze app haalt gedeelde onderdelen uit het Coloriginz design system, een shadcn custom
registry. Onderdelen komen als **broncode** binnen: er is geen npm-pakket en geen
runtime-koppeling. Deze app bezit haar eigen kopie en mag afwijken.

Registry: `https://design-system.apps.coloriginz.com/r/{name}.json`, gekoppeld in
`components.json`. Bron: `C:\HPProjects\col-design-system`.

## Wat we gebruiken

| Item | Versie | Waarvoor |
|---|---|---|
| `@col/demo-mode` | 1.0.1 | De testbalk boven aan elke pagina |
| `@col/auth-shell` | 1.0.0 | Achtergrondfoto + kaart op login en uitnodiging |
| `@col/brand-logo` | 1.1.0 | Het Coloriginz-logo in de kaartheader |
| `@col/sso-button` | 1.0.0 | De Microsoft-knop op de inlogpagina |
| `@col/brand-assets` | 1.0.0 | Script dat de foto's en logo's naar `public/brand/` haalt |
| `@col/email-shell` | 1.0.0 | De uitnodigingsmail (zie "De uitnodigingsmail") |

Installeren of bijwerken:

```bash
npx shadcn add @col/demo-mode --overwrite
git diff
```

Dat raakt alleen de beheerde bestanden in `src/components/demo/`, `src/components/auth/` en
`src/components/brand/`. Onze eigen code blijft ongemoeid — daarom staat die ook niet in die
mappen.

Welke versies hier draaien:

```bash
grep -rn "_VERSION = " src/components/
```

De merkassets zitten niet in de registry maar achter een manifest, en worden apart
opgehaald:

```bash
node scripts/pull-brand-assets.mjs
git diff public/brand/
```

Bewust geen build-stap: zo zie je in de diff wanneer een logo verandert, en werkt de app
door als het design system onbereikbaar is. Let op dat `npx shadcn add @col/brand-assets`
het script in `src/scripts/` neerzet (het volgt de `lib`-alias); wij hebben het naar
`scripts/` verplaatst omdat al onze scripts daar staan. Na een `--overwrite` staat het er
weer dubbel — verplaats het dan opnieuw.

## Hoe de balk is ingebouwd

Het item levert drie componenten: `DemoBar`, `DemoRoleSwitcher` en `DemoEmailSwitcher`.
**Wij gebruiken alleen `DemoBar`.**

De balk staat in `src/app/layout.tsx`, dus in de root layout en niet in de beschermde
layout. Dat is bewust: zo staat hij ook op het inlogscherm, en juist daar wil je weten of
je op een testomgeving inlogt.

Wanneer hij verschijnt bepaalt `src/features/environment/environment-banner.ts`, een pure
functie met acht tests. De regel is omgekeerd aan wat voor de hand ligt: **tonen tenzij
aantoonbaar productie.** Een ontbrekende balk op een testomgeving is gevaarlijker dan een
balk te veel — dan denk je naar echte cijfers te kijken terwijl het staging-testdata is.
Een onbekende of niet-gezette `VERCEL_ENV` valt dus aan de veilige kant.

De tekst noemt ook tegen welke Floriday-omgeving de app praat:

```
Lokale omgeving · Floriday staging · geen echte cijfers
Testomgeving · Floriday staging · geen echte cijfers
```

Dat lijkt overbodig naast "testomgeving", maar het vangt de combinatie af die het meest
verwarrend is: een testomgeving die per ongeluk tegen productiegegevens praat, of andersom.

## De rol- en e-mailschakelaar

`DemoRoleSwitcher` en `DemoEmailSwitcher` zitten sinds 3 augustus 2026 in de balk, via
`src/components/demo/demo-controls.tsx` (glue, niet beheerd) en twee eigen routes:
`/api/auth/switch-role` en `/api/email-provider`.

**Het design system is op Radix gebouwd; deze app draait op base-ui.** Onze
`src/components/ui/dropdown-menu.tsx` importeert `@base-ui/react/menu`, terwijl
`demo-role-switcher.tsx` op Radix-gedrag leunt:

```tsx
onSelect={(e) => e.preventDefault()}   // moet het menu openhouden bij meerdere rollen
```

De typecheck klaagt niet, want die prop bestaat op elk element (React's generieke
tekstselectie-event) - maar base-ui luistert er niet naar. Uit onderzoek in
`node_modules/@base-ui/react/menu/checkbox-item/MenuCheckboxItem.js` blijkt `closeOnClick`
voor `MenuCheckboxItem` standaard al `false` te zijn: het menu blijft dus sowieso open,
buiten die `onSelect`-regel om. Bevestigd in een echte browser (Chrome, lokaal): het menu
blijft open na een klik en de rol wisselt zichtbaar.

**Eén rol per gebruiker, geen array.** `DemoRoleSwitcher` verwacht een rollen-array en
voegt een nieuw aangevinkte rol toe aan het *einde* in plaats van te vervangen (zie
`roles.ts`, beheerd). Met precies één actieve rol levert een klik op de andere rol dus
`[huidigeRol, nieuweRol]` op - "het eerste element pakken" geeft dan de ongewijzigde rol
terug. `src/features/auth/pick-new-role.ts` pakt in plaats daarvan het element dat afwijkt
van de huidige rol.

**De rol zit in de JWT, ververst alleen bij inloggen.** Na het wisselen roept
`demo-controls.tsx` `useSession().update({})` aan (met een object, niet zonder argumenten -
anders doet next-auth een GET die de `jwt`-callback niet met `trigger: "update"` aanroept).
Zie het commentaar bij de `jwt`-callback in `src/features/auth/auth-config.ts`.

### Twee regels die tegengesteld terugvallen

De balk en de demo-besturing gebruiken **verschillende** functies, en dat is opzet.

| | Bij twijfel | Waarom |
|---|---|---|
| `resolveBanner` | tonen | Een ontbrekende balk laat je denken dat je naar echte cijfers kijkt |
| `isDemoModeAllowed` | weigeren | De rolwisselaar schrijft naar `User.role`; aan op productie betekent dat elke viewer zichzelf beheerder maakt |

Het concrete geval waarvoor dit uit elkaar moest: Vercel kent een instelling
**"Automatically expose System Environment Variables"**. Staat die uit, dan is `VERCEL_ENV`
leeg — ook op productie. Een enkele regel `vercelEnv !== "production"` zou de rolwisselaar
dan juist op productie tonen.

`isDemoModeAllowed` kijkt daarom ook naar `VERCEL`: buiten Vercel (lokaal) altijd toestaan,
op Vercel alleen bij een expliciete `preview` of `development`.

Het ziet eruit als een inconsistentie en wordt bij een opruimactie makkelijk
"rechtgetrokken". Er staat een test omheen die vastlegt dat de twee bij hetzelfde geval
verschillend beslissen.

Bewust geen `NEXT_PUBLIC_DEMO_MODE`: die reist mee naar de browser en moet met de hand goed
gezet worden. Vergeten op preview is hinderlijk, per ongeluk aan op productie is een gat.
Uitgeschakeld geven beide routes 404, niet 403.

## Kijk eerst naar de preview

De repo `col-design-system` heeft naast `docs/items/*.md` een **preview-route per item**
onder `app/<item>/page.tsx`. Draaien:

```bash
cd C:\HPProjects\col-design-system
npx next dev --port 3100
```

Dan `http://localhost:3100/auth-pages-starter`, `/auth-shell`, `/sso-button`, enzovoort.

De markdown vertelt wat de API is; de preview vertelt hoe het eruit hoort te zien - maten,
gewichten, spacing, volgorde. Op `/auth-pages-starter` staat dat ook met zoveel woorden:
*"Het uiterlijk is de standaard, de code is een startpunt."* Deze pagina's zijn de eerste
keer gebouwd zonder die preview te bekijken en weken zichtbaar af (logo te klein, te weinig
lucht, titel te licht). Zie `tasks/lessons.md`.

### Onze card is niet hun card

Het design system draait op de klassieke shadcn-card: `gap-6`, `py-6`, `px-6`, `border` +
`shadow-sm`. Wij draaien op de **base-nova**-preset, waar dat `gap-(--card-spacing)` is met
`--card-spacing: --spacing(4)` — 16px in plaats van 24px — en een `ring-1` in plaats van een
border met schaduw.

Dezelfde JSX levert daar dus meer lucht op dan hier. Op de auth-pagina's zetten we daarom
`className="[--card-spacing:--spacing(6)]"` op de `Card`, wat padding én de afstand tussen
header en content in één keer op de waarde van het design system brengt.

De rand houden we wel base-nova: die is consistent met het aanbod- en beheerscherm, en een
`ring-1` en een `border` van 1px zijn op een foto nauwelijks te onderscheiden.

## De auth-pagina's

`/login` en `/uitnodiging/[token]` staan sinds 3 augustus 2026 in een `AuthShell`: de foto
`public/brand/backgrounds/default.jpg` met `overlay="light"`, en daarop een kaart met het
logo (`variant="plain"`, want een zwart woordmerk op een witte kaart) boven de titel.

De maatvoering is nagebouwd van de preview en staat daarom expliciet in de JSX:

| | Waarde | Waarom niet de default |
|---|---|---|
| `Card` | `[--card-spacing:--spacing(6)]` | base-nova staat op 4; zie hierboven |
| `CardHeader` | `gap-2 space-y-4` | hun header heeft `gap-2`, de preview zet `space-y-4` erbij; onze header staat op `gap-1` |
| `BrandLogo` | `size="h-12"` | default is `h-24`, de preview gebruikt `h-12` |
| `CardTitle` | `text-center text-2xl font-bold` | onze default is `text-base font-medium` |
| Separator | `my-6`, label `text-sm` | de ruimte eromheen komt niet uit een gap |

Wat wij bewust anders houden dan de preview: geen taalkiezer (deze app is eentalig) en geen
"wachtwoord vergeten" (een beheerder stuurt een nieuwe uitnodiging).

De overlay van `AuthShell` is `absolute` binnen de shell en niet `fixed`. Daardoor blijft de
testbalk erboven leesbaar in plaats van mee te verduisteren. Dat is een keuze van het item,
niet iets wat wij hier hebben rechtgezet — hij staat er om deze reden.

### Waarom niet `@col/auth-pages-starter`

Dat item levert vier complete pagina's en drie API-routes, en zou op het eerste gezicht
precies zijn wat we nodig hadden. We hebben het bewust niet genomen:

- Het draagt het auth-model van de onboarding-portal mee: `activationToken` en
  `activationExpiresAt` **op de User**, bcryptjs, een eigen wachtwoord-vergeten-flow. Wij
  hebben een aparte `Invitation`-tabel die alleen de hash bewaart, argon2id, en geen
  wachtwoord-vergeten (een beheerder stuurt een nieuwe uitnodiging).
- Het verwacht zes modules die wij nergens anders voor gebruiken: `i18n-context`,
  `LanguageSelector`, `label-config`, `logo-base64`, `rate-limit`, `validations`. Zonder die
  bouwt de app niet.
- Zijn `registryDependencies` bevatten `alert, button, card, input, label, separator`. Die
  worden in hun upstream-versie opgehaald en overschrijven onze kopieën — en die zitten in
  het inlogscherm, het beheerscherm én het aanbodscherm.

De drie componenten eronder zijn wel overgenomen. Samen geven ze hetzelfde beeld, op onze
eigen authenticatie, waar de tests al omheen staan.

### De Microsoft-knop en onze server action

`SsoButton` is een `type="button"` met een `onClick`; wij melden aan via
`<form action={entraSignInAction}>`. `EntraSubmit` in `login-form.tsx` verbindt die twee: hij
dient het formulier in met `requestSubmit()` en leest de bezig-stand uit `useFormStatus`.
Dat laatste werkt alleen voor een component *binnen* het formulier, vandaar dat het een
apart component is en geen stukje van `LoginForm`.

Dit kost wel wat: de knop werkte eerder ook zonder JavaScript, want hij was een gewone
submit-knop. Nu niet meer. Voor een interne app met een aanmeldscherm dat toch al op React
draait weegt dat niet op tegen een eigen namaakknop naast de beheerde versie.

## De uitnodigingsmail

Sinds 6 augustus 2026 wordt de enige mail die deze app verstuurt gebouwd met
`@col/email-shell`. Daarvoor was het een handgeschreven HTML-string met een groene knop en
zonder logo.

`buildEmail` neemt een lijst blokken en levert HTML én platte tekst uit dezelfde bron. Dat
lost twee dingen op die in de oude versie stuk waren: de naam van de ontvanger werd
ongefilterd in de HTML gezet, en tekst en HTML moesten bij elke wijziging apart bijgewerkt
worden. De blokken staan in `src/features/auth/emails/invitation.ts`, het merk in `brand.ts`
ernaast.

**Het item verstuurt niets.** `buildEmail` geeft een `Mail` terug; `src/lib/mail.ts` blijft
verantwoordelijk voor het transport. Die geeft `mail.attachments` door aan nodemailer —
zonder die regel toont de mail een gebroken afbeelding, ook al staat de CID-verwijzing keurig
in de HTML.

Het logo staat als base64-constante in `src/features/auth/emails/logo-base64.ts`, niet in
`public/`. Vercel serverless functions kunnen `public/` niet betrouwbaar van de schijf lezen:
`fs.readFileSync` op verzendmoment geeft op productie een mail zonder logo, en dat zie je
lokaal noch in de tests. Opnieuw genereren na een wijziging in de merkassets:

```bash
node scripts/pull-brand-assets.mjs
npm run email-logo
git diff src/features/auth/emails/logo-base64.ts
```

De knopkleur is `#006799` (COLORIGINZ brand-700 uit `@col/brand-tokens`) en niet brand-500:
wit op brand-500 haalt met 3,2:1 de 4,5:1 van WCAG AA niet. Het streepje bovenaan draagt geen
tekst en houdt wél brand-500 (`#0098da`).

Hoe de mail er echt uitziet, is niet uit de code af te leiden — de VML-knop bestaat juist
omdat Outlook zich anders gedraagt dan de rest:

```bash
npm run testmail    # schrijft tmp/uitnodiging.eml
```

Dubbelklikken opent hem in Outlook desktop of Apple Mail. Gmail importeert geen losse
`.eml`; die controle vraagt een echte verzending via `npm run invite`. Stand van zaken:
Outlook desktop is gecontroleerd (in het design system, 6 augustus 2026), Gmail en Apple Mail
in donkere modus nog niet.

## Wat het meebracht

De installatie voegde twee shadcn-primitives toe die we nog niet hadden: `badge` en
`dropdown-menu`. Die waren aanvankelijk alleen nodig voor de rol- en e-mailschakelaar, maar
worden nu ook echt gebruikt (zie hierboven).

De auth-componenten voegden `separator` toe, voor het streepje tussen de Microsoft-knop en
de wachtwoordvelden. `sso-button` hangt aan `button`, maar die had de shadcn CLI al als
identiek herkend en overgeslagen; `git diff src/components/ui/` was leeg na installatie.
Controleer dat na elke `add` opnieuw — het is de enige manier om te merken dat een beheerd
onderdeel je primitives heeft vervangen.

Zeven CSS-tokens (`--demo-*`) zijn in `src/app/globals.css` gezet, met een variant voor
licht en donker.

## Als je hier iets aan verbetert

Verbeter je de balk of een ander gedeeld onderdeel, breng het dan terug naar het design
system in plaats van het hier te laten. Anders is het geen design system meer maar een
tweede plek waar dezelfde code staat. De procedure staat in de README van die repo,
onder "Een bestaand component uit een app hierheen halen".

Werk in dat geval ook de tabel **Gebruikt door** bij in
`docs/items/demo-mode.md` van het design system. Dat is het enige dat vertelt wie je
stukmaakt bij een volgende wijziging.

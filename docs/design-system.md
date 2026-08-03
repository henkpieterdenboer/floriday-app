# Design system

Bijgewerkt: 3 augustus 2026.

Deze app haalt gedeelde onderdelen uit het Coloriginz design system, een shadcn custom
registry. Onderdelen komen als **broncode** binnen: er is geen npm-pakket en geen
runtime-koppeling. Deze app bezit haar eigen kopie en mag afwijken.

Registry: `https://design-system.apps.coloriginz.com/r/{name}.json`, gekoppeld in
`components.json`. Bron: `C:\HPProjects\col-design-system`.

## Wat we gebruiken

| Item | Versie | Waarvoor |
|---|---|---|
| `@col/demo-mode` | 1.0.1 | De testbalk boven aan elke pagina |

Installeren of bijwerken:

```bash
npx shadcn add @col/demo-mode --overwrite
git diff
```

Dat raakt alleen de beheerde bestanden in `src/components/demo/`. Onze eigen code blijft
ongemoeid — daarom staat die ook niet in die map.

Welke versie hier draait:

```bash
grep -rn DEMO_MODE_VERSION src/
```

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

Beide routes - en de balk zelf - draaien alleen wanneer `isDemoModeAllowed` (in
`environment-banner.ts`) dat toestaat: dezelfde `VERCEL_ENV !== "production"`-regel als de
balk, bewust geen `NEXT_PUBLIC_DEMO_MODE` (die reist mee naar de browser en zou een viewer
zichzelf tot beheerder kunnen laten maken). Uitgeschakeld geven beide routes 404, niet 403.

## Wat het meebracht

De installatie voegde twee shadcn-primitives toe die we nog niet hadden: `badge` en
`dropdown-menu`. Die waren aanvankelijk alleen nodig voor de rol- en e-mailschakelaar, maar
worden nu ook echt gebruikt (zie hierboven).

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

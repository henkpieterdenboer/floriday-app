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

## Let op bij de andere twee componenten

`DemoRoleSwitcher` en `DemoEmailSwitcher` zijn meegeïnstalleerd maar worden **nergens
gerenderd**. Wie ze wil gaan gebruiken, moet eerst dit weten:

**Het design system is op Radix gebouwd; deze app draait op base-ui.** Onze
`src/components/ui/dropdown-menu.tsx` importeert `@base-ui/react/menu`, terwijl
`demo-role-switcher.tsx` op Radix-gedrag leunt:

```tsx
onSelect={(e) => e.preventDefault()}   // moet het menu openhouden bij meerdere rollen
```

De typecheck klaagt niet, want die prop bestaat. Of `preventDefault()` daar hetzelfde
effect heeft, blijkt alleen uit een browser. **Test dat dus echt** voordat je de
rolwisselaar in gebruik neemt, in plaats van op een groene build te vertrouwen.

Datzelfde geldt voor de e-mailschakelaar, die een `/api/email-provider`-endpoint verwacht
dat wij niet hebben.

## Wat het meebracht

De installatie voegde twee shadcn-primitives toe die we nog niet hadden: `badge` en
`dropdown-menu`. Die zijn alleen nodig voor de twee ongebruikte componenten, maar ze staan
er nu en kosten niets zolang ze niet geïmporteerd worden.

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

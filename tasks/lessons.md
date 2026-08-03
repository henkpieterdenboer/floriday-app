# Lessen

Patronen uit correcties, zodat dezelfde fout niet twee keer gemaakt wordt.

## Een design system heeft previews, niet alleen documentatie

**3 augustus 2026.** Bij het overnemen van `@col/auth-shell`, `@col/brand-logo` en
`@col/sso-button` heb ik alleen `docs/items/*.md` gelezen: de proptabellen, de bewuste
keuzes, de bekende beperkingen. Daaruit volgde correct *welke* props er zijn, maar niet
*welke waarden* het ontwerp bedoelt. Die heb ik zelf ingeschat - `size="h-9"` waar het
ontwerp `h-12` gebruikt, `gap-3` waar het `space-y-4` is, een default `CardTitle` waar het
`text-2xl font-bold` hoort te zijn.

Het resultaat werkte en zag er niet slecht uit, maar week zichtbaar af. De gebruiker zag
het meteen: "het logo is iets groter en er zit meer spacing tussen."

**Waarom het misging:** ik behandelde de markdown als de volledige bron. De repo heeft
naast `docs/items/` ook een preview-route per item onder `app/<item>/page.tsx`, en op
`/auth-pages-starter` staat letterlijk: *"Het uiterlijk is de standaard, de code is een
startpunt. Past de code niet bij jouw stack, bouw ze dan na op basis van de previews
hieronder; daarvoor staan ze er."* Precies de instructie die ik nodig had, op de plek waar
ik niet keek.

**Wat voortaan:** bij elk design-system-item eerst de preview draaien
(`npx next dev --port 3100` in `col-design-system`, dan `/<item>`) en de compositie
overnemen - maten, gewichten, spacing, volgorde. De markdown zegt wat de API is; de preview
zegt hoe het eruit hoort te zien. Beide lezen, niet één.

**Bijvangst die alleen uit de preview bleek:** het design system draait op de klassieke
shadcn-card (`gap-6`, `py-6`, `px-6`), wij op de base-nova-preset met
`--card-spacing: --spacing(4)`. Dezelfde JSX levert daar dus 24px waar hij bij ons 16px
levert. Zulke verschillen staan in geen enkele proptabel; die zie je alleen naast elkaar.

# Zoekscherm — implementatieplan (fase 2 van deelproject B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eén scherm waarin je het gearchiveerde klokvoorverkoop-aanbod doorzoekt, met
datumpresets, filters, en een schakelaar tussen losse regels en een samenvatting.

**Architecture:** De database filtert, sorteert en pagineert; het scherm toont een venster
van vijftig. Presets en filtervertaling zijn pure functies. De filterstand staat in de URL.

**Tech Stack:** TanStack Table · shadcn/ui · Tailwind · Prisma 6 · Zod · Vitest

**Spec:** `docs/superpowers/specs/2026-08-01-toegang-en-zoekinterface-design.md`

**Fase 1** (toegang) is opgeleverd: inloggen werkt, `/aanbod` bestaat als lege pagina achter
de middleware, en er is één beheerder.

---

## Wat er al is om tegenaan te bouwen

De database bevat **echte data**, geen testmateriaal:

| | |
|---|---|
| Aanbodregels | 525.458 |
| Artikelen | 79.004 |
| Organisaties | 67.342 |
| Kwekers in het aanbod | 2.410 |
| Veildagen | 761, van 21-05-2024 t/m 02-08-2027 |

Gemeten queryprestaties, warme database, beste van drie:

| Query | Tijd |
|---|---|
| Eerste vijftig regels van een veildag | 37 ms |
| Vijftig regels op offset 5000 | 61 ms |
| Aantal regels over een heel jaar | 65 ms |
| Samenvatting per week over een heel jaar | 296 ms |
| Samenvatting per artikel over een heel jaar | 862 ms |

Koud kost datzelfde 638 ms tot 3.864 ms, want Neon schakelt uit na vijf minuten stilte.

## Waarschuwing vooraf

In de vorige fasen bevatte de meerderheid van mijn plantaken een fout. Recent: een
onmogelijke schrijfvolgorde door een foreign key, een lus die vijftien uur zou duren, een
retry die netwerkfouten niet ving, integratietests die echte data wisten, en een
Entra-claim die niet bestaat. Behandel elk codeblok hieronder als voorstel.

**En specifiek voor dit plan:** integratietests mogen **niets** in `SupplyLine`,
`SupplyLineVersion`, `TradeItem` of `Organization` schrijven of verwijderen. Ze lezen
alleen. De data die er staat is het product van het hele project. Er is een bewaker
(`tests/integration/no-real-data-touched.test.ts`) die dat controleert.

---

## Bestandsstructuur

```
src/features/supply-search/
  date-presets.ts          preset naar datumbereik — puur
  filters.ts               URL-parameters naar een gevalideerd filterobject — puur
  sort.ts                  toegestane sorteerkolommen — puur
  queries.ts               de twee databasequery's
  summary.ts               de vier samenvattingsassen

src/app/(protected)/aanbod/
  page.tsx                 server component, leest de URL, haalt data
  filter-bar.tsx           presets, zoekvelden, locatiekeuze
  supply-table.tsx         TanStack Table met de regels
  summary-table.tsx        de samenvatting
  freshness.tsx            wanneer de laatste synchronisatie was
```

---

## Taak 1: Datumpresets

**Files:** create `src/features/supply-search/date-presets.ts`, test `tests/unit/supply-search/date-presets.test.ts`

- [ ] **Stap 1: Schrijf de falende test**

```typescript
import { describe, expect, it } from "vitest";
import { PRESETS, resolvePreset, type PresetId } from "@/features/supply-search/date-presets";

/** Een woensdag, zodat weekgrenzen zichtbaar worden. */
const woensdag = new Date("2026-08-05T14:30:00.000Z");

const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("resolvePreset", () => {
  it("komende drie dagen begint vandaag", () => {
    const range = resolvePreset("komende-3-dagen", woensdag);
    expect(iso(range.from)).toBe("2026-08-05");
    expect(iso(range.to)).toBe("2026-08-07");
  });

  it("deze week loopt van maandag tot en met zondag", () => {
    const range = resolvePreset("deze-week", woensdag);
    expect(iso(range.from)).toBe("2026-08-03");
    expect(iso(range.to)).toBe("2026-08-09");
  });

  it("vorige week is de week ervoor", () => {
    const range = resolvePreset("vorige-week", woensdag);
    expect(iso(range.from)).toBe("2026-07-27");
    expect(iso(range.to)).toBe("2026-08-02");
  });

  it("deze maand loopt van de eerste tot en met de laatste dag", () => {
    const range = resolvePreset("deze-maand", woensdag);
    expect(iso(range.from)).toBe("2026-08-01");
    expect(iso(range.to)).toBe("2026-08-31");
  });

  it("dit jaar loopt van 1 januari tot en met vandaag", () => {
    const range = resolvePreset("dit-jaar", woensdag);
    expect(iso(range.from)).toBe("2026-01-01");
    expect(iso(range.to)).toBe("2026-08-05");
  });

  it("vorig jaar is het hele voorgaande jaar", () => {
    const range = resolvePreset("vorig-jaar", woensdag);
    expect(iso(range.from)).toBe("2025-01-01");
    expect(iso(range.to)).toBe("2025-12-31");
  });

  it("werkt op een maandag zonder naar de week ervoor te springen", () => {
    const maandag = new Date("2026-08-03T09:00:00.000Z");
    expect(iso(resolvePreset("deze-week", maandag).from)).toBe("2026-08-03");
  });

  it("werkt op een zondag zonder naar de week erna te springen", () => {
    const zondag = new Date("2026-08-09T23:00:00.000Z");
    const range = resolvePreset("deze-week", zondag);
    expect(iso(range.from)).toBe("2026-08-03");
    expect(iso(range.to)).toBe("2026-08-09");
  });

  it("rekent over een maandgrens heen", () => {
    const range = resolvePreset("komende-3-dagen", new Date("2026-08-30T12:00:00.000Z"));
    expect(iso(range.to)).toBe("2026-09-01");
  });

  it("rekent over een jaargrens heen", () => {
    const range = resolvePreset("komende-3-dagen", new Date("2026-12-31T12:00:00.000Z"));
    expect(iso(range.to)).toBe("2027-01-02");
  });

  it("geeft februari in een schrikkeljaar de juiste laatste dag", () => {
    const range = resolvePreset("deze-maand", new Date("2028-02-10T12:00:00.000Z"));
    expect(iso(range.to)).toBe("2028-02-29");
  });

  it("heeft voor elke preset een label", () => {
    for (const preset of PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it("kan elke preset uit de lijst oplossen", () => {
    for (const preset of PRESETS) {
      const range = resolvePreset(preset.id as PresetId, woensdag);
      expect(range.from.getTime()).toBeLessThanOrEqual(range.to.getTime());
    }
  });
});
```

- [ ] **Stap 2: Draai de test om te zien dat hij faalt**

Run: `npm run test:unit -- tests/unit/supply-search/date-presets.test.ts`

- [ ] **Stap 3: Schrijf de implementatie**

Belangrijk: reken volledig in UTC. `auctionDate` is in de database een `date` zonder
tijdzone, en de server kan in een andere zone draaien dan de gebruiker. Wie hier lokale
tijd gebruikt, krijgt bij zomertijd een dag verschuiving die niemand terugvindt.

```typescript
export type PresetId =
  | "komende-3-dagen"
  | "deze-week"
  | "vorige-week"
  | "deze-maand"
  | "dit-jaar"
  | "vorig-jaar";

export interface DateRange {
  from: Date;
  to: Date;
}

export const PRESETS: readonly { id: PresetId; label: string }[] = [
  { id: "komende-3-dagen", label: "Komende 3 dagen" },
  { id: "deze-week", label: "Deze week" },
  { id: "vorige-week", label: "Vorige week" },
  { id: "deze-maand", label: "Deze maand" },
  { id: "dit-jaar", label: "Dit jaar" },
  { id: "vorig-jaar", label: "Vorig jaar" },
];

/** Middernacht UTC van dezelfde kalenderdag. */
function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const result = startOfDay(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Maandag als eerste dag van de week; getUTCDay geeft zondag als 0. */
function startOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
}

export function resolvePreset(preset: PresetId, now: Date): DateRange {
  const today = startOfDay(now);

  switch (preset) {
    case "komende-3-dagen":
      return { from: today, to: addDays(today, 2) };
    case "deze-week": {
      const from = startOfWeek(today);
      return { from, to: addDays(from, 6) };
    }
    case "vorige-week": {
      const from = addDays(startOfWeek(today), -7);
      return { from, to: addDays(from, 6) };
    }
    case "deze-maand": {
      const year = today.getUTCFullYear();
      const month = today.getUTCMonth();
      return {
        from: new Date(Date.UTC(year, month, 1)),
        // Dag 0 van de volgende maand is de laatste dag van deze - werkt ook in februari
        // van een schrikkeljaar, zonder de lengte van elke maand te hoeven kennen.
        to: new Date(Date.UTC(year, month + 1, 0)),
      };
    }
    case "dit-jaar":
      return { from: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)), to: today };
    case "vorig-jaar": {
      const year = today.getUTCFullYear() - 1;
      return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year, 11, 31)) };
    }
  }
}

/** "5 t/m 7 augustus" — hoort altijd bij een preset te staan, anders raadt de lezer. */
export function formatRange(range: DateRange): string {
  const dag = new Intl.DateTimeFormat("nl-NL", { day: "numeric", timeZone: "UTC" });
  const dagMaand = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", timeZone: "UTC" });
  const volledig = new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "UTC" });

  if (range.from.getTime() === range.to.getTime()) return volledig.format(range.from);
  if (range.from.getUTCFullYear() !== range.to.getUTCFullYear()) {
    return `${volledig.format(range.from)} t/m ${volledig.format(range.to)}`;
  }
  if (range.from.getUTCMonth() !== range.to.getUTCMonth()) {
    return `${dagMaand.format(range.from)} t/m ${dagMaand.format(range.to)}`;
  }
  return `${dag.format(range.from)} t/m ${dagMaand.format(range.to)}`;
}
```

- [ ] **Stap 4: Draai de test opnieuw en voeg tests toe voor `formatRange`**

Verwacht: 13 tests plus die je zelf toevoegt voor de opmaak.

- [ ] **Stap 5: Commit** — `feat: resolve date presets to concrete ranges`

---

## Taak 2: Filters en sortering

**Files:** create `src/features/supply-search/filters.ts`, `src/features/supply-search/sort.ts`, tests in `tests/unit/supply-search/`

- [ ] **Stap 1: Schrijf de tests**

Dek in elk geval af:

- Een lege URL levert de standaardfilter op: preset `komende-3-dagen`, geen locaties, geen zoekterm.
- Een eigen datumbereik wordt overgenomen; een ongeldige datum valt terug op de standaard in plaats van te crashen.
- Meerdere locaties komen als lijst binnen en onbekende waarden worden weggefilterd. Dit is
  een direct beveiligingspunt: die waarden gaan een enum-vergelijking in.
- Een sorteerkolom buiten de toegestane lijst valt terug op de standaard. Test expliciet met
  een SQL-achtige invoer als `auctionDate; drop table`.
- Paginanummers onder 1 of niet-numeriek vallen terug op 1.
- De heenweg en terugweg zijn elkaars spiegel: filters naar URL-parameters en weer terug
  levert hetzelfde object op.

- [ ] **Stap 2: Schrijf de implementatie**

`sort.ts` houdt een vaste lijst toegestane kolommen bij met hun databaseveld. Nooit een
waarde uit de URL rechtstreeks in een query. `filters.ts` gebruikt Zod om
`URLSearchParams` om te zetten naar een gevalideerd object, met een veilige standaard voor
elk veld.

- [ ] **Stap 3: Commit** — `feat: parse and validate search filters from the url`

---

## Taak 3: De regelquery

**Files:** create `src/features/supply-search/queries.ts`, test `tests/integration/supply-search/queries.test.ts`

- [ ] **Stap 1: Schrijf de test**

**Alleen lezen.** Geen enkele schrijfactie op de archieftabellen.

Dek af:

- Een bekende veildag levert het aantal regels dat een directe telling ook geeft.
- Filteren op locatie vermindert het aantal, en elke teruggegeven regel heeft die locatie.
- Zoeken op een deel van een artikelnaam levert alleen regels waarvan de naam dat bevat.
- Pagineren levert geen overlap: pagina 1 en pagina 2 delen geen enkel `supplyLineId`.
- Het totaal is onafhankelijk van de pagina.
- Sorteren op prijs oplopend levert een niet-dalende reeks.
- Een selectie zonder resultaten levert een lege lijst en totaal nul, geen fout.
- **Meet en rapporteer** hoe lang de zwaarste query duurt.

- [ ] **Stap 2: Schrijf de implementatie**

Twee functies: één die een pagina regels teruggeeft met het totaal, en één die alleen telt.
Gebruik Prisma's querybuilder waar het kan; alleen rauwe SQL als het echt moet, en dan met
parameters, nooit met samengestelde strings.

De regels hebben de artikelnaam en de kwekernaam nodig. Dat is een join met `TradeItem` en
`Organization`. Beide kunnen ontbreken (709 regels hebben geen artikel), dus het moet een
left join zijn en het scherm moet met een ontbrekende naam om kunnen gaan.

- [ ] **Stap 3: Commit** — `feat: query supply lines with filters and paging`

---

## Taak 4: De samenvatting

**Files:** create `src/features/supply-search/summary.ts`, test `tests/integration/supply-search/summary.test.ts`

- [ ] **Stap 1: Schrijf de test**

Vier assen: tijdvak (dag, week, maand), kweker, artikel, locatie.

De belangrijkste test: **de som van de groepen is gelijk aan het totaal van de regels bij
dezelfde filters.** Klopt dat niet, dan liegt de samenvatting, en dat is erger dan geen
samenvatting hebben.

Verder: elke as levert groepen met aantal regels, totaal stuks, gemiddelde prijs en aantal
kwekers; een lege selectie levert een lege lijst; en meet hoe lang de zwaarste as duurt
(artikel over een heel jaar kostte eerder 862 ms).

- [ ] **Stap 2: Schrijf de implementatie**

Voor tijdvakken is `date_trunc` nodig, wat Prisma's querybuilder niet aankan — dat wordt
rauwe SQL met parameters. Voor de andere assen kan `groupBy`.

- [ ] **Stap 3: Commit** — `feat: summarise supply along four axes`

---

## Taak 5: Het scherm

**Files:** `src/app/(protected)/aanbod/page.tsx` en de componenten ernaast

- [ ] **Stap 1: Bouw de filterbalk**

De presets als knoppenrij, elk **met de concrete datums eronder** — een preset die alleen
"Komende 3 dagen" zegt laat de lezer raden wat hij ziet. Daarnaast een zoekveld en een
locatiekeuze.

Elke wijziging past de URL aan. Daarmee is een selectie deelbaar en werkt de terugknop.

- [ ] **Stap 2: Bouw de tabel**

TanStack Table, headless, met eigen opmaak. Kolommen: artikel, kweker, stuks, prijs per
stuk, veildatum, locatie, partijbrief. Sorteren gaat via de URL naar de database, niet in
het geheugen — het grid toont maar vijftig van de duizenden regels.

Ontbrekende artikelnaam toont het artikel-ID in gedempte opmaak, niet een lege cel. Anders
lijkt het alsof er data mist terwijl de regel gewoon klopt.

- [ ] **Stap 3: Bouw de samenvatting en het doorklikken**

De schakelaar tussen regels en samenvatting. Klikken op een samenvattingsregel zet die
groep als extra filter en gaat terug naar de regels.

- [ ] **Stap 4: Toon de actualiteit**

Boven de tabel: wanneer de laatste geslaagde synchronisatie was, uit `SyncRun`. Ouder dan
drie uur wordt het nadrukkelijk in plaats van terloops.

- [ ] **Stap 5: Laadtoestanden**

Een skeleton in plaats van een leeg vlak. Duurt het langer dan drie seconden, dan een regel
erbij dat de database wakker wordt — dat gebeurt echt, want Neon schakelt uit na vijf
minuten en de eerste query kost dan seconden.

Een lege selectie zegt wat er is uitgefilterd en biedt aan het te verruimen.

- [ ] **Stap 6: Controleer met de hand**

Start de app in de achtergrond en controleer:

- De presets tonen de juiste datums en filteren echt.
- Zoeken op een artikelnaam levert plausibele resultaten.
- Pagineren werkt en de URL verandert mee.
- De samenvatting per week telt op tot hetzelfde als het regeltotaal.
- Doorklikken vanuit de samenvatting behoudt de filters.
- Een selectie zonder resultaten toont de lege staat.
- De pagina delen via de URL geeft dezelfde selectie.

- [ ] **Stap 7: Commit** — `feat: add the supply search screen`

---

## Taak 6: Afronden

- [ ] Draai `npm test`, `npx tsc --noEmit` en `npm run build`.
- [ ] Werk `README.md` bij met een paragraaf over het zoekscherm.
- [ ] Werk `docs/voortgang.md` bij: wat er af is, wat er anders liep, wat er nog openstaat.
- [ ] Commit.

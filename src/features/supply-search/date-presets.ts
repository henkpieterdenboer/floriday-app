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

/**
 * "5 augustus 2026" of "3 t/m 9 augustus 2026" - hoort altijd bij een preset te staan,
 * anders raadt de lezer.
 *
 * Afwijking van het oorspronkelijke plan: dat liet het jaartal weg zodra from en to in
 * hetzelfde jaar vallen. Dat is ambigu voor "vorig jaar" (bijvoorbeeld 1 januari t/m 31
 * december 2025) - zonder jaartal ziet dat eruit als het lopende jaar. Hier staat het
 * jaartal daarom altijd, behalve wanneer het al twee keer voorkomt (het jaargrens-geval
 * hieronder, waar beide volledige datums al een jaartal dragen).
 */
export function formatRange(range: DateRange): string {
  const dag = new Intl.DateTimeFormat("nl-NL", { day: "numeric", timeZone: "UTC" });
  const dagMaand = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", timeZone: "UTC" });
  const volledig = new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "UTC" });

  if (range.from.getTime() === range.to.getTime()) return volledig.format(range.from);

  if (range.from.getUTCFullYear() !== range.to.getUTCFullYear()) {
    return `${volledig.format(range.from)} t/m ${volledig.format(range.to)}`;
  }

  const year = range.from.getUTCFullYear();
  if (range.from.getUTCMonth() !== range.to.getUTCMonth()) {
    return `${dagMaand.format(range.from)} t/m ${dagMaand.format(range.to)} ${year}`;
  }
  return `${dag.format(range.from)} t/m ${dagMaand.format(range.to)} ${year}`;
}

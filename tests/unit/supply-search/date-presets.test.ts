import { describe, expect, it } from "vitest";
import {
  formatRange,
  PRESETS,
  resolvePreset,
  type PresetId,
} from "@/features/supply-search/date-presets";

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

describe("formatRange", () => {
  it("toont één datum voluit als het bereik één dag is", () => {
    const day = resolvePreset("komende-3-dagen", woensdag).from;
    expect(formatRange({ from: day, to: day })).toBe("5 augustus 2026");
  });

  it("toont dag en dag-maand binnen dezelfde maand", () => {
    const range = resolvePreset("deze-week", woensdag);
    expect(formatRange(range)).toBe("3 t/m 9 augustus 2026");
  });

  it("toont dag-maand tot dag-maand over een maandgrens heen, binnen hetzelfde jaar", () => {
    const range = resolvePreset("komende-3-dagen", new Date("2026-08-30T12:00:00.000Z"));
    expect(formatRange(range)).toBe("30 augustus t/m 1 september 2026");
  });

  it("toont de volledige datum aan beide kanten over een jaargrens heen", () => {
    const range = resolvePreset("komende-3-dagen", new Date("2026-12-31T12:00:00.000Z"));
    expect(formatRange(range)).toBe("31 december 2026 t/m 2 januari 2027");
  });

  it("gebruikt UTC, niet de lokale tijdzone van de server", () => {
    // Een datum vlak na middernacht UTC mag niet naar de vorige dag verschuiven,
    // ook niet als process.env.TZ toevallig ten westen van UTC staat.
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 0, 1));
    expect(formatRange({ from, to })).toBe("1 januari 2026");
  });
});

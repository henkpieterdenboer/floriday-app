import { describe, expect, it } from "vitest";
import {
  beschrijfInterval,
  isGeldigInterval,
  magNuSynchroniseren,
  MARGE_SECONDEN,
} from "@/features/sync-status/interval";

const nu = new Date("2026-08-05T12:00:00Z");

describe("magNuSynchroniseren", () => {
  it("laat een eerste run altijd door", () => {
    expect(magNuSynchroniseren(null, 60, nu)).toBe(true);
  });

  it("slaat over wanneer de vorige run korter geleden is dan het interval", () => {
    expect(magNuSynchroniseren(new Date("2026-08-05T11:58:00Z"), 15, nu)).toBe(false);
  });

  it("laat door wanneer het interval verstreken is", () => {
    expect(magNuSynchroniseren(new Date("2026-08-05T11:40:00Z"), 15, nu)).toBe(true);
  });

  // Zonder speling wordt een interval van vijf minuten er stilzwijgend tien: een cron die
  // een paar seconden te vroeg afgaat slaat dan over en is pas een slag later aan de beurt.
  it("laat een run door die net iets te vroeg komt", () => {
    const netTeVroeg = new Date(nu.getTime() - (5 * 60 - MARGE_SECONDEN + 1) * 1000);
    expect(magNuSynchroniseren(netTeVroeg, 5, nu)).toBe(true);
  });

  it("slaat wel over wanneer het ruim binnen de marge valt", () => {
    const veelTeVroeg = new Date(nu.getTime() - 60 * 1000);
    expect(magNuSynchroniseren(veelTeVroeg, 5, nu)).toBe(false);
  });

  // Bij een ingestelde minuut mag de marge niet de helft van de wachttijd opeten: met een
  // vaste marge van dertig seconden zou hij al na dertig seconden mogen en betekent de
  // instelling niets meer.
  it("houdt de marge binnen de helft van het interval", () => {
    const naTwintigSeconden = new Date(nu.getTime() - 20 * 1000);
    expect(magNuSynchroniseren(naTwintigSeconden, 1, nu)).toBe(false);

    const naVeertigSeconden = new Date(nu.getTime() - 40 * 1000);
    expect(magNuSynchroniseren(naVeertigSeconden, 1, nu)).toBe(true);
  });
});

describe("isGeldigInterval", () => {
  it.each([1, 2, 5, 7, 60, 1440])("accepteert %s", (waarde) => {
    expect(isGeldigInterval(waarde)).toBe(true);
  });

  it.each([0, -5, 1441, 2.5, Number.NaN])("weigert %s", (waarde) => {
    expect(isGeldigInterval(waarde)).toBe(false);
  });
});

describe("beschrijfInterval", () => {
  it.each([
    [1, "elke minuut"],
    [5, "elke 5 minuten"],
    [60, "elk uur"],
    [120, "elke 2 uur"],
    [90, "elke 90 minuten"],
  ])("beschrijft %s als %s", (minuten, verwacht) => {
    expect(beschrijfInterval(minuten)).toBe(verwacht);
  });
});

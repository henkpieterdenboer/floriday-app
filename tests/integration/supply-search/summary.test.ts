import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { countSupplyLines } from "@/features/supply-search/queries";
import { summarize, type PeriodGranularity, type SummaryAxis } from "@/features/supply-search/summary";
import type { SearchFilters } from "@/features/supply-search/filters";
import { DEFAULT_SORT } from "@/features/supply-search/sort";

/**
 * READ ONLY, same guarantee as tests/integration/supply-search/queries.test.ts - nothing
 * here writes to the archive.
 */

const FULL_ARCHIVE_RANGE = {
  from: new Date(Date.UTC(2024, 0, 1)),
  to: new Date(Date.UTC(2027, 11, 31)),
};

const YEAR_2025 = { from: new Date(Date.UTC(2025, 0, 1)), to: new Date(Date.UTC(2025, 11, 31)) };

function baseFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    preset: "aangepast",
    range: FULL_ARCHIVE_RANGE,
    locations: [],
    search: "",
    availableOnly: false,
    sort: DEFAULT_SORT,
    page: 1,
    ...overrides,
  };
}

afterAll(async () => {
  await prisma.$disconnect();
});

const CASES: { label: string; axis: SummaryAxis; granularity?: PeriodGranularity }[] = [
  { label: "tijdvak-dag", axis: "period", granularity: "day" },
  { label: "tijdvak-week", axis: "period", granularity: "week" },
  { label: "tijdvak-maand", axis: "period", granularity: "month" },
  { label: "kweker", axis: "grower" },
  { label: "artikel", axis: "article" },
  { label: "locatie", axis: "location" },
];

describe.each(CASES)("summarize ($label)", ({ axis, granularity }) => {
  // Twee locaties in plaats van het hele archief: groot genoeg voor meerdere groepen op
  // elke as, klein genoeg om de test snel te houden.
  const filters = baseFilters({ locations: ["AALSMEER", "NAALDWIJK"] });

  it("de som van de groepen is gelijk aan het totaal van de regels bij dezelfde filters", async () => {
    const [result, total] = await Promise.all([
      summarize(filters, axis, granularity),
      countSupplyLines(filters),
    ]);

    const summedLineCount = result.groups.reduce((sum, group) => sum + group.lineCount, 0);
    expect(summedLineCount).toBe(total);
    expect(result.total.lineCount).toBe(total);
  }, 30_000);

  it("de som van de stuks per groep is gelijk aan de som van alle regels", async () => {
    const [result, directSum] = await Promise.all([
      summarize(filters, axis, granularity),
      prisma.supplyLine
        .aggregate({
          where: {
            auctionDate: { gte: filters.range.from, lte: filters.range.to },
            initialAuctionLocation: { in: filters.locations },
          },
          _sum: { numberOfPieces: true },
        })
        .then((r) => r._sum.numberOfPieces ?? 0),
    ]);

    const summedPieces = result.groups.reduce((sum, group) => sum + group.totalPieces, 0);
    expect(summedPieces).toBe(directSum);
    expect(result.total.totalPieces).toBe(directSum);
  }, 30_000);

  it("elke groep heeft aantal regels, totaal stuks, gemiddelde prijs en aantal kwekers", async () => {
    const result = await summarize(filters, axis, granularity);
    expect(result.groups.length).toBeGreaterThan(0);

    for (const group of result.groups) {
      expect(group.lineCount).toBeGreaterThan(0);
      // Niet >= 0: het archief bevat 349 echte regels met een negatief aantal stuks (tot
      // -98.200), stuk voor stuk UNAVAILABLE. Vermoedelijk een correctie/terugtrekking in
      // de Floriday-feed. Geen databug - de samenvatting telt eerlijk op wat er staat.
      expect(typeof group.totalPieces).toBe("number");
      expect(group.averagePrice).toBeGreaterThanOrEqual(0);
      expect(group.growerCount).toBeGreaterThan(0);
      expect(typeof group.label).toBe("string");
      expect(group.label.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("een lege selectie levert een lege groepenlijst en een genulde totaalregel", async () => {
    const empty = { from: new Date(Date.UTC(2030, 0, 1)), to: new Date(Date.UTC(2030, 0, 2)) };
    const result = await summarize(baseFilters({ range: empty }), axis, granularity);

    expect(result.groups).toEqual([]);
    expect(result.total.lineCount).toBe(0);
    expect(result.total.totalPieces).toBe(0);
    expect(result.total.growerCount).toBe(0);
  });
});

describe("summarize (period, week)", () => {
  it("groepeert per iso-week, net als resolvePreset('deze-week') - maandag als eerste dag", async () => {
    const result = await summarize(baseFilters({ range: YEAR_2025 }), "period", "week");
    expect(result.groups.length).toBeGreaterThan(0);

    for (const group of result.groups) {
      const bucketStart = new Date(`${group.key}T00:00:00.000Z`);
      expect(bucketStart.getUTCDay()).toBe(1); // 1 = maandag
    }
  }, 15_000);
});

describe("summarize (artikel)", () => {
  it("groepeert regels zonder artikel onder één herkenbare groep in plaats van te crashen", async () => {
    // 709 regels missen een artikel (zie het plan) - over het hele archief zit daar
    // gegarandeerd een van bij, ongeacht welke dag dat precies is.
    const result = await summarize(baseFilters(), "article");
    const unknown = result.groups.find((group) => group.label === "(onbekend artikel)");
    expect(unknown).toBeDefined();
    expect(unknown?.lineCount).toBeGreaterThan(0);
  }, 30_000);
});

describe("prestaties", () => {
  it("meet de zwaarste as: per artikel over een heel jaar", async () => {
    const t0 = Date.now();
    const result = await summarize(baseFilters({ range: YEAR_2025 }), "article");
    const ms = Date.now() - t0;
    console.log(`samenvatting per artikel over 2025 (${result.groups.length} groepen): ${ms} ms`);
    expect(ms).toBeLessThan(10_000);
  }, 15_000);

  it("meet de samenvatting per week over een heel jaar", async () => {
    const t0 = Date.now();
    const result = await summarize(baseFilters({ range: YEAR_2025 }), "period", "week");
    const ms = Date.now() - t0;
    console.log(`samenvatting per week over 2025 (${result.groups.length} groepen): ${ms} ms`);
  }, 15_000);

  it("meet de samenvatting per kweker over een heel jaar", async () => {
    const t0 = Date.now();
    const result = await summarize(baseFilters({ range: YEAR_2025 }), "grower");
    const ms = Date.now() - t0;
    console.log(`samenvatting per kweker over 2025 (${result.groups.length} groepen): ${ms} ms`);
  }, 15_000);
});

import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { countSupplyLines, fetchSupplyLines } from "@/features/supply-search/queries";
import type { SearchFilters } from "@/features/supply-search/filters";
import { DEFAULT_SORT } from "@/features/supply-search/sort";

/**
 * READ ONLY. This file must never insert, update or delete a row - see
 * tests/integration/no-real-data-touched.test.ts, which fails the whole suite if it does.
 * Every query below reads the real archive as it stands; nothing here is seeded or cleaned
 * up because nothing here is written.
 */

// Covers the full archive (761 auction days, 21-05-2024 t/m 02-08-2027, see plan) so a
// filter that also narrows by date does not accidentally start from an empty base set.
const FULL_ARCHIVE_RANGE = {
  from: new Date(Date.UTC(2024, 0, 1)),
  to: new Date(Date.UTC(2027, 11, 31)),
};

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

describe("countSupplyLines", () => {
  it("levert voor een bekende veildag hetzelfde aantal als een directe telling", async () => {
    const [busiest] = await prisma.supplyLine.groupBy({
      by: ["auctionDate"],
      _count: { _all: true },
      orderBy: { _count: { auctionDate: "desc" } },
      take: 1,
    });
    const day = busiest.auctionDate;

    const direct = await prisma.supplyLine.count({ where: { auctionDate: day } });
    const viaQuery = await countSupplyLines(baseFilters({ range: { from: day, to: day } }));

    expect(viaQuery).toBe(direct);
    expect(viaQuery).toBeGreaterThan(0);
  }, 20_000);

  it("een selectie zonder resultaten levert totaal nul, geen fout", async () => {
    const empty = { from: new Date(Date.UTC(2030, 0, 1)), to: new Date(Date.UTC(2030, 0, 2)) };
    await expect(countSupplyLines(baseFilters({ range: empty }))).resolves.toBe(0);
  });
});

describe("fetchSupplyLines", () => {
  it("filteren op locatie vermindert het aantal, en elke teruggegeven regel heeft die locatie", async () => {
    const withoutLocation = await countSupplyLines(baseFilters());
    const withLocation = await countSupplyLines(baseFilters({ locations: ["AALSMEER"] }));

    expect(withLocation).toBeGreaterThan(0);
    expect(withLocation).toBeLessThan(withoutLocation);

    const page = await fetchSupplyLines(baseFilters({ locations: ["AALSMEER"] }));
    expect(page.rows.length).toBeGreaterThan(0);
    for (const row of page.rows) {
      expect(row.initialAuctionLocation).toBe("AALSMEER");
    }
  }, 20_000);

  it("zoeken op een deel van een artikelnaam levert alleen regels waarvan de artikelnaam dat bevat", async () => {
    // Rechtstreeks uit een echte combinatie gehaald in plaats van los een artikel te
    // pakken: niet elk artikel heeft ook echt een aanbodregel binnen het gekozen bereik.
    const [candidate] = await prisma.$queryRaw<{ name: string }[]>`
      SELECT ti.name
      FROM "SupplyLine" sl
      JOIN "TradeItem" ti ON ti."tradeItemId" = sl."tradeItemId"
      WHERE length(ti.name) >= 8
      LIMIT 1
    `;
    expect(candidate).toBeDefined();
    const term = candidate.name.slice(0, 8);

    const page = await fetchSupplyLines(
      baseFilters({ search: term, sort: { column: "articleName", direction: "asc" } }),
    );

    expect(page.total).toBeGreaterThan(0);
    for (const row of page.rows) {
      expect(row.articleName?.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it("pagineert zonder overlap, en het totaal is onafhankelijk van de pagina", async () => {
    const page1 = await fetchSupplyLines(baseFilters({ page: 1 }));
    const page2 = await fetchSupplyLines(baseFilters({ page: 2 }));

    expect(page1.rows).toHaveLength(50);
    expect(page2.rows).toHaveLength(50);
    expect(page1.total).toBe(page2.total);
    expect(page1.total).toBeGreaterThan(100); // ruim boven twee pagina's, anders test niets

    const idsOnPage1 = new Set(page1.rows.map((row) => row.supplyLineId));
    const overlap = page2.rows.filter((row) => idsOnPage1.has(row.supplyLineId));
    expect(overlap).toHaveLength(0);
  });

  it("sorteren op prijs oplopend levert een niet-dalende reeks", async () => {
    const page = await fetchSupplyLines(
      baseFilters({ sort: { column: "pricePerPiece", direction: "asc" } }),
    );

    const prices = page.rows.map((row) => row.pricePerPiece);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("een selectie zonder resultaten levert een lege lijst en totaal nul, geen fout", async () => {
    const empty = { from: new Date(Date.UTC(2030, 0, 1)), to: new Date(Date.UTC(2030, 0, 2)) };
    const page = await fetchSupplyLines(baseFilters({ range: empty }));

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
  });

  it("ontbrekend artikel of ontbrekende kweker crasht de regel niet", async () => {
    // 709 regels missen een artikel (zie het plan); left joins moeten dat verdragen.
    const page = await fetchSupplyLines(baseFilters());
    for (const row of page.rows) {
      expect(typeof row.tradeItemId).toBe("string");
      expect(row.articleName === null || typeof row.articleName === "string").toBe(true);
      expect(row.growerName === null || typeof row.growerName === "string").toBe(true);
    }
  });
});

describe("prestaties", () => {
  it("meet de regelquery over het volledige archief, ongefilterd", async () => {
    const t0 = Date.now();
    await fetchSupplyLines(baseFilters());
    const ms = Date.now() - t0;
    console.log(`regelquery, geen filter, heel archief: ${ms} ms`);
    expect(ms).toBeLessThan(5000);
  });

  it("meet de zwaarste realistische regelquery: vrij zoeken over het volledige archief", async () => {
    const t0 = Date.now();
    const page = await fetchSupplyLines(
      baseFilters({ search: "a", sort: { column: "articleName", direction: "asc" } }),
    );
    const ms = Date.now() - t0;
    console.log(`regelquery, vrij zoeken op 'a' over heel archief (${page.total} treffers): ${ms} ms`);
    expect(ms).toBeLessThan(5000);
  });
});

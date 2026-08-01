import { describe, expect, it } from "vitest";
import { filtersToSearchParams, parseFilters } from "@/features/supply-search/filters";
import { resolvePreset } from "@/features/supply-search/date-presets";
import { DEFAULT_SORT } from "@/features/supply-search/sort";

const now = new Date("2026-08-05T14:30:00.000Z");

describe("parseFilters", () => {
  it("levert de standaardfilter op voor een lege URL", () => {
    const filters = parseFilters(new URLSearchParams(), now);

    expect(filters.preset).toBe("komende-3-dagen");
    expect(filters.range).toEqual(resolvePreset("komende-3-dagen", now));
    expect(filters.locations).toEqual([]);
    expect(filters.search).toBe("");
    expect(filters.availableOnly).toBe(false);
    expect(filters.sort).toEqual(DEFAULT_SORT);
    expect(filters.page).toBe(1);
  });

  it("neemt een eigen datumbereik over", () => {
    const params = new URLSearchParams({ preset: "aangepast", from: "2026-01-10", to: "2026-01-20" });
    const filters = parseFilters(params, now);

    expect(filters.preset).toBe("aangepast");
    expect(filters.range.from.toISOString().slice(0, 10)).toBe("2026-01-10");
    expect(filters.range.to.toISOString().slice(0, 10)).toBe("2026-01-20");
  });

  it("valt terug op de standaard bij een datum die niet is te parsen", () => {
    const params = new URLSearchParams({ preset: "aangepast", from: "geen-datum", to: "2026-01-20" });
    const filters = parseFilters(params, now);

    expect(filters.preset).toBe("komende-3-dagen");
    expect(filters.range).toEqual(resolvePreset("komende-3-dagen", now));
  });

  it("valt terug op de standaard bij een datum die kalendarisch niet bestaat", () => {
    const params = new URLSearchParams({ preset: "aangepast", from: "2026-02-30", to: "2026-03-01" });
    expect(parseFilters(params, now).preset).toBe("komende-3-dagen");
  });

  it("valt terug op de standaard als to voor from ligt", () => {
    const params = new URLSearchParams({ preset: "aangepast", from: "2026-01-20", to: "2026-01-10" });
    expect(parseFilters(params, now).preset).toBe("komende-3-dagen");
  });

  it("valt terug op de standaard als aangepast is gekozen zonder from/to", () => {
    const params = new URLSearchParams({ preset: "aangepast" });
    expect(parseFilters(params, now).preset).toBe("komende-3-dagen");
  });

  it("laat meerdere locaties toe en filtert onbekende waarden weg", () => {
    const params = new URLSearchParams();
    params.append("location", "AALSMEER");
    params.append("location", "NAALDWIJK");
    params.append("location", "MARS");
    params.append("location", 'DROP TABLE "SupplyLine"');

    const filters = parseFilters(params, now);
    expect([...filters.locations].sort()).toEqual(["AALSMEER", "NAALDWIJK"]);
  });

  it("dedupliceert locaties", () => {
    const params = new URLSearchParams();
    params.append("location", "AALSMEER");
    params.append("location", "AALSMEER");
    expect(parseFilters(params, now).locations).toEqual(["AALSMEER"]);
  });

  it("valt terug op de standaardkolom bij sql-achtige sorteerinvoer", () => {
    const params = new URLSearchParams({ sort: 'auctionDate; drop table "SupplyLine"' });
    expect(parseFilters(params, now).sort.column).toBe(DEFAULT_SORT.column);
  });

  it("laat paginanummers onder 1 of niet-numeriek terugvallen op 1", () => {
    expect(parseFilters(new URLSearchParams({ page: "0" }), now).page).toBe(1);
    expect(parseFilters(new URLSearchParams({ page: "-5" }), now).page).toBe(1);
    expect(parseFilters(new URLSearchParams({ page: "abc" }), now).page).toBe(1);
    expect(parseFilters(new URLSearchParams({ page: "1.5" }), now).page).toBe(1);
    expect(parseFilters(new URLSearchParams({ page: "3" }), now).page).toBe(3);
  });

  it("trimt de vrije zoekterm", () => {
    expect(parseFilters(new URLSearchParams({ q: "  roos  " }), now).search).toBe("roos");
  });

  it("leest availableOnly alleen als de letterlijke waarde true", () => {
    expect(parseFilters(new URLSearchParams({ availableOnly: "true" }), now).availableOnly).toBe(true);
    expect(parseFilters(new URLSearchParams({ availableOnly: "1" }), now).availableOnly).toBe(false);
    expect(parseFilters(new URLSearchParams({ availableOnly: "yes" }), now).availableOnly).toBe(false);
  });

  it("is elkaars spiegel: filters naar URL-parameters en terug levert hetzelfde object", () => {
    const params = new URLSearchParams({
      preset: "aangepast",
      from: "2026-02-01",
      to: "2026-02-15",
      q: "roos",
      availableOnly: "true",
      sort: "pricePerPiece",
      order: "asc",
      page: "4",
    });
    params.append("location", "EELDE");
    params.append("location", "AALSMEER");

    const original = parseFilters(params, now);
    const roundTripped = parseFilters(filtersToSearchParams(original), now);

    expect(roundTripped).toEqual(original);
  });

  it("is ook een spiegel voor de standaardfilter", () => {
    const original = parseFilters(new URLSearchParams(), now);
    const roundTripped = parseFilters(filtersToSearchParams(original), now);
    expect(roundTripped).toEqual(original);
  });
});

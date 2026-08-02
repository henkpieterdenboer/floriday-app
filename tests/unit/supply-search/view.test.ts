import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW,
  bucketToRange,
  buildHref,
  drillDownFilters,
  isDrillableGroup,
  parseView,
  viewToSearchParams,
} from "@/features/supply-search/view";
import { parseFilters } from "@/features/supply-search/filters";
import { DEFAULT_SORT } from "@/features/supply-search/sort";
import type { SearchFilters } from "@/features/supply-search/filters";

const now = new Date("2026-08-05T14:30:00.000Z");

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

describe("parseView", () => {
  it("levert de standaardstand op voor een lege URL", () => {
    expect(parseView(new URLSearchParams())).toEqual(DEFAULT_VIEW);
  });

  it("neemt een geldige view/axis/granularity over", () => {
    const params = new URLSearchParams({ view: "summary", axis: "grower", granularity: "week" });
    expect(parseView(params)).toEqual({ mode: "summary", axis: "grower", granularity: "week" });
  });

  it("valt terug op de standaard bij een onbekende waarde", () => {
    const params = new URLSearchParams({ view: "vernietig", axis: "hack", granularity: "eeuw" });
    expect(parseView(params)).toEqual(DEFAULT_VIEW);
  });

  it("is elkaars spiegel: view naar URL-parameters en terug levert hetzelfde object", () => {
    const view = { mode: "summary", axis: "article", granularity: "month" } as const;
    expect(parseView(viewToSearchParams(view))).toEqual(view);
  });
});

describe("bucketToRange", () => {
  it("dag: from en to zijn dezelfde dag", () => {
    const range = bucketToRange("2026-08-05", "day");
    expect(range.from.toISOString().slice(0, 10)).toBe("2026-08-05");
    expect(range.to.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("week: from t/m to beslaat zeven dagen vanaf de sleutel", () => {
    const range = bucketToRange("2026-08-03", "week"); // maandag
    expect(range.from.toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(range.to.toISOString().slice(0, 10)).toBe("2026-08-09");
  });

  it("maand: from is de eerste, to is de laatste dag van de maand", () => {
    const range = bucketToRange("2026-02-01", "month");
    expect(range.from.toISOString().slice(0, 10)).toBe("2026-02-01");
    expect(range.to.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("maand: houdt rekening met een schrikkeljaar", () => {
    const range = bucketToRange("2028-02-01", "month");
    expect(range.to.toISOString().slice(0, 10)).toBe("2028-02-29");
  });
});

describe("isDrillableGroup", () => {
  it("kweker: niet doorklikbaar als het label terugvalt op de id (key === label)", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(isDrillableGroup("grower", { key: id, label: id })).toBe(false);
  });

  it("kweker: wel doorklikbaar met een echte naam", () => {
    expect(isDrillableGroup("grower", { key: "abc-id", label: "Kwekerij De Bloem" })).toBe(true);
  });

  it("artikel: niet doorklikbaar voor de onbekend-groep", () => {
    expect(
      isDrillableGroup("article", { key: "(onbekend artikel)", label: "(onbekend artikel)" }),
    ).toBe(false);
  });

  it("artikel: wel doorklikbaar met een echte naam", () => {
    expect(isDrillableGroup("article", { key: "Rosa Red Naomi", label: "Rosa Red Naomi" })).toBe(
      true,
    );
  });

  it("locatie en tijdvak zijn altijd doorklikbaar", () => {
    expect(isDrillableGroup("location", { key: "AALSMEER", label: "AALSMEER" })).toBe(true);
    expect(isDrillableGroup("period", { key: "2026-08-05", label: "2026-08-05" })).toBe(true);
  });
});

describe("drillDownFilters", () => {
  const filters = baseFilters();

  it("tijdvak: zet het bereik op de bucket en de preset op aangepast", () => {
    const next = drillDownFilters(filters, "period", { key: "2026-08-03", label: "2026-08-03" }, "week");
    expect(next.preset).toBe("aangepast");
    expect(next.range.from.toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(next.range.to.toISOString().slice(0, 10)).toBe("2026-08-09");
    expect(next.page).toBe(1);
  });

  it("locatie: vervangt de locatiekeuze door precies die ene locatie", () => {
    const withOthers = baseFilters({ locations: ["EELDE", "RIJNSBURG"] });
    const next = drillDownFilters(withOthers, "location", { key: "AALSMEER", label: "AALSMEER" }, "day");
    expect(next.locations).toEqual(["AALSMEER"]);
  });

  it("kweker: zet de kwekernaam als vrije zoekterm, behoudt de rest", () => {
    const withLocation = baseFilters({ locations: ["AALSMEER"] });
    const next = drillDownFilters(
      withLocation,
      "grower",
      { key: "id-1", label: "Kwekerij De Bloem" },
      "day",
    );
    expect(next.search).toBe("Kwekerij De Bloem");
    expect(next.locations).toEqual(["AALSMEER"]);
  });

  it("artikel: zet de artikelnaam als vrije zoekterm", () => {
    const next = drillDownFilters(filters, "article", { key: "Rosa Red Naomi", label: "Rosa Red Naomi" }, "day");
    expect(next.search).toBe("Rosa Red Naomi");
  });

  it("reset altijd de pagina naar 1", () => {
    const onPage3 = baseFilters({ page: 3 });
    const next = drillDownFilters(onPage3, "location", { key: "EELDE", label: "EELDE" }, "day");
    expect(next.page).toBe(1);
  });
});

describe("buildHref", () => {
  it("bouwt een pad met filter- en viewparameters samen", () => {
    const href = buildHref(baseFilters({ search: "roos" }), {
      mode: "summary",
      axis: "grower",
      granularity: "day",
    });
    expect(href.startsWith("/aanbod?")).toBe(true);
    const params = new URL(href, "https://voorbeeld.test").searchParams;
    expect(params.get("q")).toBe("roos");
    expect(params.get("view")).toBe("summary");
    expect(params.get("axis")).toBe("grower");
  });

  it("is te herleiden: parseFilters + parseView op de href geven het origineel terug", () => {
    const filters = baseFilters({ search: "tulp", locations: ["AALSMEER"], page: 2 });
    const view = { mode: "summary", axis: "article", granularity: "week" } as const;
    const href = buildHref(filters, view);

    const params = new URL(href, "https://voorbeeld.test").searchParams;
    expect(parseFilters(params, now)).toEqual(filters);
    expect(parseView(params)).toEqual(view);
  });
});

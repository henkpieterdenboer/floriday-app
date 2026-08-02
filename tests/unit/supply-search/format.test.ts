import { describe, expect, it } from "vitest";
import { formatDate, formatInteger, formatPrice } from "@/features/supply-search/format";

describe("formatInteger", () => {
  it("gebruikt een duizendtalscheiding in nl-NL-notatie", () => {
    expect(formatInteger(1234567)).toBe("1.234.567");
  });

  it("laat een negatief aantal gewoon zien - het archief bevat echte negatieve aantallen", () => {
    expect(formatInteger(-98200)).toBe("-98.200");
  });

  it("werkt voor nul", () => {
    expect(formatInteger(0)).toBe("0");
  });
});

describe("formatPrice", () => {
  it("toont twee decimalen met een euroteken voor EUR", () => {
    const result = formatPrice(1.5, "EUR");
    expect(result).toContain("1,50");
    expect(result).toContain("€");
  });

  it("valt terug op een leesbare weergave bij een ongeldige valutacode in plaats van te crashen", () => {
    // Intl accepteert elke drieletterige code, geldig of niet (het valideert de vorm, niet
    // de ISO-lijst) - pas een echt misvormde code laat het stuklopen.
    expect(() => formatPrice(2.5, "EURO")).not.toThrow();
    expect(formatPrice(2.5, "EURO")).toContain("2.50");
  });
});

describe("formatDate", () => {
  it("formatteert in het Nederlands, gerekend in UTC", () => {
    const date = new Date(Date.UTC(2026, 7, 5));
    const result = formatDate(date);
    expect(result).toContain("2026");
    expect(result.toLowerCase()).toContain("aug");
  });
});

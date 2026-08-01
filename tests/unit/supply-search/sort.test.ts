import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, resolveSort, SORT_COLUMNS, sortColumnSql } from "@/features/supply-search/sort";

describe("resolveSort", () => {
  it("valt terug op de standaard als geen kolom of richting is opgegeven", () => {
    expect(resolveSort(undefined, undefined)).toEqual(DEFAULT_SORT);
  });

  it("accepteert een kolom uit de whitelist met een geldige richting", () => {
    expect(resolveSort("pricePerPiece", "asc")).toEqual({ column: "pricePerPiece", direction: "asc" });
    expect(resolveSort("pricePerPiece", "desc")).toEqual({ column: "pricePerPiece", direction: "desc" });
  });

  it("valt terug op de standaardkolom bij een kolom buiten de whitelist", () => {
    expect(resolveSort("nietBestaandeKolom", "asc").column).toBe(DEFAULT_SORT.column);
  });

  // Het directe beveiligingspunt: een URL-waarde mag nooit als kolomnaam in een query
  // terechtkomen. Dit moet net zo goed terugvallen als elke andere onbekende waarde.
  it("valt terug op de standaardkolom bij een sql-achtige invoer", () => {
    expect(resolveSort('auctionDate; drop table "SupplyLine"', "asc").column).toBe(DEFAULT_SORT.column);
    expect(resolveSort('"; DROP TABLE "SupplyLine"; --', "asc").column).toBe(DEFAULT_SORT.column);
  });

  it("valt terug op de standaardrichting bij een ongeldige richting", () => {
    expect(resolveSort("pricePerPiece", "sideways").direction).toBe(DEFAULT_SORT.direction);
    expect(resolveSort("pricePerPiece", "ASC").direction).toBe(DEFAULT_SORT.direction);
  });

  it("elke toegestane kolom wijst naar een niet-lege, vaste sql-uitdrukking", () => {
    for (const column of SORT_COLUMNS) {
      expect(sortColumnSql(column).length).toBeGreaterThan(0);
    }
  });

  it("dekt de kolommen die het scherm nodig heeft: artikel, kweker, stuks, prijs, datum, locatie, partijbrief", () => {
    expect([...SORT_COLUMNS].sort()).toEqual(
      [
        "articleName",
        "auctionDate",
        "deliveryNoteReference",
        "growerName",
        "location",
        "numberOfPieces",
        "pricePerPiece",
      ].sort(),
    );
  });
});

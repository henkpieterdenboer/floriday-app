import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { toSupplyLineRow } from "@/features/floriday/mappers/supply-line";

const page = supplyPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/supply-page.json", "utf8")),
);

describe("toSupplyLineRow", () => {
  it("flattens the nested price into value and currency", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(row.currency).toBe(page.results[0].pricePerPiece.currency);
    expect(row.pricePerPiece).toBe(page.results[0].pricePerPiece.value.toFixed(4));
  });

  it("flattens the packing configuration", () => {
    const source = page.results[0];
    const row = toSupplyLineRow(source);
    expect(row.piecesPerPackage).toBe(source.packingConfiguration.piecesPerPackage);
    expect(row.vbnPackageCode).toBe(source.packingConfiguration.package.vbnPackageCode);
    expect(row.loadCarrier).toBe(source.packingConfiguration.loadCarrier);
  });

  it("turns the auction date into a date at midnight utc", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(row.auctionDate.toISOString()).toBe(`${page.results[0].auctionDate}T00:00:00.000Z`);
  });

  it("keeps a null last modified date as null", () => {
    const row = toSupplyLineRow({ ...page.results[0], lastModifiedDateTime: null });
    expect(row.lastModifiedDateTime).toBeNull();
  });

  it("converts the sequence number to bigint", () => {
    const row = toSupplyLineRow(page.results[0]);
    expect(typeof row.sequenceNumber).toBe("bigint");
  });

  it("maps every line in a real page without throwing", () => {
    expect(() => page.results.map(toSupplyLineRow)).not.toThrow();
  });
});

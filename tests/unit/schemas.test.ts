import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supplyPageSchema } from "@/features/floriday/schemas/supply-line";
import { tradeItemSchema } from "@/features/floriday/schemas/trade-item";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";

const readFixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/${name}.json`, "utf8")) as unknown;

describe("floriday response schemas", () => {
  it("parses a real supply page", () => {
    const page = supplyPageSchema.parse(readFixture("supply-page"));
    expect(page.results.length).toBeGreaterThan(0);
    expect(page.maximumSequenceNumber).toBeGreaterThan(0);
  });

  it("parses real trade items", () => {
    const items = tradeItemSchema.array().parse(readFixture("trade-items"));
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toBeTypeOf("string");
  });

  it("parses a real organization page", () => {
    const page = organizationPageSchema.parse(readFixture("organizations"));
    expect(page.results.length).toBeGreaterThan(0);
  });

  it("rejects an unknown auction location", () => {
    const page = readFixture("supply-page") as { results: Record<string, unknown>[] };
    const broken = {
      ...page,
      results: [{ ...page.results[0], initialAuctionLocation: "MARS" }],
    };
    expect(() => supplyPageSchema.parse(broken)).toThrow();
  });
});

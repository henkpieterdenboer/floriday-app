import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { organizationPageSchema } from "@/features/floriday/schemas/organization";
import { toOrganizationRow } from "@/features/floriday/mappers/organization";

const page = organizationPageSchema.parse(
  JSON.parse(readFileSync("tests/fixtures/organizations.json", "utf8")),
);

describe("toOrganizationRow", () => {
  it("takes city and country from the physical address", () => {
    const source = page.results.find((o) => o.physicalAddress?.city) ?? page.results[0];
    const row = toOrganizationRow(source);
    expect(row.city).toBe(source.physicalAddress?.city ?? null);
    expect(row.countryCode).toBe(source.physicalAddress?.countryCode ?? null);
  });

  it("falls back to the mailing address when there is no physical address", () => {
    const source = { ...page.results[0], physicalAddress: null };
    const row = toOrganizationRow(source);
    expect(row.city).toBe(source.mailingAddress?.city ?? null);
  });

  it("converts the sequence number to bigint", () => {
    expect(typeof toOrganizationRow(page.results[0]).sequenceNumber).toBe("bigint");
  });

  it("maps every organization in a real page without throwing", () => {
    expect(() => page.results.map(toOrganizationRow)).not.toThrow();
  });
});

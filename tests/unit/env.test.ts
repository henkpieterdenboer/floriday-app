import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  DIRECT_URL: "postgresql://user:pass@host/db?sslmode=require",
  FLORIDAY_TOKEN_URL: "https://idm.staging.floriday.io/oauth2/x/v1/token",
  FLORIDAY_CUSTOMERS_API_BASE_URL: "https://api.staging.floriday.io/customers-api-2026v1",
  FLORIDAY_CUSTOMERS_CLIENT_ID: "abc",
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: "secret",
  FLORIDAY_CUSTOMERS_API_KEY: "key",
  CRON_SECRET: "cron",
};

describe("envSchema", () => {
  it("accepts a complete configuration", () => {
    const result = envSchema.parse(valid);
    expect(result.FLORIDAY_CUSTOMERS_API_KEY).toBe("key");
  });

  it("rejects a missing api key", () => {
    const { FLORIDAY_CUSTOMERS_API_KEY, ...incomplete } = valid;
    expect(() => envSchema.parse(incomplete)).toThrow();
  });

  it("rejects an api base url that is not a url", () => {
    expect(() => envSchema.parse({ ...valid, FLORIDAY_CUSTOMERS_API_BASE_URL: "nope" }))
      .toThrow();
  });
});

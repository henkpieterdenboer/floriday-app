import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { envSchema, getEnv, getFloridayEnv, resetEnvCache } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  DIRECT_URL: "postgresql://user:pass@host/db?sslmode=require",
  FLORIDAY_TOKEN_URL: "https://idm.staging.floriday.io/oauth2/x/v1/token",
  FLORIDAY_CUSTOMERS_API_BASE_URL: "https://api.staging.floriday.io/customers-api-2026v1",
  FLORIDAY_CUSTOMERS_CLIENT_ID: "abc",
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: "secret",
  FLORIDAY_CUSTOMERS_API_KEY: "key",
  CRON_SECRET: "cron",
  APP_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "secret",
};

describe("envSchema", () => {
  it("accepts a complete configuration", () => {
    const result = envSchema.parse(valid);
    expect(result.FLORIDAY_CUSTOMERS_API_KEY).toBe("key");
  });

  // De Floriday-gegevens zijn hier bewust optioneel: een omgeving zonder die sleutels moet
  // gewoon kunnen inloggen, gebruikers beheren en zoeken in wat er al opgehaald is. De
  // strenge controle staat in getFloridayEnv, vlak voor er een verzoek uitgaat - zie de
  // test daarvoor verderop.
  it("accepts a configuration without floriday credentials", () => {
    const { FLORIDAY_CUSTOMERS_API_KEY, ...zonderSleutel } = valid;
    expect(() => envSchema.parse(zonderSleutel)).not.toThrow();
  });

  it("rejects an api base url that is not a url", () => {
    expect(() => envSchema.parse({ ...valid, FLORIDAY_CUSTOMERS_API_BASE_URL: "nope" }))
      .toThrow();
  });

  it("treats a missing SMTP_PORT as unset", () => {
    const result = envSchema.parse(valid);
    expect(result.SMTP_PORT).toBeUndefined();
  });

  it("treats an empty SMTP_PORT as unset rather than coercing it to zero", () => {
    // z.coerce.number() reads "" as 0, which would silently produce a broken port instead
    // of the "not configured" state a blank .env value is meant to express.
    const result = envSchema.parse({ ...valid, SMTP_PORT: "" });
    expect(result.SMTP_PORT).toBeUndefined();
  });

  it("coerces a numeric SMTP_PORT string", () => {
    const result = envSchema.parse({ ...valid, SMTP_PORT: "587" });
    expect(result.SMTP_PORT).toBe(587);
  });
});

describe("getEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
    process.env = { ...process.env, ...valid };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns a parsed configuration when process.env is complete", () => {
    const result = getEnv();
    expect(result.FLORIDAY_CUSTOMERS_API_KEY).toBe("key");
  });

  it("throws naming the offending field when one is missing", () => {
    delete process.env.CRON_SECRET;
    expect(() => getEnv()).toThrow(/CRON_SECRET/);
  });

  it("throws naming the field and the reason when one is malformed", () => {
    process.env = { ...process.env, FLORIDAY_TOKEN_URL: "not-a-url" };
    expect(() => getEnv()).toThrow(/FLORIDAY_TOKEN_URL/);
    expect(() => getEnv()).toThrow(/url/i);
  });

  it("returns the same cached object on a second call", () => {
    const first = getEnv();
    const second = getEnv();
    expect(second).toBe(first);
  });

  it("picks up a changed environment after resetEnvCache", () => {
    const first = getEnv();
    expect(first.CRON_SECRET).toBe("cron");

    resetEnvCache();
    process.env = { ...process.env, CRON_SECRET: "changed" };
    const second = getEnv();
    expect(second.CRON_SECRET).toBe("changed");
  });
});

describe("getFloridayEnv", () => {
  const compleet = {
    FLORIDAY_TOKEN_URL: "https://idm.staging.floriday.io/oauth2/x/v1/token",
    FLORIDAY_CUSTOMERS_API_BASE_URL: "https://api.staging.floriday.io/customers-api-2026v1",
    FLORIDAY_CUSTOMERS_CLIENT_ID: "abc",
    FLORIDAY_CUSTOMERS_CLIENT_SECRET: "secret",
    FLORIDAY_CUSTOMERS_API_KEY: "key",
  };

  const origineel = process.env;
  afterEach(() => {
    process.env = origineel;
  });

  it("geeft de gegevens terug wanneer alles er staat", () => {
    process.env = { ...origineel, ...compleet };
    expect(getFloridayEnv().FLORIDAY_CUSTOMERS_API_KEY).toBe("key");
  });

  it("weigert een ontbrekende api key en noemt het veld", () => {
    process.env = { ...origineel, ...compleet };
    delete process.env.FLORIDAY_CUSTOMERS_API_KEY;
    expect(() => getFloridayEnv()).toThrow(/FLORIDAY_CUSTOMERS_API_KEY/);
  });

  // De melding moet duidelijk maken dat alleen de synchronisatie stilligt, niet de hele
  // applicatie - anders gaat iemand zoeken naar een storing die er niet is.
  it("zegt erbij dat de rest van de applicatie wel werkt", () => {
    process.env = { ...origineel, ...compleet };
    delete process.env.FLORIDAY_CUSTOMERS_CLIENT_ID;
    expect(() => getFloridayEnv()).toThrow(/rest van de applicatie werkt wel/);
  });
});

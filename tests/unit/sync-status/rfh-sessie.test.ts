import { describe, expect, it } from "vitest";
import { beoordeelSessie } from "@/features/sync-status/rfh-sessie";

describe("beoordeelSessie", () => {
  it("reports not coupled when there is no session", () => {
    expect(beoordeelSessie(null, new Date())).toEqual({
      toestand: "niet-gekoppeld",
      bericht: "RFH Pre-Auction is nog niet gekoppeld.",
    });
  });

  it("reports expired when the last attempt failed", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-01T10:00:00.000Z"),
      lastError: "RFH token request failed: invalid_grant - expired",
    };
    const uit = beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z"));
    expect(uit.toestand).toBe("verlopen");
    expect(uit.bericht).toMatch(/opnieuw koppelen/i);
  });

  it("reports healthy after a recent refresh", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-06T09:30:00.000Z"),
      lastError: null,
    };
    expect(beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z")).toestand).toBe("goed");
  });

  it("reports stale when nothing has refreshed for a day", () => {
    const sessie = {
      refreshToken: "x",
      lastRefreshedAt: new Date("2026-08-05T09:00:00.000Z"),
      lastError: null,
    };
    expect(beoordeelSessie(sessie, new Date("2026-08-06T10:00:00.000Z")).toestand).toBe("verouderd");
  });
});

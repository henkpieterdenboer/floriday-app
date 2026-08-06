import { describe, expect, it } from "vitest";
import {
  veildagSleutel,
  veildagenVoorRun,
  sleutelNaarDatum,
} from "@/features/rfh-preauction/sync/veildagen";

describe("veildagSleutel", () => {
  it("uses the Amsterdam date, not the UTC one", () => {
    // 22:30 UTC on 6 August is 00:30 on 7 August in Amsterdam (CEST, UTC+2).
    expect(veildagSleutel(new Date("2026-08-06T22:30:00.000Z"))).toBe("20260807");
  });

  it("still uses the Amsterdam date in winter", () => {
    // 23:30 UTC on 6 January is 00:30 on 7 January in Amsterdam (CET, UTC+1).
    expect(veildagSleutel(new Date("2026-01-06T23:30:00.000Z"))).toBe("20260107");
  });

  it("agrees with UTC in the middle of the day", () => {
    expect(veildagSleutel(new Date("2026-08-06T12:00:00.000Z"))).toBe("20260806");
  });
});

describe("veildagenVoorRun", () => {
  it("returns yesterday, today and the two days ahead", () => {
    expect(veildagenVoorRun(new Date("2026-08-06T12:00:00.000Z"))).toEqual([
      "20260805",
      "20260806",
      "20260807",
      "20260808",
    ]);
  });

  it("rolls over the month boundary", () => {
    expect(veildagenVoorRun(new Date("2026-07-31T12:00:00.000Z"))).toEqual([
      "20260730",
      "20260731",
      "20260801",
      "20260802",
    ]);
  });

  it("crosses the end of daylight saving without losing or repeating a day", () => {
    // Clocks go back on 25 October 2026.
    expect(veildagenVoorRun(new Date("2026-10-25T12:00:00.000Z"))).toEqual([
      "20261024",
      "20261025",
      "20261026",
      "20261027",
    ]);
  });
});

describe("sleutelNaarDatum", () => {
  it("maps a key to midnight UTC, matching how auctionDate is stored", () => {
    expect(sleutelNaarDatum("20260807").toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });
});

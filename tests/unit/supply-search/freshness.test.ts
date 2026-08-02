import { describe, expect, it } from "vitest";
import { STALE_THRESHOLD_HOURS, isStale } from "@/features/supply-search/freshness";

const now = new Date("2026-08-05T15:00:00.000Z");

describe("isStale", () => {
  it("is verouderd als er nog nooit een geslaagde synchronisatie was", () => {
    expect(isStale(null, now)).toBe(true);
  });

  it("is niet verouderd vlak na een geslaagde run", () => {
    expect(isStale(new Date("2026-08-05T14:59:00.000Z"), now)).toBe(false);
  });

  it(`is niet verouderd op precies ${STALE_THRESHOLD_HOURS} uur oud`, () => {
    const finishedAt = new Date(now.getTime() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);
    expect(isStale(finishedAt, now)).toBe(false);
  });

  it(`is wel verouderd bij ${STALE_THRESHOLD_HOURS} uur en 1 minuut oud`, () => {
    const finishedAt = new Date(now.getTime() - (STALE_THRESHOLD_HOURS * 60 + 1) * 60 * 1000);
    expect(isStale(finishedAt, now)).toBe(true);
  });
});

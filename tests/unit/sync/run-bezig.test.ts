import { describe, expect, it, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { syncRun: { findFirst } } }));

const { isErEenRunBezig, RUN_VASTGELOPEN_NA_MINUTEN } = await import(
  "@/features/floriday/sync/run-log"
);

const nu = new Date("2026-08-05T21:35:00Z");

describe("isErEenRunBezig", () => {
  beforeEach(() => findFirst.mockReset());

  it("meldt bezig wanneer er een lopende run is", async () => {
    findFirst.mockResolvedValue({ id: 1n });
    expect(await isErEenRunBezig("clock_presales_supply", nu)).toBe(true);
  });

  it("meldt niet-bezig wanneer er geen lopende run is", async () => {
    findFirst.mockResolvedValue(null);
    expect(await isErEenRunBezig("clock_presales_supply", nu)).toBe(false);
  });

  // Een functie die op zijn tijdslimiet wordt afgekapt komt nooit aan finishRun toe en blijft
  // op RUNNING staan. Zonder deze grens zou zo'n spookrun elke volgende synchronisatie
  // blokkeren - erger dan het opstapelen dat we ermee voorkomen.
  it("kijkt alleen naar runs die nog niet als vastgelopen gelden", async () => {
    findFirst.mockResolvedValue(null);
    await isErEenRunBezig("clock_presales_supply", nu);

    const waar = findFirst.mock.calls[0][0].where;
    expect(waar.status).toBe("RUNNING");
    expect(waar.startedAt.gte).toEqual(
      new Date(nu.getTime() - RUN_VASTGELOPEN_NA_MINUTEN * 60_000),
    );
  });
});

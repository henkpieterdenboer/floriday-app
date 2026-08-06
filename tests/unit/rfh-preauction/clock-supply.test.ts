import { describe, expect, it, vi } from "vitest";
import { syncSnede } from "@/features/rfh-preauction/sync/clock-supply";
import { clockSupplyLineSchema } from "@/features/rfh-preauction/schemas/clock-supply";
import type { ClockSupplyLinePayload } from "@/features/rfh-preauction/schemas/clock-supply";
import type { ClockSupplyLineRow } from "@/features/rfh-preauction/mappers/clock-supply";
import type { PreauctionClient, ZoekOpties } from "@/features/rfh-preauction/client";

/**
 * Minimal valid payload per clockSupplyLineSchema - the same bare-minimum shape as
 * "still produces every NOT NULL column from a bare-minimum payload" in
 * tests/unit/rfh-preauction/mappers/clock-supply.test.ts. Parsed through the real schema
 * rather than cast with `as never`, so a shape drift between the schema and this test fails
 * here instead of silently producing a payload the mapper was never meant to see.
 */
function payload(id: string): ClockSupplyLinePayload {
  return clockSupplyLineSchema.parse({
    id,
    reference: `ref-${id}`,
    organization: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    name: "MINIMAL",
    mainGroupCode: "1",
    currentNumberOfPieces: 10,
    auctionLocation: "Naaldwijk",
  });
}

function clientMet(paginas: { results: ClockSupplyLinePayload[]; totalDocuments: number }[]): {
  client: PreauctionClient;
  zoekKlokaanbod: ReturnType<typeof vi.fn>;
} {
  let n = 0;
  const zoekKlokaanbod = vi.fn(async (_opties: ZoekOpties) => paginas[n++]);
  return { client: { zoekKlokaanbod }, zoekKlokaanbod };
}

function writeResultaat(rowsProcessed: number, versionsAdded = 0) {
  return { rowsProcessed, versionsAdded, duplicatesCollapsed: 0 };
}

describe("syncSnede", () => {
  it("walks pages until totalDocuments is reached", async () => {
    const geschreven: ClockSupplyLineRow[][] = [];
    const { client, zoekKlokaanbod } = clientMet([
      { results: [payload("11111111-1111-4111-8111-111111111111")], totalDocuments: 2 },
      { results: [payload("22222222-2222-4222-8222-222222222222")], totalDocuments: 2 },
    ]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "NAALDWIJK" },
      pageSize: 1,
      writePage: async (rows, observedAt) => {
        geschreven.push([...rows]);
        // Same instant on every page: proves observedAt is taken once, not re-read per page.
        expect(observedAt).toEqual(new Date("2026-08-06T10:00:00.000Z"));
        return writeResultaat(rows.length, geschreven.length);
      },
      now: () => new Date("2026-08-06T10:00:00.000Z"),
    });

    expect(geschreven).toHaveLength(2);
    expect(uit.rowsProcessed).toBe(2);
    expect(uit.versionsAdded).toBe(3); // 1 (first page) + 2 (second page)
    expect(uit.totalDocuments).toBe(2);
    expect(uit.compleet).toBe(true);

    // skip advances by the page size on every call, and take stays fixed at pageSize.
    expect(zoekKlokaanbod).toHaveBeenCalledTimes(2);
    expect(zoekKlokaanbod.mock.calls[0][0]).toMatchObject({
      auctionDate: "20260807",
      auctionLocationKey: "NAALDWIJK",
      skip: 0,
      take: 1,
    });
    expect(zoekKlokaanbod.mock.calls[1][0]).toMatchObject({ skip: 1, take: 1 });
  });

  it("handles an empty slice in a single call, without writing anything", async () => {
    const { client, zoekKlokaanbod } = clientMet([{ results: [], totalDocuments: 0 }]);
    const writePage = vi.fn(async () => writeResultaat(0));

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "EELDE" },
      pageSize: 500,
      writePage,
      now: () => new Date(),
    });

    expect(uit.rowsProcessed).toBe(0);
    expect(uit.compleet).toBe(true);
    expect(zoekKlokaanbod).toHaveBeenCalledTimes(1);
    expect(writePage).not.toHaveBeenCalled();
  });

  it("reports incomplete when a short page arrives before the total is reached", async () => {
    const { client } = clientMet([{ results: [], totalDocuments: 5 }]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "NAALDWIJK" },
      pageSize: 500,
      writePage: async () => writeResultaat(0),
      now: () => new Date(),
    });

    expect(uit.compleet).toBe(false);
    expect(uit.totalDocuments).toBe(5);
  });

  // Not one of the plan's three tests. Added while working through what happens if
  // totalDocuments shrinks mid-walk (rows sold and removed from the clock while paging).
  // A full page followed by a short page that already satisfies the new, lower total must
  // stop rather than ask for a third page that a shrunk result set can no longer answer.
  it("stops as soon as a shrunk total is satisfied, even on a full first page", async () => {
    const { client, zoekKlokaanbod } = clientMet([
      { results: [payload("11111111-1111-4111-8111-111111111111")], totalDocuments: 2 },
      { results: [payload("22222222-2222-4222-8222-222222222222")], totalDocuments: 1 },
    ]);

    const uit = await syncSnede({
      client,
      snede: { auctionDate: "20260807", auctionLocationKey: "NAALDWIJK" },
      pageSize: 1,
      writePage: async (rows) => writeResultaat(rows.length),
      now: () => new Date(),
    });

    expect(zoekKlokaanbod).toHaveBeenCalledTimes(2);
    expect(uit.rowsProcessed).toBe(2);
    expect(uit.totalDocuments).toBe(1);
    expect(uit.compleet).toBe(true);
  });
});

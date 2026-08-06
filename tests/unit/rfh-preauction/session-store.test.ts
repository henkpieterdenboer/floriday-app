import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

/**
 * Unit-niveau tegenhanger van tests/integration/rfh-preauction/session-store.test.ts. Die
 * draait tegen een echte database en kan dus nooit het geval oefenen waar deze test om
 * draait: een database die de RfhSession-tabel nog helemaal niet heeft, zoals productie
 * vlak vóór de eerste `npm run db:push` (zie scripts/db-push.mjs en het AppSetting-incident
 * van 5 augustus 2026).
 *
 * Geen `beforeEach(() => findUnique.mockReset())`: in combinatie met een mock die afwijst
 * (reject) leidde dat hier tot een valse testfout van Vitest zelf (een unhandled-rejection
 * die aan de verkeerde test werd toegeschreven, terwijl de eigenlijke code-aanroep - geverifieerd
 * met console.log tijdens het uitzoeken - het juiste resultaat teruggaf). Elke test zet zijn
 * eigen implementatie, wat hetzelfde effect heeft zonder die hook-grens.
 */
const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { rfhSession: { findUnique } } }));

const { leesSessie } = await import("@/features/rfh-preauction/client/session-store");

describe("leesSessie", () => {
  it("returns undefined - not null - when the RfhSession table does not exist yet", async () => {
    findUnique.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError(
        "The table `public.RfhSession` does not exist in the current database.",
        { code: "P2021", clientVersion: "test" },
      );
    });

    expect(await leesSessie()).toBeUndefined();
  });

  it("still throws on any other database error, so a real problem stays visible", async () => {
    findUnique.mockImplementation(async () => {
      throw new Error("connection refused");
    });

    await expect(leesSessie()).rejects.toThrow(/connection refused/);
  });

  it("returns null - not undefined - when the table exists but is empty", async () => {
    findUnique.mockImplementation(async () => null);

    expect(await leesSessie()).toBeNull();
  });
});

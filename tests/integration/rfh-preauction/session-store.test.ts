import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  leesSessie,
  schrijfSessie,
  vernieuwOnderSlot,
} from "@/features/rfh-preauction/client/session-store";

/**
 * Deze tests schrijven op dezelfde rij als een echte koppeling.
 *
 * RfhSession heeft er per ontwerp maar één, met id "default", en session-store.ts schrijft
 * dat id hard in de code. Er is dus geen testvoorvoegsel te bedenken zoals
 * tests/helpers/test-ids.ts dat voor de archieftabellen doet: de rij die deze test aanmaakt
 * is dezelfde rij die `npm run rfh-koppel` aanmaakt.
 *
 * Zonder voorzorg zou een `npm test` daarmee de koppeling van de testomgeving wissen, en
 * die is niet terug te zetten zonder een mens die in een browser inlogt - de refresh token
 * is eenmalig zichtbaar. Vandaar dat een eventueel bestaande rij hieronder eerst bewaard en
 * na afloop teruggezet wordt. De afterEach ruimt op tussen de tests door; de afterAll
 * herstelt de uitgangssituatie.
 *
 * De guard in tests/integration/no-real-data-touched.test.ts telt SupplyLine,
 * SupplyLineVersion, TradeItem en Organization. RfhSession komt daar niet in voor, dus die
 * test merkt hier niets van - reden te meer om het hier zelf af te dekken.
 */
let bestaandeSessie: {
  refreshToken: string;
  lastRefreshedAt: Date | null;
  lastError: string | null;
} | null = null;

beforeAll(async () => {
  const rij = await prisma.rfhSession.findFirst();
  if (rij) {
    bestaandeSessie = {
      refreshToken: rij.refreshToken,
      lastRefreshedAt: rij.lastRefreshedAt,
      lastError: rij.lastError,
    };
  }
});

afterEach(async () => {
  await prisma.rfhSession.deleteMany({});
});

afterAll(async () => {
  if (bestaandeSessie) {
    await prisma.rfhSession.create({ data: { id: "default", ...bestaandeSessie } });
  }
  await prisma.$disconnect();
});

describe("session-store", () => {
  it("returns null when no session has been set up yet", async () => {
    expect(await leesSessie()).toBeNull();
  });

  it("stores and reads back a refresh token", async () => {
    await schrijfSessie("token-een");
    expect((await leesSessie())?.refreshToken).toBe("token-een");

    await schrijfSessie("token-twee");
    expect((await leesSessie())?.refreshToken).toBe("token-twee");
  });

  it("hands the current token to the work and persists the rotated one", async () => {
    await schrijfSessie("token-een");

    const uitkomst = await vernieuwOnderSlot(async (huidige) => {
      expect(huidige).toBe("token-een");
      return { nieuweRefreshToken: "token-geroteerd", waarde: "klaar" };
    });

    expect(uitkomst).toBe("klaar");
    const sessie = await leesSessie();
    expect(sessie?.refreshToken).toBe("token-geroteerd");
    expect(sessie?.lastError).toBeNull();
    expect(sessie?.lastRefreshedAt).not.toBeNull();
  });

  it("records the failure and leaves the token untouched when the work throws", async () => {
    await schrijfSessie("token-een");

    await expect(
      vernieuwOnderSlot(async () => {
        throw new Error("invalid_grant - verlopen");
      }),
    ).rejects.toThrow(/invalid_grant/);

    const sessie = await leesSessie();
    expect(sessie?.refreshToken).toBe("token-een");
    expect(sessie?.lastError).toMatch(/invalid_grant/);
  });

  it("refuses to run when no session exists", async () => {
    await expect(
      vernieuwOnderSlot(async () => ({ nieuweRefreshToken: "x", waarde: 1 })),
    ).rejects.toThrow(/nog niet gekoppeld/);
  });
});

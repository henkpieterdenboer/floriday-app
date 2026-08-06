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
/** Hetzelfde id dat session-store.ts hanteert; hier herhaald zodat de tests niet stilzwijgend
 *  op "er is toch maar één rij" leunen terwijl de productiecode dat overal expliciet maakt. */
const SESSIE_ID = "default";

const wacht = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let bestaandeSessie: {
  refreshToken: string;
  lastRefreshedAt: Date | null;
  lastError: string | null;
} | null = null;

beforeAll(async () => {
  const rij = await prisma.rfhSession.findUnique({ where: { id: SESSIE_ID } });
  if (rij) {
    bestaandeSessie = {
      refreshToken: rij.refreshToken,
      lastRefreshedAt: rij.lastRefreshedAt,
      lastError: rij.lastError,
    };
  }
});

afterEach(async () => {
  await prisma.rfhSession.deleteMany({ where: { id: SESSIE_ID } });
});

afterAll(async () => {
  if (bestaandeSessie) {
    await prisma.rfhSession.create({ data: { id: SESSIE_ID, ...bestaandeSessie } });
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

  /**
   * De reden dat dit bestand bestaat, en de enige test die hem meet.
   *
   * De vijf tests hierboven slagen even hard wanneer je de regel met
   * pg_advisory_xact_lock volledig weghaalt - ze draaien allemaal in hun eentje. Terwijl
   * juist het slot het faalgeval afdekt dat niet te herstellen is: twee aanroepers die
   * tegelijk dezelfde refresh token opnemen, waarna Okta de tweede afwijst en de sessie dood
   * is tot iemand in een browser inlogt.
   *
   * Twee beweringen, en de tweede is de scherpe. Dat het werk niet vervlecht toont aan dat
   * er geserialiseerd wordt. Dat B de token ziet die A geroteerd heeft, toont aan dat B zijn
   * rij pas gelezen heeft nadat A gecommit was - en dát is de eigenschap die de sessie redt.
   * Serialiseren zonder die tweede eigenschap zou nog steeds twee keer dezelfde token
   * opnemen.
   *
   * B start een kwart seconde later zodat vaststaat wie er eerst is; zonder dat zou de
   * volgorde van de race afhangen en zou de test twee uitkomsten moeten toestaan. Die marge
   * moet A's transactie kunnen openen over een WebSocket naar Neon en door PgBouncer heen,
   * en dat kan op een koude verbinding traag zijn - vandaar ruim in plaats van net genoeg.
   * Het is de enige tijdsaanname in dit bestand.
   *
   * Eén gedeelde PrismaClient volstaat hier, en dat is niet vanzelfsprekend: als de pool de
   * twee transacties zelf al na elkaar zou uitvoeren, zou deze test ook zonder het slot
   * slagen en dus niets bewijzen. Dat doet hij niet. Haal de regel met
   * pg_advisory_xact_lock uit session-store.ts weg en deze test valt om op vervlochten
   * gebeurtenissen (waargenomen: b-start, a-start, b-klaar, a-klaar). De serialisatie komt
   * dus aantoonbaar van het slot en niet van de pool. Wie hieraan sleutelt: doe die proef
   * opnieuw, het is de enige manier om te weten dat de test nog meet wat hij beweert.
   */
  it("makes the second caller wait for the first to commit", async () => {
    await schrijfSessie("token-een");

    const gebeurtenissen: string[] = [];

    const a = vernieuwOnderSlot(async (huidige) => {
      gebeurtenissen.push("a-start");
      await wacht(500);
      gebeurtenissen.push("a-klaar");
      return { nieuweRefreshToken: "token-a", waarde: huidige };
    });

    const b = (async () => {
      await wacht(250);
      return vernieuwOnderSlot(async (huidige) => {
        gebeurtenissen.push("b-start");
        await wacht(50);
        gebeurtenissen.push("b-klaar");
        return { nieuweRefreshToken: "token-b", waarde: huidige };
      });
    })();

    const [gezienDoorA, gezienDoorB] = await Promise.all([a, b]);

    expect(gebeurtenissen).toEqual(["a-start", "a-klaar", "b-start", "b-klaar"]);
    expect(gezienDoorA).toBe("token-een");
    expect(gezienDoorB).toBe("token-a");
    expect((await leesSessie())?.refreshToken).toBe("token-b");
  });
});

import { prisma } from "@/lib/db";

/** One row, always. The default matches RfhSession.id's default in the schema. */
const SESSIE_ID = "default";

/**
 * Fixed key for pg_advisory_xact_lock. Arbitrary but stable: any two processes that want
 * to rotate the refresh token must pick the same number, and changing it later would
 * silently disable the mutual exclusion rather than fail loudly.
 */
const SLOT_SLEUTEL = 8140711;

export interface RfhSessie {
  refreshToken: string;
  lastRefreshedAt: Date | null;
  lastError: string | null;
}

export async function leesSessie(): Promise<RfhSessie | null> {
  const rij = await prisma.rfhSession.findUnique({ where: { id: SESSIE_ID } });
  if (!rij) return null;
  return {
    refreshToken: rij.refreshToken,
    lastRefreshedAt: rij.lastRefreshedAt,
    lastError: rij.lastError,
  };
}

/** Used by scripts/rfh-koppel.ts to seed or replace the session by hand. */
export async function schrijfSessie(refreshToken: string): Promise<void> {
  await prisma.rfhSession.upsert({
    where: { id: SESSIE_ID },
    create: { id: SESSIE_ID, refreshToken, lastError: null },
    update: { refreshToken, lastError: null },
  });
}

export interface VernieuwResultaat<T> {
  nieuweRefreshToken: string;
  waarde: T;
}

/**
 * Runs `werk` with the current refresh token and persists whatever it hands back, with a
 * transaction-scoped advisory lock held for the whole exchange.
 *
 * The lock is the point of this function. Okta rotates the refresh token on every use, so
 * two concurrent refreshes do not merely duplicate work: the second one presents a token
 * the first has already spent, Okta rejects it, and the session is dead until a human
 * logs in again. The cron route already refuses to start overlapping runs, but that guard
 * lives one layer up and does not cover a script running alongside a cron.
 *
 * On failure the stored row is left byte-for-byte as it was and the reason is recorded, so
 * the status page can tell "never coupled" apart from "coupling expired".
 *
 * That is not the same as a guarantee that the session survives, and the difference matters.
 * Okta rotates the moment it answers, but our side only becomes true at COMMIT. Anything
 * that kills the transaction in between - the timeout below, a dropped WebSocket, a crashed
 * process - leaves the database holding a token that has already been spent on the other
 * side, and the next run finds a session it cannot rescue. Rolling back protects the token
 * from being overwritten with a wrong value; nothing can protect it from having been
 * rotated. Only a two-phase protocol with Okta could close that window, and Okta does not
 * offer one. So the window is kept short instead: the timeout is generous rather than tight,
 * because a transaction that is aborted for being slow lands in exactly this hole.
 */
export async function vernieuwOnderSlot<T>(
  werk: (huidigeRefreshToken: string) => Promise<VernieuwResultaat<T>>,
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SLOT_SLEUTEL})`;

        const rij = await tx.rfhSession.findUnique({ where: { id: SESSIE_ID } });
        if (!rij) {
          throw new Error(
            "RFH Pre-Auction is nog niet gekoppeld. Draai `npm run rfh-koppel` met een " +
              "verse refresh token uit een privévenster.",
          );
        }

        const uitkomst = await werk(rij.refreshToken);

        await tx.rfhSession.update({
          where: { id: SESSIE_ID },
          data: {
            refreshToken: uitkomst.nieuweRefreshToken,
            lastRefreshedAt: new Date(),
            lastError: null,
          },
        });

        return uitkomst.waarde;
      },
      // Ruim bemeten, en met opzet. Deze transactie houdt het slot vast terwijl de gang naar
      // Okta loopt, dus een krappe limiet koopt niets: een tweede aanroeper wacht toch al.
      // Wat een krappe limiet wél doet is de transactie afbreken op precies het moment dat
      // Okta al geroteerd heeft maar wij nog niet gecommit hebben - zie de docstring. De
      // cron-route eromheen krijgt maxDuration = 300, dus 45 seconden past daar ruim binnen.
      { timeout: 45_000 },
    );
  } catch (error: unknown) {
    // The note has to be written outside the transaction, and this is not a style choice.
    // Throwing inside the callback rolls the transaction back, so a note written in there
    // would vanish along with everything else - which is exactly what we want for the
    // token (it must stay untouched on failure) and exactly what we do not want for the
    // reason it failed. The rollback is the mechanism that protects the token; this catch
    // is what survives it.
    //
    // Best effort: if the database itself is what broke, a failure to record the note must
    // not replace the original, more informative error.
    const bericht = error instanceof Error ? error.message : String(error);
    try {
      // updateMany, not update: update throws when the row is missing, and the
      // "not coupled yet" path arrives here with no row at all.
      await prisma.rfhSession.updateMany({
        where: { id: SESSIE_ID },
        data: { lastError: bericht },
      });
    } catch {
      // niets - de oorspronkelijke fout is belangrijker
    }
    throw error;
  }
}

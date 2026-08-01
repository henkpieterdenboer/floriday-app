import { createHash, randomBytes } from "node:crypto";

/** Zeven dagen, in milliseconden. */
export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export interface NewInvitationToken {
  /** Gaat naar de gebruiker, in de mail. Wordt nergens opgeslagen. */
  token: string;
  /** Gaat de database in. */
  tokenHash: string;
}

export function createInvitationToken(): NewInvitationToken {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

/**
 * SHA-256 volstaat hier, anders dan bij wachtwoorden. Een token van 32 willekeurige bytes
 * is niet te raden, dus het langzame hashen dat wachtwoorden nodig hebben voegt niets toe -
 * het maakt het opzoeken alleen traag.
 */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Op het verloopmoment zelf is de uitnodiging al verlopen. */
export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}

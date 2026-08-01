import { hash, verify } from "@node-rs/argon2";

/**
 * OWASP-aanbeveling voor argon2id op het moment van schrijven. Bewust hier vastgelegd in
 * plaats van op standaardwaarden vertrouwen, zodat een wijziging zichtbaar is in de
 * versiegeschiedenis.
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

/**
 * Geeft false in plaats van te gooien wanneer de opgeslagen hash onbruikbaar is. Een
 * kapotte hash mag een inlogpoging laten mislukken, niet de hele aanmeldroute.
 */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

/**
 * Waar je belandt als er geen bewuste bestemming is. De API-status en niet het aanbod: het
 * eerste wat je wilt weten is of de koppeling loopt en hoe vers de gegevens zijn. Staat het
 * stoplicht op rood, dan zegt een aanbodscherm vol oude regels niets. Zelfde keuze als in
 * `src/app/page.tsx`, die de wortel van de site naar /status stuurt.
 */
const DEFAULT_TARGET = "/status";

/**
 * Checks whether a redirect target is a path within this application. Used for the `verder`
 * query parameter after sign-in, which an attacker fully controls - without this check it is a
 * textbook open redirect (`?verder=https://evil.example` or `?verder=//evil.example`).
 *
 * Must start with a single `/`, must not start with `//`, must not contain `://`, and must not
 * contain a backslash: browsers normalise `/\evil.example` to `//evil.example`, the same
 * protocol-relative attack spelled differently.
 */
export function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("://")) return false;
  return true;
}

/** Picks the redirect target after sign-in: the requested path if safe, otherwise the default. */
export function resolveRedirectTarget(verder: string | null | undefined): string {
  if (verder && isSafeRedirectPath(verder)) return verder;
  return DEFAULT_TARGET;
}

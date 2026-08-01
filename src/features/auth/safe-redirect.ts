const DEFAULT_TARGET = "/aanbod";

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

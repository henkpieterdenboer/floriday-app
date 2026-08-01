export interface LinkableAccount {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string | null;
}

export interface EntraSignInInput {
  profileEmail: string | null;
  profileEmailVerified: boolean;
  account: LinkableAccount | null;
}

export type EntraSignInDecision =
  | { allowed: true; userId: string }
  | {
      allowed: false;
      reason: "no-email" | "email-not-verified" | "no-account" | "deactivated" | "email-mismatch";
    };

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Bepaalt of een aanmelding via Entra door mag. Twee regels dragen de beveiliging:
 *
 * 1. Er wordt nooit een account aangemaakt. SSO geeft toegang tot bestaande accounts, meer
 *    niet. Zonder die regel kan iedereen met een werkmailadres binnenlopen zodra de
 *    koppeling live gaat.
 * 2. Het adres moet geverifieerd zijn en exact overeenkomen. Zonder de eerste eis
 *    vertrouwen we een provider op zijn woord; zonder de tweede kan iemand met een ander
 *    account op een bestaand account belanden.
 *
 * Of het account al een wachtwoord heeft doet niet ter zake: wie is uitgenodigd maar nog
 * nooit heeft ingelogd, neemt zijn account hiermee in gebruik zonder ooit een wachtwoord te
 * kiezen.
 */
export function decideEntraSignIn(input: EntraSignInInput): EntraSignInDecision {
  const { profileEmail, profileEmailVerified, account } = input;

  if (!profileEmail || normaliseEmail(profileEmail) === "") {
    return { allowed: false, reason: "no-email" };
  }
  if (!profileEmailVerified) {
    return { allowed: false, reason: "email-not-verified" };
  }
  if (!account) {
    return { allowed: false, reason: "no-account" };
  }
  if (normaliseEmail(profileEmail) !== normaliseEmail(account.email)) {
    return { allowed: false, reason: "email-mismatch" };
  }
  if (!account.isActive) {
    return { allowed: false, reason: "deactivated" };
  }

  return { allowed: true, userId: account.id };
}

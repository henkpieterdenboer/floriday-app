import type { EntraSignInDecision } from "@/features/auth/entra-linking";

/** The `reason` values decideEntraSignIn() can produce, mirrored here for the login page. */
export type EntraSignInErrorCode = Extract<EntraSignInDecision, { allowed: false }>["reason"];

const MESSAGES: Record<EntraSignInErrorCode, string> = {
  "no-account": "Dit account is bij ons niet bekend. Vraag een beheerder om je toe te voegen.",
  deactivated:
    "Dit account is uitgeschakeld. Neem contact op met een beheerder om het weer te activeren.",
  "email-mismatch":
    "Het e-mailadres van je werkaccount komt niet overeen met je account bij ons. Neem contact op met een beheerder.",
  "email-not-verified":
    "Het e-mailadres van je werkaccount is niet geverifieerd. Neem contact op met een beheerder.",
  "no-email": "Er is geen e-mailadres ontvangen van je werkaccount. Neem contact op met een beheerder.",
};

function isKnownCode(code: string): code is EntraSignInErrorCode {
  return code in MESSAGES;
}

/** Translates the `?fout=` code the Entra sign-in callback appends on rejection into a Dutch sentence. */
export function entraErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  if (isKnownCode(code)) return MESSAGES[code];
  return "Aanmelden via Microsoft is niet gelukt. Probeer het opnieuw of neem contact op met een beheerder.";
}

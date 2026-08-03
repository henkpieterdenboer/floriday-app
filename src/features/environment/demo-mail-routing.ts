import { isDemoModeAllowed } from "@/features/environment/environment-banner";

/**
 * Cookienamen gedeeld tussen `/api/email-provider` (schrijft ze) en `mail.ts` (leest ze).
 * Op één plek gehouden zodat ze niet uit elkaar kunnen lopen.
 */
export const EMAIL_PROVIDER_COOKIE = "demo-email-provider";
export const EMAIL_RECIPIENT_COOKIE = "demo-email-recipient";

export type DemoMailProvider = "test" | "live";

/**
 * De providernaam zoals die aan de gebruiker getoond wordt: de cookie als die een geldige
 * waarde heeft, anders wat `mail.ts` sowieso zou kiezen (Resend als SMTP volledig is
 * ingevuld, anders Ethereal). Zo toont de e-mailschakelaar nooit "Test" terwijl er in
 * werkelijkheid al gewoon via Resend verstuurd wordt, of andersom.
 */
export function currentEmailProvider(
  cookieValue: string | undefined,
  smtpConfigured: boolean,
): DemoMailProvider {
  if (cookieValue === "test" || cookieValue === "live") return cookieValue;
  return smtpConfigured ? "live" : "test";
}

export interface ResolveMailRoutingInput {
  vercelEnv: string | undefined;
  /** Of we op Vercel draaien. Zonder dit kan een lege VERCEL_ENV op productie niet van
   * lokaal draaien onderscheiden worden - zie isDemoModeAllowed. */
  onVercel: string | undefined;
  smtpConfigured: boolean;
  providerCookie: string | undefined;
  recipientCookie: string | undefined;
  to: string;
  subject: string;
}

export interface MailRouting {
  /** true = via SMTP (Resend) versturen, false = via Ethereal. */
  useResend: boolean;
  to: string;
  subject: string;
}

/**
 * Bepaalt, puur en zonder I/O, hoe een mail daadwerkelijk verstuurd wordt. `mail.ts` haalt
 * de cookiewaarden op en roept dit aan; alle regels staan hier zodat ze zonder mocks van
 * `next/headers` te testen zijn.
 *
 * - Op productie (`isDemoModeAllowed` false) worden de cookies genegeerd, ook al staan ze
 *   toevallig in de browser van een beheerder - de override geldt alleen waar de
 *   testbalk zelf ook mag draaien.
 * - `providerCookie === "test"` dwingt Ethereal af, zelfs als SMTP volledig geconfigureerd
 *   is - dat is het hele punt van de schakelaar.
 * - Een ontvanger-override herschrijft het "to"-adres en zet de oorspronkelijke ontvanger
 *   voorin het onderwerp, zodat nooit onduidelijk is voor wie een bericht eigenlijk bedoeld
 *   was.
 */
export function resolveMailRouting(input: ResolveMailRoutingInput): MailRouting {
  const demoAllowed = isDemoModeAllowed(input.vercelEnv, input.onVercel);
  const providerCookie = demoAllowed ? input.providerCookie : undefined;
  const recipientCookie = demoAllowed ? input.recipientCookie : undefined;

  const provider = currentEmailProvider(providerCookie, input.smtpConfigured);
  // `provider === "live"` kan ook de fallback zijn (geen cookie, SMTP wel geconfigureerd) -
  // in beide gevallen mag Resend alleen echt gebruikt worden als SMTP ook daadwerkelijk
  // geconfigureerd is.
  const useResend = provider === "live" && input.smtpConfigured;

  const recipient = recipientCookie?.trim();
  if (recipient) {
    return { useResend, to: recipient, subject: `[naar ${input.to}] ${input.subject}` };
  }
  return { useResend, to: input.to, subject: input.subject };
}

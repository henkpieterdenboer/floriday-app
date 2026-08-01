import type { Mail } from "@/lib/mail";

export interface InvitationMailInput {
  to: string;
  name: string;
  invitationUrl: string;
  expiresAt: Date;
  /** Toon de Entra-mogelijkheid alleen als die daadwerkelijk aanstaat. */
  entraEnabled: boolean;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(date);
}

export function buildInvitationMail(input: InvitationMailInput): Mail {
  const { to, name, invitationUrl, expiresAt, entraEnabled } = input;

  const entraLine = entraEnabled
    ? "Je kunt ook meteen aanmelden met je werkaccount van Microsoft; dan heb je geen wachtwoord nodig."
    : "";

  const text = [
    `Hallo ${name},`,
    "",
    "Je hebt toegang gekregen tot het aanbodoverzicht van Coloriginz.",
    "",
    `Stel hier je wachtwoord in: ${invitationUrl}`,
    `Deze link werkt tot ${formatDate(expiresAt)}.`,
    entraLine,
  ].filter(Boolean).join("\n");

  const html = `
    <p>Hallo ${name},</p>
    <p>Je hebt toegang gekregen tot het aanbodoverzicht van Coloriginz.</p>
    <p><a href="${invitationUrl}" style="background-color:#0f7b3f;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Wachtwoord instellen</a></p>
    <p>Deze link werkt tot ${formatDate(expiresAt)}.</p>
    ${entraLine ? `<p>${entraLine}</p>` : ""}
  `.trim();

  return { to, subject: "Toegang tot het aanbodoverzicht", text, html };
}

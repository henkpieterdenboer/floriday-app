import { buildEmail } from "@/components/email/email-shell";
import type { EmailBlock, Mail } from "@/components/email/email-types";
import { coloriginzBrand } from "./brand";

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

/**
 * De uitnodiging, gebouwd met @col/email-shell. De blokken zijn de enige bron: `buildEmail`
 * rendert daar zowel de HTML als de platte tekst uit, en escapet elk tekstveld zelf. Namen
 * komen uit een invulveld, dus dat laatste is geen detail - de vorige versie interpoleerde
 * `name` ongefilterd in de HTML.
 */
export function buildInvitationMail(input: InvitationMailInput): Mail {
  const { to, name, invitationUrl, expiresAt, entraEnabled } = input;

  const blocks: EmailBlock[] = [
    { kind: "heading", text: "Stel je wachtwoord in" },
    { kind: "paragraph", text: `Hallo ${name},` },
    { kind: "paragraph", text: "Je hebt toegang gekregen tot het aanbod van Floriday." },
    { kind: "button", label: "Wachtwoord instellen", href: invitationUrl },
  ];

  if (entraEnabled) {
    blocks.push({
      kind: "paragraph",
      text:
        "Je kunt ook meteen aanmelden met je werkaccount van Microsoft; dan heb je geen " +
        "wachtwoord nodig.",
    });
  }

  // De geldigheidsdatum staat bewust achteraan: een `note` is klein en gedempt, en zo'n
  // regel gevolgd door een gewone alinea leest als een onderschrift bij het verkeerde stuk.
  blocks.push({ kind: "note", text: `Deze link werkt tot ${formatDate(expiresAt)}.` });

  return buildEmail({
    to,
    subject: "Toegang tot het aanbod van Floriday",
    brand: coloriginzBrand(),
    blocks,
  });
}

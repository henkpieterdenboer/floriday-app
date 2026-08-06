import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { buildInvitationMail } from "@/features/auth/emails/invitation";

/**
 * Schrijft de uitnodigingsmail als `.eml` naar tmp/, met het echte logo als bijlage.
 *
 *   npm run testmail
 *
 * Dubbelklik het bestand om het te openen in Outlook desktop of Apple Mail. Bedoeld voor de
 * handmatige clientronde: of de VML-knop echt als knop rendert en of het logo doorkomt, is
 * niet uit de code af te leiden - dat moet je zien.
 *
 * Twee dingen die dit script bewust niet doet. Het verstuurt niets: `npm run invite` doet
 * dat, en die stuurt lokaal via Ethereal. En het kopieert de opbouw van de mail niet, maar
 * roept `buildInvitationMail` aan - een tweede sjabloon dat langzaam uit de pas loopt is
 * precies wat @col/email-shell moest oplossen.
 *
 * Gmail importeert geen losse `.eml`. Die controle vraagt een echte verzending naar een
 * Gmail-adres via `npm run invite` met de SMTP-gegevens ingevuld.
 */

const CONTENT_TYPE = "image/png";

/** Base64 met regels van 76 tekens, zoals RFC 2045 voorschrijft - zonder wrap accepteren
 *  sommige clients de bijlage niet. */
function base64Regels(buffer: Buffer): string {
  const b64 = buffer.toString("base64");
  const regels: string[] = [];
  for (let i = 0; i < b64.length; i += 76) regels.push(b64.slice(i, i + 76));
  return regels.join("\r\n");
}

const mail = buildInvitationMail({
  to: "ontvanger@voorbeeld.nl",
  name: "Jan & co",
  invitationUrl: "https://floriday.apps.coloriginz.com/uitnodiging/testtoken",
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  entraEnabled: true,
});

const logo = mail.attachments[0];
const rel = `rel_${randomBytes(8).toString("hex")}`;
const alt = `alt_${randomBytes(8).toString("hex")}`;

// multipart/related (voor het logo) met daarin multipart/alternative (tekst + html): de vorm
// die een CID-verwijzing veronderstelt.
const eml = [
  "From: Floriday Middleware <noreply@coloriginz.com>",
  `To: ${mail.to}`,
  `Subject: ${mail.subject}`,
  "MIME-Version: 1.0",
  `Content-Type: multipart/related; boundary="${rel}"`,
  "",
  `--${rel}`,
  `Content-Type: multipart/alternative; boundary="${alt}"`,
  "",
  `--${alt}`,
  'Content-Type: text/plain; charset="utf-8"',
  "Content-Transfer-Encoding: base64",
  "",
  base64Regels(Buffer.from(mail.text, "utf8")),
  "",
  `--${alt}`,
  'Content-Type: text/html; charset="utf-8"',
  "Content-Transfer-Encoding: base64",
  "",
  base64Regels(Buffer.from(mail.html, "utf8")),
  "",
  `--${alt}--`,
  "",
  `--${rel}`,
  `Content-Type: ${CONTENT_TYPE}; name="${logo.filename}"`,
  "Content-Transfer-Encoding: base64",
  `Content-ID: <${logo.cid}>`,
  `Content-Disposition: inline; filename="${logo.filename}"`,
  "",
  base64Regels(logo.content),
  "",
  `--${rel}--`,
  "",
].join("\r\n");

const map = join(process.cwd(), "tmp");
mkdirSync(map, { recursive: true });
const doel = join(map, "uitnodiging.eml");
writeFileSync(doel, eml);

console.log(`Geschreven: ${doel}`);
console.log("Dubbelklik het bestand om het in Outlook of Apple Mail te openen.");

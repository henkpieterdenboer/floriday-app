/**
 * Maakt een nieuwe uitnodiging voor een bestaand account en drukt de link af.
 *
 * Bedoeld voor het geval dat je niet meer bij het beheerscherm kunt: een vergeten
 * wachtwoord van de enige beheerder, of een nieuwe omgeving waar nog niemand binnen is.
 * Voor gewone uitnodigingen gebruik je /beheer/gebruikers.
 *
 * Gebruik:
 *   npm run invite -- --email jij@bedrijf.nl
 *   npm run invite -- --email jij@bedrijf.nl --url https://mijn-app.vercel.app
 *   npm run invite -- --env .env.lokaal-productie --email jij@bedrijf.nl --url https://...
 *
 * Zonder --url wordt APP_URL uit de configuratie gebruikt. Dat is lokaal
 * http://localhost:3000, wat niet werkt als je op een gedeployde omgeving wilt inloggen -
 * geef dan de echte URL mee.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { findUserByEmail } from "@/features/auth/users";
import { createInvitation } from "@/features/auth/invitations";
import { buildInvitationMail } from "@/features/auth/emails/invitation";
import { sendMail } from "@/lib/mail";
import { getEnv } from "@/lib/env";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const email = readFlag("email");
  if (!email) {
    console.error("Gebruik: npm run invite -- --email jij@bedrijf.nl [--url https://...]");
    process.exit(1);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`Geen account gevonden voor ${email} in deze database.`);
    console.error("Maak er een met: npm run create-admin -- --email ... --naam \"...\"");
    process.exit(1);
  }

  if (!user.isActive) {
    console.error(`Het account voor ${email} staat op inactief; heractiveer het eerst.`);
    process.exit(1);
  }

  const baseUrl = (readFlag("url") ?? getEnv().APP_URL).replace(/\/+$/, "");
  const invitation = await createInvitation(user.id);
  const url = `${baseUrl}/uitnodiging/${invitation.token}`;

  const preview = await sendMail(
    buildInvitationMail({
      to: user.email,
      name: user.name,
      invitationUrl: url,
      expiresAt: invitation.expiresAt,
      entraEnabled: false,
    }),
  );

  console.log(`Uitnodiging voor ${user.email} (${user.role}):`);
  console.log(url);
  console.log("");
  console.log(`Geldig tot ${invitation.expiresAt.toLocaleDateString("nl-NL", { dateStyle: "long" })}.`);
  if (user.passwordHash) {
    console.log("Let op: dit account had al een wachtwoord. Dat wordt overschreven zodra");
    console.log("de link gebruikt wordt; eerdere sessies blijven geldig tot ze verlopen.");
  }
  if (preview) console.log(`Mail bekijken: ${preview}`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

/**
 * Maakt een beheerder aan. Zonder dit is er niemand die gebruikers kan uitnodigen, en
 * omdat er geen zelfregistratie is, kom je er anders nooit in.
 *
 * Gebruik:
 *   npm run create-admin -- --email jij@bedrijf.nl --naam "Jouw Naam"
 *   npm run create-admin -- --env .env.production --email ... --naam "..."
 *
 * Zonder --env gaat dit naar de testdatabase. De doeldatabase wordt afgedrukt voordat er
 * iets wordt aangemaakt.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { createUser, findUserByEmail } from "@/features/auth/users";
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
  const name = readFlag("naam");

  if (!email || !name) {
    console.error('Gebruik: npm run create-admin -- --email jij@bedrijf.nl --naam "Jouw Naam"');
    console.error("Voeg --env .env.production toe om een andere omgeving te kiezen.");
    process.exit(1);
  }

  if (await findUserByEmail(email)) {
    console.error(`Er bestaat al een account voor ${email} in deze database.`);
    process.exit(1);
  }

  const user = await createUser({ email, name, role: "ADMIN" });
  const invitation = await createInvitation(user.id);
  const url = `${getEnv().APP_URL}/uitnodiging/${invitation.token}`;

  const preview = await sendMail(
    buildInvitationMail({
      to: user.email,
      name: user.name,
      invitationUrl: url,
      expiresAt: invitation.expiresAt,
      entraEnabled: false,
    }),
  );

  console.log(`Beheerder aangemaakt: ${user.email}`);
  console.log(`Uitnodiging: ${url}`);
  if (preview) console.log(`Mail bekijken: ${preview}`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

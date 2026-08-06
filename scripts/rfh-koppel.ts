/**
 * Koppelt deze installatie aan RFH Pre-Auction door een refresh token op te slaan.
 *
 * Zo kom je aan een token:
 *
 *   1. Open een privévenster - dit is belangrijk. Een privévenster krijgt zijn eigen
 *      sessie, dus de server eindigt met een refresh token die verder niemand gebruikt.
 *      Kopieer je token uit je gewone sessie en de twee draaien elkaar binnen het uur
 *      dood door de rotatie.
 *   2. Log in op https://pre-auction.royalfloraholland.com (of de staging-omgeving).
 *   3. Open de developer console en voer uit:
 *        JSON.parse(localStorage.getItem('okta-token-storage')).refreshToken.refreshToken
 *   4. Geef die waarde hieronder mee.
 *   5. Sluit het privévenster. Gebruik het daarna niet meer: de server bezit die sessie nu.
 *
 * Gebruik:
 *   npm run rfh-koppel -- --token <refresh-token>
 *   npm run rfh-koppel -- --env .env.lokaal-productie --token <refresh-token>
 *   npm run rfh-koppel -- --status
 *
 * Zonder --env gaat dit naar de testdatabase. De doeldatabase wordt afgedrukt voordat er
 * iets wordt aangeraakt.
 *
 * De load-env import moet als eerste blijven staan: imports draaien in volgorde van
 * declaratie, en zowel de Prisma-client als getRfhEnv() lezen hun configuratie bij het
 * laden.
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { leesSessie, schrijfSessie } from "@/features/rfh-preauction/client/session-store";
import { createProductieTokenProvider } from "@/features/rfh-preauction/client/token-provider";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function toonStatus(): Promise<void> {
  const sessie = await leesSessie();
  if (!sessie) {
    console.log("Niet gekoppeld. Draai dit script met --token.");
    return;
  }
  console.log("Gekoppeld.");
  console.log(`  laatst ververst : ${sessie.lastRefreshedAt?.toISOString() ?? "nog nooit"}`);
  console.log(`  laatste fout    : ${sessie.lastError ?? "geen"}`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--status")) {
    await toonStatus();
    return;
  }

  const token = readFlag("token");
  if (!token) {
    console.error("Geef een refresh token mee: npm run rfh-koppel -- --token <token>");
    console.error("Zie de kop van dit script voor hoe je daaraan komt.");
    process.exit(1);
  }

  await schrijfSessie(token);
  console.log("Token opgeslagen. Even proberen of hij werkt...");

  // Dit direct bewijzen is het hele punt van het script. Een token die pas om 03:00 tijdens
  // een cronrun blijkt niet te werken, kost een veildag - en deze feed kan dat niet inhalen.
  const provider = createProductieTokenProvider();
  await provider.getToken();

  console.log("Gelukt. De sessie is gekoppeld en de eerste rotatie is opgeslagen.");
  await toonStatus();
}

main()
  .catch((error: unknown) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

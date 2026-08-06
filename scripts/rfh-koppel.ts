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
import { getRfhEnv } from "@/lib/env";
import { leesSessie, schrijfSessie } from "@/features/rfh-preauction/client/session-store";
import { requestAccessToken } from "@/features/rfh-preauction/client/token-request";

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

  console.log("Token wordt ingewisseld...");

  // Eerst inwisselen, dan pas opslaan - en de geroteerde token opslaan, niet de token die is
  // meegegeven. Dit direct bewijzen is het hele punt van het script: een token die pas om
  // 03:00 tijdens een cronrun blijkt niet te werken, kost een veildag, en deze feed kan dat
  // niet inhalen. Was de volgorde omgekeerd, dan liet een mislukte ruil een dode token achter
  // in RfhSession - niets om met de hand op te ruimen, geen bewijs dat er ooit een geldige
  // koppeling is geweest, en --status zou dan "koppeling verlopen" melden in plaats van "nog
  // nooit gekoppeld". En de meegegeven token is na deze aanroep sowieso dood: Okta roteert
  // op elk gebruik, dus opslaan wat je meekreeg zou hoe dan ook de verkeerde token bewaren.
  //
  // vernieuwOnderSlot wordt hier bewust overgeslagen: die verwacht een bestaande rij om
  // onder een slot te lezen, en die is er bij de allereerste koppeling nog niet. Er is
  // hoogstens één schrijver mogelijk - een mens die dit script draait - dus het slot voegt
  // hier niets toe.
  const env = getRfhEnv();
  const resultaat = await requestAccessToken({
    tokenUrl: env.RFH_PREAUCTION_TOKEN_URL,
    clientId: env.RFH_PREAUCTION_CLIENT_ID,
    refreshToken: token,
  });

  await schrijfSessie(resultaat.refreshToken);
  // schrijfSessie zet alleen refreshToken en lastError. Deze regel legt vast dat de zojuist
  // bewezen rotatie ook echt heeft plaatsgevonden, zodat --status meteen "laatst ververst"
  // toont in plaats van "nog nooit" onder een melding die net het tegendeel zei.
  await prisma.rfhSession.update({
    where: { id: "default" }, // RfhSession.id's vaste waarde; zie prisma/schema.prisma.
    data: { lastRefreshedAt: new Date() },
  });

  console.log("Gelukt. De sessie is gekoppeld en de eerste rotatie is opgeslagen.");
  await toonStatus();
}

main()
  .catch((error: unknown) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    // process.exitCode, not process.exit(1): a forced exit here races the handles that the
    // fetch to Okta leaves behind and crashes the process outright on Windows (a libuv
    // assertion, "UV_HANDLE_CLOSING") instead of exiting cleanly with the message above still
    // on screen. Setting the code and letting main's promise chain drain lets Node close
    // those handles in the normal order.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

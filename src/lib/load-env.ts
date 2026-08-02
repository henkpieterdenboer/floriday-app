/**
 * Laadt de configuratie voor een script en zegt hardop tegen welke database het gaat werken.
 *
 * Importeer dit als **eerste** import van een script:
 *
 *     import "@/lib/load-env";
 *     import { prisma } from "@/lib/db";
 *
 * Imports worden in volgorde van declaratie uitgevoerd, dus dit draait voordat de
 * Prisma-client of getEnv() hun configuratie inlezen. Staat het er niet als eerste, dan is
 * het te laat: die modules lezen bij het laden en houden vast wat ze dan vinden.
 *
 * Kies een ander bestand met `--env <pad>` op de opdrachtregel. Zonder die vlag wordt
 * `.env` geladen, en dat is de testomgeving.
 *
 * Waarom niet gewoon DOTENV_CONFIG_PATH: die variabele wordt door de geïnstalleerde
 * dotenv-versie stilzwijgend genegeerd. Een script dat je dénkt tegen productie te draaien
 * schrijft dan naar test zonder dat iets dat meldt. Vandaar een expliciete vlag én een
 * regel op het scherm met de doeldatabase.
 */
import { config } from "dotenv";

const index = process.argv.indexOf("--env");
const path = index === -1 ? ".env" : process.argv[index + 1];

if (index !== -1 && !path) {
  throw new Error("--env verwacht een bestandsnaam, bijvoorbeeld: --env .env.lokaal-productie");
}

const result = config({ path, override: true, quiet: true });
if (result.error) {
  throw new Error(`Kan ${path} niet lezen: ${result.error.message}`);
}

const url = process.env.DIRECT_URL;
if (!url) {
  throw new Error(`${path} bevat geen DIRECT_URL.`);
}

export const envFile = path;
export const databaseHost = new URL(url.replace(/^postgres(ql)?:\/\//, "https://")).hostname;

console.log(`Configuratie : ${path}`);
console.log(`Database     : ${databaseHost}`);
console.log("");

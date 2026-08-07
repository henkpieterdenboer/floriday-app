import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  // De Floriday-gegevens zijn hier optioneel en worden pas streng gecontroleerd door
  // getFloridayEnv(), vlak voordat er een verzoek uitgaat.
  //
  // Waarom niet gewoon verplicht: dan kan een omgeving zonder die gegevens helemaal niets,
  // ook de dingen die er niets mee te maken hebben. Dat liep vast bij het aanmaken van de
  // eerste beheerder op productie - gebruikersbeheer raakt Floriday nergens, maar de
  // applicatie weigerde te starten. Een ontbrekende sleutel hoort de synchronisatie te
  // blokkeren, niet het inloggen.
  FLORIDAY_TOKEN_URL: z.string().url().optional(),
  FLORIDAY_CUSTOMERS_API_BASE_URL: z.string().url().optional(),
  FLORIDAY_CUSTOMERS_CLIENT_ID: z.string().optional(),
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: z.string().optional(),
  FLORIDAY_CUSTOMERS_API_KEY: z.string().optional(),

  // RFH Pre-Auction. Zelfde afweging als bij Floriday hierboven: optioneel in het brede
  // schema, streng gecontroleerd door getRfhEnv() vlak voor een verzoek. De refresh token
  // staat hier bewust niet tussen - die woont in RfhSession, omdat hij rouleert.
  RFH_PREAUCTION_API_BASE_URL: z.string().url().optional(),
  RFH_PREAUCTION_TOKEN_URL: z.string().url().optional(),
  RFH_PREAUCTION_CLIENT_ID: z.string().optional(),

  CRON_SECRET: z.string().min(1),

  // Zet op "false" om de uurlijkse Floriday-synchronisatie stil te leggen. Bedoeld voor een
  // omgeving die nog wacht op Floriday-gegevens: die hoort niet elk uur te falen alsof er
  // iets kapot is. Afwezig of iets anders dan "false" betekent aan. Regelt alleen Floriday
  // (clock-presales-supply, organisaties) - niet het klokaanbod, zie CLOCK_SYNC_ENABLED.
  SYNC_ENABLED: z.string().optional(),

  // Zelfde soort schakelaar als SYNC_ENABLED hierboven, maar voor het klokaanbod
  // (RFH Pre-Auction) apart: die bron heeft niets aan Floriday-credentials en hoort dus niet
  // vast te zitten aan de Floriday-schakelaar. Afwezig of iets anders dan "false" betekent aan.
  CLOCK_SYNC_ENABLED: z.string().optional(),

  APP_URL: z.string().url(),

  // E-mail. Ontbreken deze, dan valt de applicatie terug op Ethereal en wordt er niets
  // echt verstuurd - dat is wat je wilt tijdens ontwikkelen.
  SMTP_HOST: z.string().optional(),
  // Lege string wordt anders door z.coerce.number() als 0 gelezen in plaats van "niet
  // opgegeven" - dat maskeert een half ingevulde SMTP-configuratie.
  SMTP_PORT: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().optional(),
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),

  // Entra. Ontbreken deze, dan verschijnt de aanmeldknop niet.
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),

  NEXTAUTH_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Reads and validates the environment once. Throws with a readable message if invalid. */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${details}. See .env.example.`);
  }

  cached = parsed.data;
  return cached;
}

/** Clears the cached environment. Exists for tests so each test can exercise a fresh configuration. */
export function resetEnvCache(): void {
  cached = null;
}

const floridaySchema = z.object({
  FLORIDAY_TOKEN_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_API_BASE_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_CLIENT_ID: z.string().min(1),
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: z.string().min(1),
  FLORIDAY_CUSTOMERS_API_KEY: z.string().min(1),
});

export type FloridayEnv = z.infer<typeof floridaySchema>;

/**
 * De Floriday-gegevens, streng gecontroleerd.
 *
 * Apart van getEnv() omdat ze maar voor één ding nodig zijn: praten met Floriday. Alles
 * daarbuiten - inloggen, gebruikersbeheer, het zoekscherm op reeds opgehaalde data - hoort
 * te werken in een omgeving waar ze nog ontbreken. Dat is geen theorie: de productieomgeving
 * bestond eerder dan de credentials, en zonder deze splitsing kon daar niet eens een
 * beheerder worden aangemaakt.
 *
 * Roep dit aan vlak voordat er een verzoek uitgaat, niet bij het laden van een module.
 */
export function getFloridayEnv(): FloridayEnv {
  const parsed = floridaySchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(
      `Floriday is niet volledig geconfigureerd: ${details}. ` +
        "Zonder deze gegevens kan er niet met Floriday gesynchroniseerd worden; " +
        "de rest van de applicatie werkt wel.",
    );
  }
  return parsed.data;
}

const rfhSchema = z.object({
  RFH_PREAUCTION_API_BASE_URL: z.string().url(),
  RFH_PREAUCTION_TOKEN_URL: z.string().url(),
  RFH_PREAUCTION_CLIENT_ID: z.string().min(1),
});

export type RfhEnv = z.infer<typeof rfhSchema>;

/**
 * De RFH Pre-Auction-gegevens, streng gecontroleerd.
 *
 * Let op: dit zijn alleen de vaste gegevens. De sessie zelf - de refresh token - staat in
 * RfhSession en wordt door session-store.ts gelezen. Een omgeving die deze drie wel heeft
 * maar nog nooit gekoppeld is, komt dus tot hier en faalt daarna op een leesbare manier in
 * de sessielaag; dat is precies het onderscheid dat we willen kunnen zien.
 */
export function getRfhEnv(): RfhEnv {
  const parsed = rfhSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(
      `RFH Pre-Auction is niet volledig geconfigureerd: ${details}. ` +
        "Zonder deze gegevens kan het klokaanbod niet opgehaald worden; " +
        "de rest van de applicatie werkt wel.",
    );
  }
  return parsed.data;
}

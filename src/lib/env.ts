import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  FLORIDAY_TOKEN_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_API_BASE_URL: z.string().url(),
  FLORIDAY_CUSTOMERS_CLIENT_ID: z.string().min(1),
  FLORIDAY_CUSTOMERS_CLIENT_SECRET: z.string().min(1),
  FLORIDAY_CUSTOMERS_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),

  // Zet op "false" om de uurlijkse synchronisatie stil te leggen. Bedoeld voor een omgeving
  // die nog wacht op Floriday-gegevens: die hoort niet elk uur te falen alsof er iets kapot
  // is. Afwezig of iets anders dan "false" betekent aan.
  SYNC_ENABLED: z.string().optional(),

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

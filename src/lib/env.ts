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

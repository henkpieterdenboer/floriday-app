import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getEnv } from "@/lib/env";

const env = getEnv();

/** Entra doet alleen mee als het volledig geconfigureerd is. */
export const entraEnabled = Boolean(
  env.AZURE_AD_CLIENT_ID && env.AZURE_AD_CLIENT_SECRET && env.AZURE_AD_TENANT_ID,
);

/**
 * Edge-veilige configuratie: geen Credentials-provider (die trekt `@node-rs/argon2` binnen,
 * een native module die niet in de Edge runtime laadt) en geen database-toegang in de
 * callbacks. Dit bestand wordt zowel door de middleware (Edge) als door de volledige
 * configuratie in `auth-config.ts` (Node) gebruikt, zodat beide dezelfde sessie-vorm
 * hanteren.
 */
export const authConfig: NextAuthConfig = {
  providers: entraEnabled
    ? [
        MicrosoftEntraID({
          clientId: env.AZURE_AD_CLIENT_ID!,
          clientSecret: env.AZURE_AD_CLIENT_SECRET!,
          issuer: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/v2.0`,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role ?? "VIEWER";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = token.role ?? "VIEWER";
      }
      return session;
    },
  },
};

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/features/auth/password";
import { decideEntraSignIn } from "@/features/auth/entra-linking";
import { findUserByEmail, findUserById, recordLogin } from "@/features/auth/users";
import { authConfig, entraEnabled } from "@/features/auth/auth.config";

export { entraEnabled };

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "E-mailadres", type: "email" },
    password: { label: "Wachtwoord", type: "password" },
  },
  async authorize(credentials) {
    const email = typeof credentials?.email === "string" ? credentials.email : "";
    const password = typeof credentials?.password === "string" ? credentials.password : "";
    if (!email || !password) return null;

    const user = await findUserByEmail(email);
    // Geen account, geen wachtwoord ingesteld, of gedeactiveerd: alle drie leveren
    // hetzelfde antwoord op, zodat het inlogscherm niet verraadt welke adressen bestaan.
    if (!user || !user.passwordHash || !user.isActive) return null;
    if (!(await verifyPassword(user.passwordHash, password))) return null;

    await recordLogin(user.id);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
});

/**
 * Volledige configuratie: de edge-veilige basis uit `auth.config.ts`, aangevuld met de
 * Credentials-provider en de `signIn`-callback die de database raadpleegt. Dit bestand mag
 * alleen in de Node-runtime worden geimporteerd (de API-route, server components, server
 * actions) - nooit vanuit `middleware.ts`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider, ...authConfig.providers],
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Overschrijft de edge-veilige `jwt`-callback uit `auth.config.ts` met een variant die
     * ook de rol kan verversen zonder opnieuw in te loggen. Bewust hier en niet daar: dit
     * vraagt een databasequery, en `auth.config.ts` wordt ook door de Edge-middleware
     * geladen (zie het commentaar daar over `@node-rs/argon2`) - dus geen Prisma-aanroepen
     * in dat bestand.
     *
     * De rol staat normaal alleen in de JWT sinds het inloggen (`if (user)` hieronder,
     * identiek aan `auth.config.ts`). De demo-rolwisselaar in de testbalk werkt daarom
     * niet door alleen `User.role` te updaten - de lopende sessie zou het nooit merken.
     * `demo-controls.tsx` roept na die update `useSession().update({})` aan, wat next-auth
     * een POST naar `/api/auth/session` laat doen; dat roept deze callback opnieuw aan met
     * `trigger === "update"`, waarna hij de rol vers uit de database leest.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role ?? "VIEWER";
        return token;
      }

      if (trigger === "update" && typeof token.userId === "string") {
        const dbUser = await findUserById(token.userId);
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider !== "microsoft-entra-id") return true;

      const profileEmail =
        (typeof profile?.email === "string" ? profile.email : null) ??
        (typeof user.email === "string" ? user.email : null);

      const existing = profileEmail ? await findUserByEmail(profileEmail) : null;

      // LET OP: Microsoft Entra ID stuurt in de standaardconfiguratie geen `email_verified`
      // claim mee (geverifieerd in de gegenereerde types van @auth/core - die claim komt
      // niet voor in `MicrosoftEntraIDProfile`). Zolang die claim niet expliciet is
      // aangevraagd in de app-registratie (of we overstappen op `xms_edov` /
      // `verified_primary_email`), zal onderstaande dus standaard altijd op
      // "email-not-verified" uitkomen - dat is fail-closed en dus veilig, maar betekent ook
      // dat aanmelden via Entra pas echt werkt nadat dit tegen een live profiel is
      // geverifieerd en zo nodig bijgesteld. Nog te doen zodra Entra daadwerkelijk wordt
      // geconfigureerd.
      const decision = decideEntraSignIn({
        profileEmail,
        profileEmailVerified: profile?.email_verified === true,
        account: existing
          ? {
              id: existing.id,
              email: existing.email,
              isActive: existing.isActive,
              passwordHash: existing.passwordHash,
            }
          : null,
      });

      if (!decision.allowed) return `/login?fout=${decision.reason}`;

      await recordLogin(decision.userId);
      return true;
    },
  },
});

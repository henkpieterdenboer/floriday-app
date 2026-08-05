import NextAuth from "next-auth";
import { authConfig } from "@/features/auth/auth.config";

/**
 * Gebruikt bewust de edge-veilige `authConfig` (zonder Credentials-provider) in plaats van
 * de volledige configuratie uit `auth-config.ts`. Middleware draait in de Edge runtime, waar
 * `@node-rs/argon2` - een native module die de Credentials-provider binnentrekt via
 * `verifyPassword` - niet kan laden. Voor het uitlezen van `request.auth` (de sessie uit het
 * cookie) is de Credentials-provider sowieso niet nodig: die wordt alleen aangeroepen tijdens
 * de daadwerkelijke aanmeldflow op `/api/auth/callback/credentials`, niet in de middleware.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (!request.auth) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("verder", request.nextUrl.pathname);
    return Response.redirect(url);
  }
});

/**
 * De cron-routes staan er bewust buiten: die hebben hun eigen controle op CRON_SECRET en
 * worden door Vercel aangeroepen zonder sessie. Zou de middleware ze afvangen, dan stopt de
 * synchronisatie zonder dat iemand het merkt.
 */
export const config = {
  matcher: ["/status/:path*", "/aanbod/:path*", "/beheer/:path*"],
};

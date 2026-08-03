import { NextResponse } from "next/server";
import { auth } from "@/features/auth/auth-config";
import { isDemoModeAllowed, resolveBanner } from "@/features/environment/environment-banner";

export const dynamic = "force-dynamic";

/**
 * Vertelt wat de server over zijn eigen omgeving denkt.
 *
 * Bestaat omdat "de balk staat er wel maar de knoppen niet" van buitenaf niet te verklaren
 * is: je ziet het gevolg, niet de invoer. Zonder dit is de enige manier om erachter te
 * komen een deployment met extra logregels, en dan ben je een ronde verder.
 *
 * Toont bewust geen enkele waarde die geheim is - alleen welke omgevingsvlaggen aankomen
 * en welke beslissing daaruit volgt. Wel achter een sessie, zodat het niet publiek
 * verklapt welke build er draait.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const onVercel = process.env.VERCEL;

  return NextResponse.json({
    vercelEnv: vercelEnv ?? null,
    vercel: onVercel ?? null,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    balkZichtbaar: resolveBanner({
      vercelEnv,
      floridayBaseUrl: process.env.FLORIDAY_CUSTOMERS_API_BASE_URL,
    }).show,
    demoBesturingToegestaan: isDemoModeAllowed(vercelEnv, onVercel),
    rolVanDezeGebruiker: session.user.role ?? null,
  });
}

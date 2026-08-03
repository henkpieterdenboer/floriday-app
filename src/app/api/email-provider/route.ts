import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/features/auth/auth-config";
import { isDemoModeAllowed } from "@/features/environment/environment-banner";
import {
  currentEmailProvider,
  EMAIL_PROVIDER_COOKIE,
  EMAIL_RECIPIENT_COOKIE,
} from "@/features/environment/demo-mail-routing";
import { getEnv } from "@/lib/env";

/*
 * Glue voor @col/demo-mode - eigen implementatie van het GET/POST-contract uit
 * demo-mode.md, tegen cookies net als de starter. Anders dan de starter slaan we de
 * providerwaarde rechtstreeks op als "test"/"live" in plaats van een indirectie naar
 * "ethereal"/"resend": onze mail.ts leest die indirectie toch niet, dus voegt hij niets toe.
 *
 * Contract:
 *   GET  -> 200 { provider: 'test' | 'live', recipient: string | null }
 *           404 als demo mode uit staat, 401 als niet ingelogd
 *   POST { provider?: 'test' | 'live', recipient?: string | null }
 *        -> 200 { provider, recipient } | 400
 */

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
};

/**
 * 404 in plaats van 403 wanneer demo mode uit staat: een route die niet lijkt te bestaan
 * verraadt minder dan een die weigert. Dezelfde `isDemoModeAllowed`-regel als de testbalk
 * zelf (VERCEL_ENV !== "production"), niet `NEXT_PUBLIC_DEMO_MODE` - zie het commentaar bij
 * die functie voor waarom.
 */
async function guard(): Promise<NextResponse | null> {
  if (!isDemoModeAllowed(process.env.VERCEL_ENV)) {
    return new NextResponse(null, { status: 404 });
  }
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  return null;
}

function smtpConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD);
}

export async function GET() {
  const blocked = await guard();
  if (blocked) return blocked;

  const store = await cookies();
  const provider = currentEmailProvider(store.get(EMAIL_PROVIDER_COOKIE)?.value, smtpConfigured());
  const recipient = store.get(EMAIL_RECIPIENT_COOKIE)?.value || null;

  return NextResponse.json({ provider, recipient });
}

export async function POST(request: Request) {
  const blocked = await guard();
  if (blocked) return blocked;

  let body: { provider?: unknown; recipient?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige request body" }, { status: 400 });
  }

  const { provider, recipient } = body;

  if (provider === undefined && recipient === undefined) {
    return NextResponse.json(
      { error: "Geef minimaal provider of recipient mee." },
      { status: 400 },
    );
  }

  const store = await cookies();

  if (provider !== undefined) {
    if (provider !== "test" && provider !== "live") {
      return NextResponse.json(
        { error: 'Ongeldige provider. Kies "test" of "live".' },
        { status: 400 },
      );
    }
    store.set(EMAIL_PROVIDER_COOKIE, provider, cookieOptions);
  }

  if (recipient !== undefined) {
    if (typeof recipient === "string" && recipient.trim()) {
      store.set(EMAIL_RECIPIENT_COOKIE, recipient.trim(), cookieOptions);
    } else {
      store.delete(EMAIL_RECIPIENT_COOKIE);
    }
  }

  return NextResponse.json({
    provider:
      provider !== undefined
        ? provider
        : currentEmailProvider(store.get(EMAIL_PROVIDER_COOKIE)?.value, smtpConfigured()),
    recipient:
      recipient !== undefined
        ? typeof recipient === "string" && recipient.trim()
          ? recipient.trim()
          : null
        : store.get(EMAIL_RECIPIENT_COOKIE)?.value || null,
  });
}

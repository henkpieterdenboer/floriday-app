import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/features/auth/auth-config";
import { isDemoModeAllowed } from "@/features/environment/environment-banner";
import { updateUserRole } from "@/features/auth/users";

/*
 * Glue voor @col/demo-mode - zelf geschreven, niet 1-op-1 van het sjabloon: dat verwacht
 * `{ roles: string[] }` (een rollen-array), wij hebben één `role` per gebruiker
 * (`UserRole.ADMIN | UserRole.VIEWER`, zie prisma/schema.prisma). `demo-controls.tsx` stuurt
 * daarom `{ role }` in plaats van `{ roles }`.
 *
 * Contract: POST { role: "ADMIN" | "VIEWER" } -> 200 { success: true, role } | 400 | 401 | 404
 */

export async function POST(request: Request) {
  // 404 in plaats van 403 wanneer demo mode uit staat: een route die niet lijkt te bestaan
  // verraadt minder dan een die weigert. Dezelfde regel als de testbalk zelf
  // (`isDemoModeAllowed`, VERCEL_ENV !== "production") - bewust niet `NEXT_PUBLIC_DEMO_MODE`,
  // want die variabele reist mee naar de browser en zou van deze rolwisselaar een manier
  // maken waarop elke bezoeker zichzelf tot beheerder kan maken zodra de vlag ooit naar
  // productie lekt.
  if (!isDemoModeAllowed(process.env.VERCEL_ENV)) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige request body" }, { status: 400 });
  }

  const { role } = body;
  if (role !== UserRole.ADMIN && role !== UserRole.VIEWER) {
    return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  }

  // Schrijft naar dezelfde `User.role`-kolom als het beheerscherm (`/beheer/gebruikers`,
  // zie `features/auth/actions.ts` en `require-admin.ts`) - dit is bewust geen aparte
  // "demo-rol", het is de echte rol van de gebruiker. De lopende sessie (JWT) merkt dit pas
  // na een `useSession().update()`-aanroep, zie het commentaar in `auth-config.ts`.
  await updateUserRole(session.user.id, role);

  return NextResponse.json({ success: true, role });
}

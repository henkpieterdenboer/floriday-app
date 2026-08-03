"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher";
import { DemoEmailSwitcher } from "@/components/demo/demo-email-switcher";
import { useDemoEmail } from "@/components/demo/use-demo-email";
import { pickNewRole } from "@/features/auth/pick-new-role";

/*
 * Glue voor @col/demo-mode - eigen bestand, wordt niet overschreven door
 * `npx shadcn add @col/demo-mode --overwrite`. Componeert de rol- en e-mailwisselaar uit
 * het design system tegen ons eigen User-model (één `role`, geen rollen-array) en onze
 * eigen routes.
 */

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "VIEWER", label: "Viewer" },
];

export interface DemoControlsProps {
  /**
   * Komt van `isDemoModeAllowed(process.env.VERCEL_ENV)` in de (server) root layout.
   * Deze client-component leest `VERCEL_ENV` bewust niet zelf: die variabele is server-only
   * en mag dat ook blijven (zie het commentaar bij `isDemoModeAllowed` in
   * environment-banner.ts over waarom hier geen `NEXT_PUBLIC_`-variabele gebruikt wordt).
   */
  allowed: boolean;
}

export function DemoControls({ allowed }: DemoControlsProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const email = useDemoEmail({ enabled: allowed && Boolean(session?.user) });

  if (!allowed || !session?.user) return null;

  const currentRole = session.user.role;

  const handleRoleChange = async (roles: string[]) => {
    const role = pickNewRole(roles, currentRole);
    if (!role || role === currentRole) return;

    const res = await fetch("/api/auth/switch-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) return;

    // De rol zit in de JWT en wordt normaal alleen bij het inloggen gezet (zie
    // auth-config.ts). `update({})` - met een object, niet zonder argumenten, anders doet
    // next-auth een simpele GET die de jwt-callback niet met trigger "update" aanroept -
    // dwingt een POST naar /api/auth/session af. Dat ververst zowel de httpOnly-cookie als
    // de client-sessie in één keer, waarna router.refresh() de servercomponenten (zoals de
    // "Gebruikers"-link, die alleen voor ADMIN toont) opnieuw laat renderen met de nieuwe rol.
    await update({});
    router.refresh();
  };

  return (
    <>
      <DemoRoleSwitcher
        available={ROLE_OPTIONS}
        active={[currentRole]}
        onChange={handleRoleChange}
        labels={{ trigger: "Rol", heading: "Rol wijzigen" }}
      />
      <DemoEmailSwitcher
        provider={email.provider}
        recipient={email.recipient}
        onProviderChange={email.onProviderChange}
        onRecipientSave={email.onRecipientSave}
        testInboxUrl="https://ethereal.email/login"
        labels={{
          trigger: "E-mail",
          providerHeading: "Verzendmethode",
          testShort: "Test",
          testLong: "Testinbox (Ethereal) - niets wordt echt verstuurd",
          liveShort: "Live",
          liveLong: "Echte verzending",
          recipientHeading: "Ontvanger overschrijven",
          recipientPlaceholder: "naam@voorbeeld.nl",
          save: "Opslaan",
          saved: "Opgeslagen",
          activeRecipient: (recipientEmail) => `Alles gaat nu naar ${recipientEmail}`,
          noRecipient: "Geen overschrijving - gewone ontvangers",
        }}
      />
    </>
  );
}

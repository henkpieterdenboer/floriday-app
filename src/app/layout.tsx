import "./globals.css";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { cn } from "@/lib/utils";
import { DemoBar } from "@/components/demo/demo-bar";
import { DemoControls } from "@/components/demo/demo-controls";
import { auth } from "@/features/auth/auth-config";
import { isDemoModeAllowed, resolveBanner } from "@/features/environment/environment-banner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = { title: "Floriday Middleware" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // In de root layout en niet in de beschermde layout, zodat de balk ook op het
  // inlogscherm staat. Juist daar wil je weten of je op een testomgeving inlogt.
  const banner = resolveBanner({
    vercelEnv: process.env.VERCEL_ENV,
    floridayBaseUrl: process.env.FLORIDAY_CUSTOMERS_API_BASE_URL,
  });

  // Dezelfde regel als de balk (nooit op productie), maar als aparte functie aangeroepen
  // zodat demo-controls.tsx en de twee API-routes onder /api/auth/switch-role en
  // /api/email-provider precies dezelfde beslissing gebruiken. `session` wordt alleen
  // opgehaald wanneer die besturing sowieso al mag draaien.
  const demoModeAllowed = isDemoModeAllowed(process.env.VERCEL_ENV, process.env.VERCEL);
  const session = demoModeAllowed ? await auth() : null;

  return (
    <html lang="nl" className={cn("font-sans", geist.variable)}>
      <body>
        {banner.show && (
          <SessionProvider session={session}>
            <DemoBar message={banner.message} maxWidth="max-w-full">
              <DemoControls allowed={demoModeAllowed} />
            </DemoBar>
          </SessionProvider>
        )}
        {children}
      </body>
    </html>
  );
}

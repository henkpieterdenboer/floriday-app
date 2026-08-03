import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { DemoBar } from "@/components/demo/demo-bar";
import { resolveBanner } from "@/features/environment/environment-banner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = { title: "Floriday middleware" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // In de root layout en niet in de beschermde layout, zodat de balk ook op het
  // inlogscherm staat. Juist daar wil je weten of je op een testomgeving inlogt.
  const banner = resolveBanner({
    vercelEnv: process.env.VERCEL_ENV,
    floridayBaseUrl: process.env.FLORIDAY_CUSTOMERS_API_BASE_URL,
  });

  return (
    <html lang="nl" className={cn("font-sans", geist.variable)}>
      <body>
        {banner.show && <DemoBar message={banner.message} maxWidth="max-w-full" />}
        {children}
      </body>
    </html>
  );
}

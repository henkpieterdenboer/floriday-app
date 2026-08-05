import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth-config";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-5">
          {/* De naam staat er als merk, niet als menu-item: een streep en wat lucht erna,
              zodat het oog het onderscheid maakt zonder erover na te denken. */}
          <Link href="/status" className="font-heading text-base font-semibold tracking-tight">
            Floriday Middleware
          </Link>
          <span aria-hidden className="h-5 w-px bg-border" />
          <nav className="flex items-center gap-4 text-sm">
            {/* API-status voorop: dit is middleware, en of de koppeling loopt is de eerste
                vraag die het scherm hoort te beantwoorden. */}
            <Link href="/status" className="font-medium">
              API-status
            </Link>
            <Link href="/aanbod" className="font-medium">
              Aanbod
            </Link>
            {isAdmin ? (
              <Link href="/beheer/gebruikers" className="font-medium">
                Gebruikers
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.name}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Uitloggen
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

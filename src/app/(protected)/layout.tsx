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
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/aanbod" className="font-medium">
            Aanbod
          </Link>
          {isAdmin ? (
            <Link href="/beheer/gebruikers" className="font-medium">
              Gebruikers
            </Link>
          ) : null}
        </nav>
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

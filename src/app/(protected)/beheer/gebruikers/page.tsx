import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth-config";
import { listUsers } from "@/features/auth/users";
import { AddUserForm } from "./add-user-form";
import { UsersTable, type UserRowData } from "./users-table";

export const metadata = { title: "Gebruikers - Floriday middleware" };

function formatLastLogin(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function GebruikersPage() {
  const session = await auth();

  // Defence in depth: the middleware only checks that someone is signed in for /beheer/*, not
  // their role. Without this check a VIEWER who types the URL directly would land on the admin
  // screen (though every action underneath still independently rejects them via requireAdmin()).
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/aanbod");
  }

  const users = await listUsers();
  const rows: UserRowData[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPassword: user.passwordHash !== null,
    lastLoginAt: formatLastLogin(user.lastLoginAt),
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Gebruikers</h1>
        <p className="text-muted-foreground">
          Beheer wie toegang heeft tot het aanbodoverzicht.
        </p>
      </div>

      <AddUserForm />

      <UsersTable users={rows} />
    </div>
  );
}

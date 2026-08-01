import type { UserRole } from "@prisma/client";
import { auth } from "@/features/auth/auth-config";

export interface AdminSessionUser {
  id: string;
  role: UserRole;
}

/**
 * Every admin server action must call this first. The middleware keeps unauthenticated or
 * non-admin visitors off `/beheer/*`, but server actions are separately callable HTTP
 * endpoints - relying on the page-level guard alone leaves the door open to anyone who calls
 * the action directly. Throws rather than returning a result, so a missing check at the top of
 * an action is impossible to forget silently.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Niet toegestaan: alleen beheerders mogen dit doen.");
  }
  return { id: session.user.id, role: session.user.role };
}

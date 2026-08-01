import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normaliseEmail } from "@/features/auth/entra-linking";

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
}

/** Adressen worden genormaliseerd opgeslagen, zodat opzoeken altijd werkt. */
export async function createUser(input: CreateUserInput): Promise<User> {
  return prisma.user.create({
    data: { email: normaliseEmail(input.email), name: input.name, role: input.role },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: normaliseEmail(email) } });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
}

export async function recordLogin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function listUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
}

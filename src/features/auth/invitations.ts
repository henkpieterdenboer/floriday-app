import { prisma } from "@/lib/db";
import { hashPassword } from "@/features/auth/password";
import {
  INVITATION_LIFETIME_MS,
  createInvitationToken,
  hashInvitationToken,
  isExpired,
} from "@/features/auth/invitation-token";

export interface CreatedInvitation {
  id: string;
  /** Alleen hier beschikbaar. Gaat naar de mail en wordt nergens opgeslagen. */
  token: string;
  expiresAt: Date;
}

export async function createInvitation(userId: string): Promise<CreatedInvitation> {
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

  const invitation = await prisma.invitation.create({ data: { userId, tokenHash, expiresAt } });
  return { id: invitation.id, token, expiresAt };
}

export type RedeemResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not-found" | "already-used" | "expired" | "deactivated" };

/**
 * Wisselt een uitnodiging in voor een wachtwoord. De volgorde van controles is bewust:
 * eerst bestaan, dan gebruikt, dan verlopen, dan de toestand van het account.
 */
export async function redeemInvitation(token: string, password: string): Promise<RedeemResult> {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { user: true },
  });

  if (!invitation) return { ok: false, reason: "not-found" };
  if (invitation.usedAt) return { ok: false, reason: "already-used" };
  if (isExpired(invitation.expiresAt, new Date())) return { ok: false, reason: "expired" };
  if (!invitation.user.isActive) return { ok: false, reason: "deactivated" };

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: invitation.userId }, data: { passwordHash } }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true, userId: invitation.userId };
}

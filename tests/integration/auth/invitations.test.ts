import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createUser, findUserByEmail, setUserActive } from "@/features/auth/users";
import { createInvitation, redeemInvitation } from "@/features/auth/invitations";

const EMAIL = "test-invitation@example.test";

async function cleanup(): Promise<void> {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("users", () => {
  it("creates a user without a password", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    expect(user.passwordHash).toBeNull();
    expect(user.isActive).toBe(true);
  });

  it("finds a user case insensitively", async () => {
    await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    expect(await findUserByEmail(EMAIL.toUpperCase())).not.toBeNull();
  });

  it("stores the email in lower case", async () => {
    const user = await createUser({ email: EMAIL.toUpperCase(), name: "Test", role: "VIEWER" });
    expect(user.email).toBe(EMAIL);
  });

  it("refuses a duplicate email", async () => {
    await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    await expect(createUser({ email: EMAIL, name: "Nog een", role: "VIEWER" })).rejects.toThrow();
  });
});

describe("invitations", () => {
  it("redeems a valid invitation and sets a password", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    const { token } = await createInvitation(user.id);

    expect((await redeemInvitation(token, "een goed wachtwoord")).ok).toBe(true);
    expect((await findUserByEmail(EMAIL))?.passwordHash).not.toBeNull();
  });

  it("refuses the same token twice", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    const { token } = await createInvitation(user.id);

    await redeemInvitation(token, "eerste wachtwoord");
    expect(await redeemInvitation(token, "tweede wachtwoord"))
      .toEqual({ ok: false, reason: "already-used" });
  });

  it("refuses an expired invitation", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    const { token, id } = await createInvitation(user.id);
    await prisma.invitation.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await redeemInvitation(token, "wachtwoord")).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses an unknown token", async () => {
    expect(await redeemInvitation("bestaat-niet", "wachtwoord"))
      .toEqual({ ok: false, reason: "not-found" });
  });

  it("refuses an invitation for a deactivated user", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    const { token } = await createInvitation(user.id);
    await setUserActive(user.id, false);

    expect(await redeemInvitation(token, "wachtwoord"))
      .toEqual({ ok: false, reason: "deactivated" });
  });

  it("never stores the token itself", async () => {
    const user = await createUser({ email: EMAIL, name: "Test", role: "VIEWER" });
    const { token } = await createInvitation(user.id);

    const stored = await prisma.invitation.findMany({ where: { userId: user.id } });
    expect(stored[0].tokenHash).not.toBe(token);
    expect(stored[0].tokenHash).not.toContain(token);
  });
});

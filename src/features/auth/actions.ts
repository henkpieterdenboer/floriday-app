"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { signIn, signOut, entraEnabled } from "@/features/auth/auth-config";
import { requireAdmin } from "@/features/auth/require-admin";
import { resolveRedirectTarget } from "@/features/auth/safe-redirect";
import { createUser, setUserActive } from "@/features/auth/users";
import { createInvitation, redeemInvitation, type RedeemResult } from "@/features/auth/invitations";
import { buildInvitationMail } from "@/features/auth/emails/invitation";
import { sendMail } from "@/lib/mail";
import { getEnv } from "@/lib/env";

const GENERIC_LOGIN_ERROR = "E-mailadres of wachtwoord klopt niet.";

// ---------------------------------------------------------------------------
// Sign-in / sign-out
// ---------------------------------------------------------------------------

export interface LoginState {
  error?: string;
}

/**
 * Signs in with the credentials provider. Deliberately shows one message for every failure -
 * unknown address, wrong password, deactivated account, missing password - so the login screen
 * cannot be used to discover which addresses have an account (see `authorize` in
 * `auth-config.ts`, which already collapses those cases into a single `null`).
 */
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const verder = String(formData.get("verder") ?? "");

  if (!email || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    // redirect: false makes signIn() throw a CredentialsSignin AuthError instead of redirecting,
    // so we can show our own generic message instead of a NextAuth error page.
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    throw error;
  }

  redirect(resolveRedirectTarget(verder));
}

/** Kicks off the Entra sign-in redirect. Failures come back to /login?fout=... via the signIn callback in auth-config.ts. */
export async function entraSignInAction(formData: FormData): Promise<void> {
  const verder = String(formData.get("verder") ?? "");
  await signIn("microsoft-entra-id", { redirectTo: resolveRedirectTarget(verder) });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

// ---------------------------------------------------------------------------
// Invitation redemption
// ---------------------------------------------------------------------------

const setPasswordSchema = z
  .object({
    password: z.string().min(12, "Het wachtwoord moet minimaal twaalf tekens lang zijn."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "De wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export interface SetPasswordState {
  status: "idle" | "error" | "success";
  message?: string;
}

function redeemFailureMessage(reason: Exclude<RedeemResult, { ok: true }>["reason"]): string {
  switch (reason) {
    case "not-found":
      return "Deze uitnodiging is niet bekend.";
    case "already-used":
      return "Deze uitnodiging is al gebruikt.";
    case "expired":
      return "Deze uitnodiging is verlopen. Vraag een beheerder om een nieuwe.";
    case "deactivated":
      return "Dit account is uitgeschakeld. Neem contact op met een beheerder.";
  }
}

/**
 * Sets the password for an invited account. `token` is bound in the client component
 * (`setPasswordAction.bind(null, token)`), never read from form input, and never logged -
 * logging it would let anyone with log access redeem the invitation themselves.
 */
export async function setPasswordAction(
  token: string,
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const parsed = setPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const result = await redeemInvitation(token, parsed.data.password);

  if (!result.ok) {
    return { status: "error", message: redeemFailureMessage(result.reason) };
  }

  return { status: "success" };
}

// ---------------------------------------------------------------------------
// User administration - every action below independently checks for ADMIN via requireAdmin().
// The middleware only guards the /beheer page itself; server actions are separately callable.
// ---------------------------------------------------------------------------

async function sendInvitationMail(userId: string, email: string, name: string): Promise<string | null> {
  const invitation = await createInvitation(userId);
  const invitationUrl = `${getEnv().APP_URL}/uitnodiging/${invitation.token}`;
  const mail = buildInvitationMail({
    to: email,
    name,
    invitationUrl,
    expiresAt: invitation.expiresAt,
    entraEnabled,
  });
  return sendMail(mail);
}

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Vul een naam in."),
  email: z.string().trim().min(1, "Vul een e-mailadres in.").email("Vul een geldig e-mailadres in."),
  role: z.nativeEnum(UserRole, { message: "Kies een rol." }),
});

export interface CreateUserState {
  status: "idle" | "error" | "success";
  message?: string;
  previewUrl?: string | null;
}

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  let user;
  try {
    user = await createUser(parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "Er bestaat al een account voor dit e-mailadres." };
    }
    throw error;
  }

  const previewUrl = await sendInvitationMail(user.id, user.email, user.name);

  revalidatePath("/beheer/gebruikers");
  return { status: "success", message: `Uitnodiging verstuurd naar ${user.email}.`, previewUrl };
}

export interface ResendInvitationState {
  status: "idle" | "error" | "success";
  message?: string;
  previewUrl?: string | null;
}

export async function resendInvitationAction(
  userId: string,
  email: string,
  name: string,
  _prevState: ResendInvitationState,
  _formData: FormData,
): Promise<ResendInvitationState> {
  await requireAdmin();

  const previewUrl = await sendInvitationMail(userId, email, name);

  revalidatePath("/beheer/gebruikers");
  return { status: "success", message: `Nieuwe uitnodiging verstuurd naar ${email}.`, previewUrl };
}

export async function toggleUserActiveAction(userId: string, nextActive: boolean): Promise<void> {
  await requireAdmin();
  await setUserActive(userId, nextActive);
  revalidatePath("/beheer/gebruikers");
}

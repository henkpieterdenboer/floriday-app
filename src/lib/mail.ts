import nodemailer, { type Transporter } from "nodemailer";
import { cookies } from "next/headers";
import { getEnv, type Env } from "@/lib/env";
import { isDemoModeAllowed } from "@/features/environment/environment-banner";
import {
  EMAIL_PROVIDER_COOKIE,
  EMAIL_RECIPIENT_COOKIE,
  resolveMailRouting,
} from "@/features/environment/demo-mail-routing";

/**
 * De vorm die @col/email-shell teruggeeft. Bewust dat type en geen eigen kopie: het item is
 * er destijds op gebouwd, dus een tweede definitie zou alleen maar uit de pas kunnen lopen.
 */
import type { Mail } from "@/components/email/email-types";
export type { Mail };

/**
 * Twee mogelijke transporters (SMTP/Resend en Ethereal), elk apart gecachet. Met een vaste
 * keuze volstond één module-brede variabele; nu de e-mailschakelaar in de testbalk tussen
 * beide kan omschakelen zou die ene cache verkeerd zijn - wie van test naar live schakelt
 * (of terug) zou de vorige transporter blijven gebruiken totdat het proces herstart.
 */
const transporterCache = new Map<"resend" | "ethereal", Promise<Transporter>>();

async function createEtherealTransporter(): Promise<Transporter> {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

/**
 * Alleen aangeroepen wanneer `useResend` true is, en `resolveMailRouting` geeft dat alleen
 * terug als `smtpConfigured` ook true was - de niet-null-asserties hieronder zijn dus veilig.
 */
function createResendTransporter(env: Env): Transporter {
  return nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port: env.SMTP_PORT!,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASSWORD! },
  });
}

async function getTransporter(useResend: boolean, env: Env): Promise<Transporter> {
  const key = useResend ? "resend" : "ethereal";
  let transporter = transporterCache.get(key);
  if (!transporter) {
    transporter = useResend ? Promise.resolve(createResendTransporter(env)) : createEtherealTransporter();
    transporterCache.set(key, transporter);
  }
  return transporter;
}

/** Geeft de preview-URL terug wanneer er via Ethereal is verstuurd, anders null. */
export async function sendMail(mail: Mail): Promise<string | null> {
  const env = getEnv();
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD);

  // Cookies worden alleen gelezen wanneer de testbalk zelf ook mag draaien (dezelfde
  // VERCEL_ENV-regel als de balk). Op productie raakt mail.ts de cookies dus niet eens aan,
  // ook niet als er per ongeluk nog een demo-cookie in de browser van een beheerder staat.
  let providerCookie: string | undefined;
  let recipientCookie: string | undefined;
  if (isDemoModeAllowed(process.env.VERCEL_ENV, process.env.VERCEL)) {
    try {
      const store = await cookies();
      providerCookie = store.get(EMAIL_PROVIDER_COOKIE)?.value;
      recipientCookie = store.get(EMAIL_RECIPIENT_COOKIE)?.value;
    } catch {
      // `sendMail` wordt ook aangeroepen buiten een Next.js request om, vanuit losse
      // scripts (`npm run invite`, `npm run create-admin`) - daar bestaat geen cookiejar en
      // gooit `cookies()` "called outside a request scope". Dat is geen fout, gewoon geen
      // demo-override beschikbaar: gedraag je dan als op productie.
    }
  }

  const routing = resolveMailRouting({
    vercelEnv: process.env.VERCEL_ENV,
    onVercel: process.env.VERCEL,
    smtpConfigured,
    providerCookie,
    recipientCookie,
    to: mail.to,
    subject: mail.subject,
  });

  const transporter = await getTransporter(routing.useResend, env);

  const info = await transporter.sendMail({
    from: env.MAIL_FROM ?? "Floriday Middleware <noreply@coloriginz.com>",
    to: routing.to,
    subject: routing.subject,
    text: mail.text,
    html: mail.html,
    // Het logo reist mee als CID-bijlage; zonder deze regel toont de mail een gebroken
    // afbeelding, ook al staat de verwijzing keurig in de HTML.
    attachments: mail.attachments,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  return typeof preview === "string" ? preview : null;
}

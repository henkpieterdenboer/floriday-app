import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let cached: Transporter | null = null;

/**
 * Zonder SMTP-instellingen wordt een Ethereal-testaccount gebruikt: berichten komen dan
 * nergens echt aan, maar zijn wel via een link te bekijken. Dat voorkomt dat een halfaf
 * systeem echte mail naar collega's stuurt.
 */
async function getTransporter(): Promise<Transporter> {
  if (cached) return cached;
  const env = getEnv();

  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
    cached = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
    return cached;
  }

  const testAccount = await nodemailer.createTestAccount();
  cached = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return cached;
}

/** Geeft de preview-URL terug wanneer er via Ethereal is verstuurd, anders null. */
export async function sendMail(mail: Mail): Promise<string | null> {
  const transporter = await getTransporter();
  const env = getEnv();

  const info = await transporter.sendMail({
    from: env.MAIL_FROM ?? "Floriday middleware <noreply@coloriginz.com>",
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  return typeof preview === "string" ? preview : null;
}

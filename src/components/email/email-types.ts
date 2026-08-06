export const EMAIL_SHELL_VERSION = '1.0.0'

/* Beheerde bestanden van @col/email-shell — niet lokaal aanpassen.
   Welke versie draait deze app?  grep -rn EMAIL_SHELL_VERSION src/
   Bijwerken:                     npx shadcn add @col/email-shell --overwrite */

/** Bijlage in de vorm die nodemailer verwacht. Andere verzenders (Resend-API,
    SES) nemen dezelfde velden of vragen een triviale vertaling. */
export interface EmailAttachment {
  filename: string
  content: Buffer
  /** Waarde achter `cid:` in de img-src. Vrij te kiezen, moet uniek zijn binnen de mail. */
  cid: string
}

export interface EmailLogo extends EmailAttachment {
  width: number
  height: number
}

export interface EmailBrand {
  name: string
  logo: EmailLogo
  /** Knopvlak. Multi-merk: `emailAccents[label].accent` uit @col/brand-tokens. */
  accent: string
  accentContrast: string
  /** Streepje bovenaan de kaart. */
  rule: string
  /** Merkregel onderaan, bv. "Coloríginz — OZ Import BV, Aalsmeer". */
  footerText: string
}

export type EmailBlock =
  // de kop van de mail, één per bericht
  | { kind: 'heading'; text: string }
  // gewone alinea
  | { kind: 'paragraph'; text: string }
  // de aanroep tot actie; wordt een Outlook-vaste VML-knop
  | { kind: 'button'; label: string; href: string }
  // een passcode of referentie, groot en gespatieerd weergegeven
  | { kind: 'code'; value: string; label?: string }
  // kleine, gedempte regel, bijvoorbeeld een geldigheidsdatum
  | { kind: 'note'; text: string }
  // noodluik voor iets wat de blokken niet dekken; beide varianten verplicht,
  // zodat de platte tekst niet kan ontbreken
  | { kind: 'raw'; html: string; text: string }

export interface EmailShellStrings {
  /** Waarde voor het lang-attribuut van <html>. */
  lang: string
  /** Vaste slotzin, bv. "Dit bericht is automatisch gegenereerd." */
  footerNote: string
}

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
  attachments: EmailAttachment[]
}

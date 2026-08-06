import { emailButton } from './email-button'
import { assertHexColour, assertSafeUrl, escapeHtml, wrapText } from './email-html'
import { emailShellStringsNl } from './email-strings'
import type { EmailBlock, EmailBrand, EmailShellStrings, Mail } from './email-types'

/* Beheerd bestand van @col/email-shell — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/email-shell --overwrite

   Waarom blokken en geen HTML-string: de HTML en het text/plain-deel komen uit
   dezelfde bron, dus ze kunnen niet uit de pas lopen, en escaping kan niet
   vergeten worden. Zie docs/items/email-shell.md.

   Donkere modus is niet oplosbaar. Apple Mail en Outlook.com draaien kleuren om
   en negeren prefers-color-scheme in mail. `color-scheme: light` plus een
   expliciete achtergrondkleur op elk element is wat wél helpt. */

/** Voor elk merk gelijk — de romp van een mail is geen merkdrager. */
export const emailNeutrals = {
  background: '#f2f2f2',
  surface: '#ffffff',
  border: '#e5e5e5',
  text: '#111111',
  muted: '#666666',
} as const

export interface BuildEmailInput {
  to: string
  subject: string
  brand: EmailBrand
  blocks: EmailBlock[]
  /** Standaard Nederlands. Geef je eigen vertaling mee als je app er al een heeft. */
  strings?: EmailShellStrings
}

export function buildEmail({ to, subject, brand, blocks, strings }: BuildEmailInput): Mail {
  if (blocks.length === 0) {
    throw new Error('buildEmail: blocks is leeg — een mail zonder inhoud is altijd een fout')
  }
  assertHexColour(brand.accent, 'brand.accent')
  assertHexColour(brand.accentContrast, 'brand.accentContrast')
  assertHexColour(brand.rule, 'brand.rule')
  const teksten = strings ?? emailShellStringsNl

  return {
    to,
    subject,
    html: rendertHtml(brand, blocks, teksten, subject),
    text: rendertTekst(brand, blocks, teksten),
    attachments: [
      { filename: brand.logo.filename, content: brand.logo.content, cid: brand.logo.cid },
    ],
  }
}

// Bewust geen default: een nieuwe EmailBlock-variant moet hier stuklopen, in
// zowel de HTML- als de tekstrenderer. Een default zou er stilzwijgend een
// lege string van maken en de twee uit elkaar laten lopen.
function blokHtml(blok: EmailBlock, brand: EmailBrand): string {
  switch (blok.kind) {
    case 'heading':
      return `<h1 style="margin:0 0 12px 0;font-size:19px;font-weight:bold;line-height:1.3;color:${emailNeutrals.text};">${escapeHtml(blok.text)}</h1>`
    case 'paragraph':
      return `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:${emailNeutrals.text};">${escapeHtml(blok.text)}</p>`
    case 'button':
      return emailButton({
        href: blok.href,
        label: blok.label,
        accent: brand.accent,
        accentContrast: brand.accentContrast,
      })
    case 'code':
      return [
        blok.label
          ? `<p style="margin:0 0 4px 0;font-size:12px;color:${emailNeutrals.muted};">${escapeHtml(blok.label)}</p>`
          : '',
        `<p style="margin:0 0 16px 0;font-size:24px;font-weight:bold;letter-spacing:0.3em;font-family:'Courier New',Courier,monospace;color:${emailNeutrals.text};">${escapeHtml(blok.value)}</p>`,
      ]
        .filter(Boolean)
        .join('\n')
    case 'note':
      return `<p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:${emailNeutrals.muted};">${escapeHtml(blok.text)}</p>`
    case 'raw':
      return blok.html
  }
}

// Bewust geen default: een nieuwe EmailBlock-variant moet hier stuklopen, in
// zowel de HTML- als de tekstrenderer. Een default zou er stilzwijgend een
// lege string van maken en de twee uit elkaar laten lopen.
function blokTekst(blok: EmailBlock): string {
  switch (blok.kind) {
    case 'heading':
      return blok.text.toUpperCase()
    case 'paragraph':
      return wrapText(blok.text)
    case 'button':
      return `${blok.label}:\n${assertSafeUrl(blok.href)}`
    case 'code':
      return blok.label ? `${blok.label}: ${blok.value}` : blok.value
    case 'note':
      return wrapText(blok.text)
    case 'raw':
      return blok.text
  }
}

function rendertHtml(
  brand: EmailBrand,
  blocks: EmailBlock[],
  strings: EmailShellStrings,
  subject: string,
): string {
  const inhoud = blocks.map((blok) => blokHtml(blok, brand)).join('\n          ')

  return `<!DOCTYPE html>
<html lang="${escapeHtml(strings.lang)}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<title>${escapeHtml(subject)}</title>
</head>
<body bgcolor="${emailNeutrals.background}" style="margin:0;padding:0;background-color:${emailNeutrals.background};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${emailNeutrals.background}" style="background-color:${emailNeutrals.background};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" bgcolor="${emailNeutrals.surface}" style="width:560px;max-width:560px;background-color:${emailNeutrals.surface};border:1px solid ${emailNeutrals.border};border-radius:8px;">
        <tr>
          <td bgcolor="${brand.rule}" style="height:4px;line-height:4px;font-size:0;background-color:${brand.rule};border-radius:8px 8px 0 0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 28px 16px 28px;">
            <img src="cid:${escapeHtml(brand.logo.cid)}" alt="${escapeHtml(brand.name)}" width="${brand.logo.width}" height="${brand.logo.height}" style="display:block;width:${brand.logo.width}px;height:${brand.logo.height}px;border:0;">
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;">
          ${inhoud}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px 20px 28px;border-top:1px solid ${emailNeutrals.border};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:${emailNeutrals.muted};">
            ${escapeHtml(brand.footerText)}<br>${escapeHtml(strings.footerNote)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function rendertTekst(
  brand: EmailBrand,
  blocks: EmailBlock[],
  strings: EmailShellStrings,
): string {
  const inhoud = blocks.map(blokTekst).filter((deel) => deel !== '')
  // Bewust '--' en niet '-- ': dat laatste is de echte signature-conventie en
  // sommige clients vouwen zo'n blok op. De merkregel en de slotzin moeten
  // zichtbaar blijven.
  return [...inhoud, '--', `${brand.footerText}\n${strings.footerNote}`].join('\n\n')
}

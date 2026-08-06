import type { EmailShellStrings } from './email-types'

/* Beheerd bestand van @col/email-shell — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/email-shell --overwrite

   Twee sets zijn geen vertaalsysteem. Heeft je app er al een, geef dan je eigen
   vertaalde strings mee aan buildEmail() en negeer deze. */

export const emailShellStringsNl: EmailShellStrings = {
  lang: 'nl',
  footerNote: 'Dit bericht is automatisch gegenereerd.',
}

export const emailShellStringsEn: EmailShellStrings = {
  lang: 'en',
  footerNote: 'This message was generated automatically.',
}

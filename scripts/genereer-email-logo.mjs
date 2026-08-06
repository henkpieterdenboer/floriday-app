import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

/**
 * Schrijft public/brand/logos/coloriginz.png weg als base64-constante in
 * src/features/auth/emails/logo-base64.ts.
 *
 *   node scripts/genereer-email-logo.mjs
 *
 * Waarom een constante in code en niet `fs.readFileSync('public/...')` op het
 * moment van versturen: Vercel serverless functions kunnen public/ niet
 * betrouwbaar van de schijf lezen. Dat levert op productie een mail zonder
 * logo, en dat merk je niet lokaal en niet in de tests — alleen bij een echte
 * ontvanger. Zie docs/items/email-shell.md in het design system.
 *
 * Het bronbestand is 1280x319 (60 kB); de mail toont het op 160x40. We schalen
 * naar 320x80 — twee keer de weergavemaat, zodat het scherp blijft op een
 * hi-dpi scherm — en houden zo zowel het broncodebestand als de bijlage klein.
 *
 * Draai dit opnieuw na `node scripts/pull-brand-assets.mjs` als het logo in het
 * design system verandert.
 */

const BRON = join(process.cwd(), 'public', 'brand', 'logos', 'coloriginz.png')
const DOEL = join(process.cwd(), 'src', 'features', 'auth', 'emails', 'logo-base64.ts')

const BREEDTE = 320
const HOOGTE = 80

const geschaald = await sharp(readFileSync(BRON))
  .resize(BREEDTE, HOOGTE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer()

const base64 = geschaald.toString('base64')
const regels = []
for (let i = 0; i < base64.length; i += 96) regels.push(`  "${base64.slice(i, i + 96)}"`)

writeFileSync(
  DOEL,
  `/**
 * Het Coloríginz-logo als base64, gegenereerd door scripts/genereer-email-logo.mjs.
 * Niet met de hand bewerken.
 *
 * Staat in code en niet in public/: Vercel serverless functions kunnen public/ niet
 * betrouwbaar van de schijf lezen, dus \`fs.readFileSync\` op verzendmoment levert op
 * productie een mail zonder logo - lokaal en in de tests onzichtbaar.
 *
 * ${BREEDTE}x${HOOGTE} pixels, weergegeven op ${BREEDTE / 2}x${HOOGTE / 2}: twee keer de
 * weergavemaat, zodat het scherp blijft op een hi-dpi scherm.
 */
export const EMAIL_LOGO_BREEDTE = ${BREEDTE / 2};
export const EMAIL_LOGO_HOOGTE = ${HOOGTE / 2};

export const EMAIL_LOGO_BASE64 =
${regels.join(' +\n')};
`,
)

console.log(`${DOEL}\n  ${geschaald.length} bytes png, ${base64.length} tekens base64`)

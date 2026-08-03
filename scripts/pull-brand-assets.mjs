import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

/**
 * Haalt de merkassets uit het design system naar public/brand/.
 *
 *   node scripts/pull-brand-assets.mjs
 *
 * Bewust een losse actie, geen build-stap: zo zie je in `git diff` wanneer een
 * logo verandert, en blijft de app werken als het design system onbereikbaar is.
 *
 * Deze toelichting staat onder de imports omdat de shadcn CLI alles strípt wat
 * vóór het eerste statement staat.
 */

const BRON = process.env.BRAND_ASSETS_URL ?? 'https://design-system.apps.coloriginz.com/assets'
const DOEL = join(process.cwd(), 'public', 'brand')

const manifest = await (await fetch(`${BRON}/manifest.json`)).json()
let opgehaald = 0
let overgeslagen = 0

for (const bestand of manifest.files) {
  const doel = join(DOEL, bestand.path)

  if (existsSync(doel) && readFileSync(doel).length === bestand.bytes) {
    overgeslagen++
    continue
  }

  const res = await fetch(`${BRON}/${bestand.path}`)
  if (!res.ok) {
    console.error(`  MISLUKT  ${bestand.path} (HTTP ${res.status})`)
    process.exitCode = 1
    continue
  }

  mkdirSync(dirname(doel), { recursive: true })
  writeFileSync(doel, Buffer.from(await res.arrayBuffer()))
  console.log(`  opgehaald  ${bestand.path}`)
  opgehaald++
}

console.log(`\n${opgehaald} opgehaald, ${overgeslagen} ongewijzigd. Controleer met git diff.`)

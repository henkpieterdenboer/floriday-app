const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

/* Beheerd bestand van @col/email-shell — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/email-shell --overwrite */

/** Escapet tekst voor gebruik in HTML. De ampersand moet als eerste, anders
    ontstaan er dubbele entities. Verwacht ruwe, ongeëscapete tekst — voer je
    hier iets in dat al geëscaped is, dan ontstaat dubbele escaping
    (`&amp;` wordt `&amp;amp;`). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Controleert het protocol en geeft de genormaliseerde URL terug, onbewerkt.
    Gooit bij alles wat geen http/https/mailto is — een `javascript:`-link in een
    mail is altijd een fout, nooit een bedoeling. Gebruik dit voor het
    text/plain-deel; voor een href-attribuut is `hrefAttribute` de juiste. */
export function assertSafeUrl(href: string): string {
  let ontleed: URL
  try {
    ontleed = new URL(href)
  } catch {
    throw new Error(`Ongeldige URL in e-mail: ${href}`)
  }
  if (!ALLOWED_PROTOCOLS.includes(ontleed.protocol)) {
    throw new Error(`Protocol ${ontleed.protocol} is niet toegestaan in e-mail`)
  }
  return ontleed.href
}

/** Gevalideerd én geëscaped, klaar om tussen dubbele aanhalingstekens in een
    href te zetten. Het resultaat hoort niet in platte tekst thuis. */
export function hrefAttribute(href: string): string {
  return escapeHtml(assertSafeUrl(href))
}

/** Kleuren komen als gewone string binnen en het typesysteem houdt een
    oklch()-waarde niet tegen. Dat zou pas opvallen als een Outlook-ontvanger een
    zwarte knop krijgt — te laat en te ver van de oorzaak. Elke publieke ingang
    controleert daarom zelf, ook al betekent dat soms dubbel werk. */
export function assertHexColour(value: string, veld: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(
      `${veld} moet een hexkleur zijn (#rrggbb), niet "${value}" — e-mailclients kunnen oklch() niet aan`,
    )
  }
  return value
}

/** Breekt een alinea af voor het text/plain-deel. Splitst op alle whitespace,
    dus eventuele newlines in de invoer worden ook opgevouwen — prima voor een
    losse alinea, een valkuil als je meerdere alinea's in één keer doorgeeft.
    Een woord dat zelf langer is dan de breedte — een uitnodigingslink
    bijvoorbeeld — blijft heel. */
export function wrapText(value: string, breedte = 72): string {
  const regels: string[] = []
  let huidig = ''
  for (const woord of value.split(/\s+/).filter(Boolean)) {
    if (huidig === '') huidig = woord
    else if (huidig.length + 1 + woord.length <= breedte) huidig += ` ${woord}`
    else {
      regels.push(huidig)
      huidig = woord
    }
  }
  if (huidig !== '') regels.push(huidig)
  return regels.join('\n')
}

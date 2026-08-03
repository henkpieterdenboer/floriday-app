import * as React from 'react'

/* Beheerd bestand van @col/brand-logo — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/brand-logo --overwrite */

export const BRAND_LOGO_VERSION = '1.1.0'

export interface BrandLogoProps {
  src: string
  alt: string
  /**
   * De eerste drie zijn voor een donkere ondergrond, meestal een foto:
   *   round  — rond geclipt, voor logo's die al een cirkel zijn
   *   mono   — eenkleurig logo, geforceerd naar wit
   *   colour — meerkleurig logo, op een witte schijf met eigen kleuren
   *
   * En één voor een lichte ondergrond, zoals een kaart:
   *   plain  — het logo zoals het is, zonder enige bewerking
   */
  variant: 'round' | 'mono' | 'colour' | 'plain'
  /** Tailwind height class. Default 'h-24'. */
  size?: string
}

/**
 * Toont een merklogo in een van vier behandelingen.
 *
 * Pas de invert-filter nooit toe op een meerkleurig logo: dat maakt van elke
 * vorm één wit silhouet, en een JPEG zonder transparantie wordt een wit blok.
 * Vandaar de aparte 'colour'-variant met een witte schijf eronder.
 *
 * Op een lichte ondergrond werkt geen van die drie: 'mono' zou een wit logo op
 * wit opleveren en 'colour' een witte schijf op een witte kaart. Gebruik daar
 * 'plain'.
 */
export function BrandLogo({ src, alt, variant, size = 'h-24' }: BrandLogoProps) {
  if (variant === 'round') {
    return <img src={src} alt={alt} className={`${size} w-auto rounded-full`} />
  }

  if (variant === 'mono') {
    return <img src={src} alt={alt} className={`${size} w-auto brightness-0 invert`} />
  }

  if (variant === 'plain') {
    return <img src={src} alt={alt} className={`${size} w-auto`} />
  }

  // De schijf is ruim genoeg voor zowel een vierkant als een breed logo.
  return (
    <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-lg">
      <img src={src} alt={alt} className="max-h-24 max-w-28 object-contain" />
    </div>
  )
}

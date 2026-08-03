import * as React from 'react'

/* Beheerd bestand van @col/auth-shell — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/auth-shell --overwrite */

export const AUTH_SHELL_VERSION = '1.0.0'

const OVERLAYS = {
  none: '',
  light: 'bg-black/30',
  medium: 'bg-black/40',
  strong: 'bg-black/60',
} as const

export interface AuthShellProps {
  /** Pad of URL van de achtergrondafbeelding. */
  backgroundImage: string
  /** Donkerte van de laag over de foto. Default 'medium'. */
  overlay?: keyof typeof OVERLAYS
  /**
   * 'center' voor een kaart midden op het scherm, 'top' voor een lange,
   * scrollende pagina. Default 'center'.
   */
  align?: 'center' | 'top'
  /** 'fixed' laat de achtergrond staan tijdens scrollen. Default 'scroll'. */
  backgroundAttachment?: 'scroll' | 'fixed'
  /** Tailwind max-width class voor de inhoud. Default 'max-w-md'. */
  maxWidth?: string
  /** Extra classes op de buitenste container, voor app-eigen scopes. */
  className?: string
  children?: React.ReactNode
}

/**
 * Volledig scherm met een foto als achtergrond, een donkere laag daarover en
 * de inhoud gecentreerd of vanaf boven.
 *
 * De overlay is `absolute` binnen deze container, niet `fixed` — anders
 * verduistert hij ook wat er bóven dit scherm staat, zoals een demobalk.
 */
export function AuthShell({
  backgroundImage,
  overlay = 'medium',
  align = 'center',
  backgroundAttachment = 'scroll',
  maxWidth = 'max-w-md',
  className = '',
  children,
}: AuthShellProps) {
  const uitlijning =
    align === 'center' ? 'flex items-center justify-center' : 'flex flex-col items-center'

  return (
    <div
      className={`relative min-h-screen px-4 py-8 ${uitlijning} ${className}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment,
      }}
    >
      {overlay !== 'none' && (
        <div className={`pointer-events-none absolute inset-0 ${OVERLAYS[overlay]}`} />
      )}
      <div className={`relative z-10 w-full ${maxWidth}`}>{children}</div>
    </div>
  )
}

import * as React from 'react'

/* Beheerd bestand van @col/demo-mode — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/demo-mode --overwrite */

export interface DemoBarProps {
  /** Tekst in het midden van de balk. */
  message: string
  /** Tailwind max-width class voor de binnencontainer. */
  maxWidth?: string
  /** Controls, rechts uitgelijnd. */
  children?: React.ReactNode
}

export function DemoBar({ message, maxWidth = 'max-w-6xl', children }: DemoBarProps) {
  return (
    <div className="border-b border-demo-border bg-demo-bg px-4 py-1 text-sm font-medium text-demo-fg">
      <div className={`mx-auto flex items-center gap-4 px-4 ${maxWidth}`}>
        <div className="flex-1" />
        <span>{message}</span>
        <div className="flex-1" />
        {children}
      </div>
    </div>
  )
}

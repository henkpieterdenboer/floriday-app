'use client'

import * as React from 'react'
import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DemoEmailProvider, DemoEmailSwitcherLabels } from './demo-types'

/* Beheerd bestand van @col/demo-mode — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/demo-mode --overwrite */

export type { DemoEmailProvider, DemoEmailSwitcherLabels }

export interface DemoEmailSwitcherProps {
  provider: DemoEmailProvider
  recipient: string | null
  onProviderChange: (p: DemoEmailProvider) => void | boolean | Promise<void | boolean>
  onRecipientSave: (email: string | null) => void | boolean | Promise<void | boolean>
  /** Externe link naar de testinbox. Weggelaten = geen linkicoon. */
  testInboxUrl?: string
  labels: DemoEmailSwitcherLabels
}

export function DemoEmailSwitcher({
  provider,
  recipient,
  onProviderChange,
  onRecipientSave,
  testInboxUrl,
  labels,
}: DemoEmailSwitcherProps) {
  const [draft, setDraft] = React.useState(recipient ?? '')
  const [lastRecipient, setLastRecipient] = React.useState(recipient)
  const [justSaved, setJustSaved] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Synchroniseert het invoerveld wanneer de ouder een nieuw adres levert.
  // Setstate tijdens render van hetzelfde component is de door React
  // aanbevolen vorm; een useEffect zou react-hooks/set-state-in-effect raken.
  if (recipient !== lastRecipient) {
    setLastRecipient(recipient)
    setDraft(recipient ?? '')
  }

  React.useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  const handleSave = async () => {
    let ok = true
    try {
      ok = (await onRecipientSave(draft.trim() || null)) !== false
    } catch {
      ok = false
    }
    if (!ok) return
    setJustSaved(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-6 items-center gap-1.5 bg-demo-control-bg border-demo-control-border hover:bg-demo-control-bg-hover" />}><span className="text-[11px] text-demo-control-fg">{labels.trigger}</span><Badge
                      variant="outline"
                      className={`text-[10px] px-1 py-0 ${
                        provider === 'live'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {provider === 'live' ? labels.liveShort : labels.testShort}
                    </Badge><ChevronDown className="h-2.5 w-2.5 text-demo-control-fg" /></DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          {labels.providerHeading}
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onProviderChange('test')}
          className={`cursor-pointer ${provider === 'test' ? 'bg-accent font-medium' : ''}`}
        >
          <div className="flex items-center gap-2 w-full">
            {provider === 'test' ? <Check className="h-4 w-4" /> : <div className="w-4" />}
            <span className="flex-1">{labels.testLong}</span>
            {testInboxUrl && (
              <a
                href={testInboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onProviderChange('live')}
          className={`cursor-pointer ${provider === 'live' ? 'bg-accent font-medium' : ''}`}
        >
          <div className="flex items-center gap-2 w-full">
            {provider === 'live' ? <Check className="h-4 w-4" /> : <div className="w-4" />}
            {labels.liveLong}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          {labels.recipientHeading}
        </div>
        <div className="px-2 pb-2">
          <Input
            type="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={labels.recipientPlaceholder}
            aria-label={labels.recipientHeading}
            className="h-8 text-xs"
            // Zonder dit vult de browser het adres ook in andere velden op de
            // pagina in; een demo-besturingselement hoort buiten autofill te blijven.
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            // Zonder dit kaapt het dropdownmenu de toetsaanslagen.
            onKeyDown={(e) => e.stopPropagation()}
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-1.5 h-7 text-xs"
            onClick={handleSave}
          >
            {justSaved ? labels.saved : labels.save}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {recipient ? labels.activeRecipient(recipient) : labels.noRecipient}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

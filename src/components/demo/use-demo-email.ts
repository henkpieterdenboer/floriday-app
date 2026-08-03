'use client'

import * as React from 'react'
import type { DemoEmailProvider } from './demo-types'

/* Beheerd bestand van @col/demo-mode — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/demo-mode --overwrite */

export type { DemoEmailProvider }

function parseProvider(value: unknown, fallback: DemoEmailProvider): DemoEmailProvider {
  return value === 'test' || value === 'live' ? value : fallback
}

function parseRecipient(value: unknown, fallback: string | null): string | null {
  return typeof value === 'string' || value === null ? value : fallback
}

export interface UseDemoEmailOptions {
  /** Zet op false om elk verzoek achterwege te laten. Default true. */
  enabled?: boolean
  /** Endpoint dat het contract implementeert. */
  endpoint?: string
}

export interface UseDemoEmailResult {
  provider: DemoEmailProvider
  recipient: string | null
  onProviderChange: (p: DemoEmailProvider) => Promise<boolean>
  onRecipientSave: (email: string | null) => Promise<boolean>
}

/**
 * Praat met het demo-mail-endpoint:
 *   GET  -> { provider: 'test' | 'live', recipient: string | null }
 *   POST { provider?, recipient? } -> zelfde vorm
 *
 * Fouten worden bewust stil geslikt: de demobalk is een hulpmiddel en
 * mag de applicatie nooit blokkeren.
 */
export function useDemoEmail(options: UseDemoEmailOptions = {}): UseDemoEmailResult {
  const { enabled = true, endpoint = '/api/email-provider' } = options

  const [provider, setProvider] = React.useState<DemoEmailProvider>('test')
  const [recipient, setRecipient] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false

    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setProvider((prev) => parseProvider(data.provider, prev))
        if (data.recipient !== undefined) {
          setRecipient((prev) => parseRecipient(data.recipient, prev))
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [enabled, endpoint])

  const post = React.useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        return res.ok ? await res.json() : null
      } catch {
        return null
      }
    },
    [endpoint]
  )

  const onProviderChange = React.useCallback(
    async (p: DemoEmailProvider) => {
      const data = await post({ provider: p })
      if (!data) return false
      setProvider(parseProvider(data.provider, p))
      return true
    },
    [post]
  )

  const onRecipientSave = React.useCallback(
    async (email: string | null) => {
      const data = await post({ recipient: email })
      if (!data) return false
      setRecipient(parseRecipient(data.recipient, email))
      return true
    },
    [post]
  )

  return { provider, recipient, onProviderChange, onRecipientSave }
}

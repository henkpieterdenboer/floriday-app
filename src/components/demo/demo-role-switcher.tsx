'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { nextRoles } from './roles'
import type { DemoRole } from './demo-types'

/* Beheerd bestand van @col/demo-mode — niet lokaal aanpassen.
   Bijwerken: npx shadcn add @col/demo-mode --overwrite */

export type { DemoRole }

export interface DemoRoleSwitcherProps {
  available: DemoRole[]
  active: string[]
  onChange: (roles: string[]) => void | Promise<void>
  /** Minimaal actief te houden rollen. Default 1. */
  minRoles?: number
  disabled?: boolean
  labels: { trigger: string; heading: string }
}

export function DemoRoleSwitcher({
  available,
  active,
  onChange,
  minRoles = 1,
  disabled = false,
  labels,
}: DemoRoleSwitcherProps) {
  const [isChanging, setIsChanging] = React.useState(false)

  const toggle = async (value: string) => {
    if (isChanging || disabled) return
    const next = nextRoles(active, value, minRoles)
    if (next === null) return
    setIsChanging(true)
    try {
      await onChange(next)
    } finally {
      setIsChanging(false)
    }
  }

  const activeRoles = available.filter((r) => active.includes(r.value))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-6 items-center gap-1.5 bg-demo-control-bg border-demo-control-border hover:bg-demo-control-bg-hover" disabled={disabled || isChanging} />}><span className="text-[11px] text-demo-control-fg">{labels.trigger}</span><div className="flex gap-0.5">
                      {activeRoles.map((role) => (
                        <Badge key={role.value} variant="outline" className="text-[10px] px-1 py-0">
                          {role.label}
                        </Badge>
                      ))}
                    </div><ChevronDown className="h-2.5 w-2.5 text-demo-control-fg" /></DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          {labels.heading}
        </div>
        <DropdownMenuSeparator />
        {available.map((role) => (
          <DropdownMenuCheckboxItem
            key={role.value}
            checked={active.includes(role.value)}
            // Houdt het menu open zodat meerdere rollen aangevinkt kunnen worden.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(role.value)}
            className={`cursor-pointer ${
              active.includes(role.value) ? 'bg-accent text-accent-foreground font-medium' : ''
            }`}
          >
            {role.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

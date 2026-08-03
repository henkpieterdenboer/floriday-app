export const DEMO_MODE_VERSION = '1.0.1'

/* Beheerde bestanden van @col/demo-mode — niet lokaal aanpassen.
   Welke versie draait deze app?  grep -rn DEMO_MODE_VERSION src/
   Bijwerken:                     npx shadcn add @col/demo-mode --overwrite */

/** Eén selecteerbare rol in de demobalk. */
export interface DemoRole {
  value: string
  label: string
}

/** Welke mailroute de app gebruikt: een testinbox of echte verzending. */
export type DemoEmailProvider = 'test' | 'live'

/** Alle teksten van DemoEmailSwitcher. De app levert ze aan; het component
    kent geen vertaalsysteem. */
export interface DemoEmailSwitcherLabels {
  trigger: string
  providerHeading: string
  testShort: string
  testLong: string
  liveShort: string
  liveLong: string
  recipientHeading: string
  recipientPlaceholder: string
  save: string
  saved: string
  activeRecipient: (email: string) => string
  noRecipient: string
}

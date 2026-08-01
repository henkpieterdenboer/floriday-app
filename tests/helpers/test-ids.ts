/**
 * Zet een echt id om naar een testvariant.
 *
 * Waarom dit bestaat: de fixtures bevatten echte records uit Floriday, en die records
 * staan ook in het archief. Integratietests die op die id's opruimen, verwijderen dus
 * echte aanbodregels. Dat is een keer gebeurd - 25 regels weg na een gewone testrun,
 * zonder dat iets waarschuwde.
 *
 * De omzetting vervangt alleen het eerste blok van de UUID. Het resultaat blijft een
 * geldige UUID, is deterministisch (dus opnieuw draaien ruimt zijn eigen rijen op), en
 * botst niet met echte data: geen enkel id in SupplyLine, TradeItem of Organization
 * begint met ffffffff.
 */
export function toTestId(realId: string): string {
  return `ffffffff-${realId.slice(9)}`;
}

/** Handig voor een lijst ids ineens. */
export function toTestIds(realIds: readonly string[]): string[] {
  return realIds.map(toTestId);
}

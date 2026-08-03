/**
 * Kiest, uit het resultaat van `DemoRoleSwitcher.onChange`, welke rol de gebruiker net
 * heeft aangeklikt.
 *
 * `DemoRoleSwitcher` is gebouwd voor een rollen-array (`roles.ts`, beheerd): `nextRoles`
 * voegt een nieuw aangevinkte rol toe aan het *einde* van de al actieve rollen, het
 * vervangt niets. Met precies één actieve rol en `minRoles = 1` levert een klik op de
 * andere rol dus `[huidigeRol, nieuweRol]` op - "gewoon het eerste element pakken" geeft
 * dan de ongewijzigde rol terug. Dit pakt in plaats daarvan het element dat afwijkt van de
 * huidige rol, ongeacht de volgorde waarin het component ze aanlevert.
 */
export function pickNewRole(roles: string[], currentRole: string): string | undefined {
  return roles.find((role) => role !== currentRole) ?? roles[0];
}

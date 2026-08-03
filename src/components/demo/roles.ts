export function nextRoles(
  active: string[],
  value: string,
  minRoles: number
): string[] | null {
  const isActive = active.includes(value)
  if (isActive && active.length <= minRoles) return null
  return isActive ? active.filter((r) => r !== value) : [...active, value]
}

import { prisma } from "@/lib/db";
import {
  INTERVAL_SLEUTEL,
  STANDAARD_INTERVAL,
  isGeldigInterval,
} from "@/features/sync-status/interval";

/**
 * Het lezen en schrijven van het synchronisatie-interval.
 *
 * Apart van interval.ts omdat dit Prisma aanraakt en die constanten ook in een client
 * component nodig zijn - zie de toelichting daar.
 */

/** Valt terug op de standaard bij een ontbrekende, lege of onzinnige waarde. */
export async function leesInterval(): Promise<number> {
  const rij = await prisma.appSetting.findUnique({ where: { key: INTERVAL_SLEUTEL } });
  if (rij === null) return STANDAARD_INTERVAL;

  const getal = Number(rij.value);
  return isGeldigInterval(getal) ? getal : STANDAARD_INTERVAL;
}

export async function schrijfInterval(minuten: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: INTERVAL_SLEUTEL },
    create: { key: INTERVAL_SLEUTEL, value: String(minuten) },
    update: { value: String(minuten) },
  });
}

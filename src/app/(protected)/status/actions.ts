"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/features/auth/auth-config";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { isSyncEnabled, SYNC_DISABLED_MESSAGE } from "@/features/floriday/sync-enabled";
import {
  beschrijfInterval,
  isGeldigInterval,
  MAXIMUM_INTERVAL,
  MINIMUM_INTERVAL,
} from "@/features/sync-status/interval";
import { schrijfInterval } from "@/features/sync-status/interval-store";

export interface VerversStand {
  status: "idle" | "klaar" | "fout" | "uit";
  bericht?: string;
}

/**
 * Hoeveel pagina's één klik hoogstens ophaalt.
 *
 * Dezelfde grens als de geplande taak. Normaal is er weinig nieuw en stopt de run na één
 * pagina; deze grens is er voor het geval iemand op de knop drukt terwijl er een grote
 * achterstand staat, zodat het verzoek niet in een time-out loopt. De volgende klik of de
 * volgende cyclus haalt de rest op.
 */
const MAX_PAGINAS = 20;

/**
 * Synchroniseert nu, op verzoek van een ingelogde gebruiker.
 *
 * Bewust zonder rolcontrole: dit haalt alleen op wat de geplande taak toch al elke vijf
 * minuten ophaalt, verandert niets bij Floriday en is idempotent. Wie het scherm mag zien,
 * mag het verversen.
 */
export interface IntervalStand {
  status: "idle" | "klaar" | "fout";
  bericht?: string;
}

/**
 * Zet hoe vaak er werkelijk gesynchroniseerd wordt.
 *
 * Alleen voor beheerders, anders dan de verversknop: dit verandert het gedrag van de
 * geplande taak voor iedereen en blijft staan, terwijl verversen een eenmalige actie is die
 * niets achterlaat.
 */
export async function zetIntervalAction(
  _vorige: IntervalStand,
  formData: FormData,
): Promise<IntervalStand> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { status: "fout", bericht: "Alleen een beheerder kan dit wijzigen." };
  }

  const minuten = Number(formData.get("minuten"));
  if (!isGeldigInterval(minuten)) {
    return {
      status: "fout",
      bericht: `Vul een heel getal van ${MINIMUM_INTERVAL} tot ${MAXIMUM_INTERVAL} minuten in.`,
    };
  }

  await schrijfInterval(minuten);
  revalidatePath("/status");
  return { status: "klaar", bericht: `Opgeslagen: ${beschrijfInterval(minuten)}.` };
}

export async function ververseNuAction(): Promise<VerversStand> {
  const session = await auth();
  if (!session?.user) {
    return { status: "fout", bericht: "Niet aangemeld." };
  }

  if (!isSyncEnabled()) {
    return { status: "uit", bericht: SYNC_DISABLED_MESSAGE };
  }

  try {
    const resultaat = await runSupplySync({ trigger: "MANUAL", maxPages: MAX_PAGINAS });
    revalidatePath("/status");

    const bericht =
      resultaat.rowsProcessed === 0
        ? "Niets nieuws: het archief was al bij."
        : `${resultaat.rowsProcessed.toLocaleString("nl-NL")} regels opgehaald, ` +
          `${resultaat.versionsAdded.toLocaleString("nl-NL")} nieuwe versies.`;

    return { status: "klaar", bericht };
  } catch (error: unknown) {
    // De pagina toont de mislukte run zelf ook in het overzicht; deze melding is er voor
    // wie net op de knop drukte en meteen wil weten wat er gebeurde.
    return {
      status: "fout",
      bericht: error instanceof Error ? error.message : String(error),
    };
  }
}

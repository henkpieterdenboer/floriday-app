"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/features/auth/auth-config";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { isSyncEnabled, SYNC_DISABLED_MESSAGE } from "@/features/floriday/sync-enabled";

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

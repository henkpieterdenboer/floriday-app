import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { KLOK_RESOURCE, runClockSync } from "@/features/rfh-preauction/sync/run-clock-sync";
import { SYNC_DISABLED_MESSAGE, isSyncEnabled } from "@/features/floriday/sync-enabled";
import { isErEenRunBezig } from "@/features/floriday/sync/run-log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The clock supply top-up.
 *
 * No page bound and no interval check, unlike the Floriday route. A run here is a fixed
 * amount of work - four auction days times seven locations - and it either finishes or it
 * does not; there is no cursor to leave halfway. The interval is the cron schedule itself.
 *
 * The overlap guard does matter, and more than on the Floriday side: two runs would refresh
 * the same rotating token and kill the session (spec §4).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const expected = `Bearer ${getEnv().CRON_SECRET}`;
    if (request.headers.get("authorization") !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSyncEnabled()) {
      return NextResponse.json({ skipped: true, reason: SYNC_DISABLED_MESSAGE });
    }

    if (await isErEenRunBezig(KLOK_RESOURCE)) {
      return NextResponse.json({
        skipped: true,
        reason: "Er loopt al een synchronisatie voor het klokaanbod.",
      });
    }

    const result = await runClockSync({ trigger: "CRON" });

    return NextResponse.json({
      snedenVerwerkt: result.snedenVerwerkt,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      pagesProcessed: result.pagesProcessed,
      // Dag, locatie én de reden - "korte-pagina" (de resultatenset schoof onder ons vandaan,
      // onschuldig) versus "maxPaginas" (de server bereikt zijn eigen totaal nooit, wel iets om
      // naar te kijken). Zonder de reden kan een lezer van dit antwoord alleen zien wélke snede
      // onvolledig was, niet of dat om aandacht vraagt - daarvoor moest hij eerst de SyncRun-rij
      // zelf opzoeken.
      onvolledigeSneden: result.onvolledigeSneden.map((s) => ({
        auctionDate: s.auctionDate,
        auctionLocationKey: s.auctionLocationKey,
        stopReden: s.stopReden,
      })),
      // Sneden waarvan het ophalen zelf misging - anders dan onvolledigeSneden hierboven, die
      // wél data opleverden maar niet compleet. Zie MislukteSnede in run-clock-sync.ts.
      mislukteSneden: result.mislukteSneden.map((s) => ({
        auctionDate: s.auctionDate,
        auctionLocationKey: s.auctionLocationKey,
        foutmelding: s.fout.message,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

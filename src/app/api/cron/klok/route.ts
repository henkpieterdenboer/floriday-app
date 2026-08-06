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
      // Alleen welke snede (dag/locatie), niet waarom. De reden - totaal-bereikt versus
      // korte-pagina versus maxPaginas - zit in SyncRun.warning, niet in dit resultaat; zie
      // het rapport bij taak 15 voor de afweging om dat hier niet bij te verzinnen.
      onvolledigeSneden: result.onvolledigeSneden.map(
        (s) => `${s.auctionDate}/${s.auctionLocationKey}`,
      ),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { SYNC_DISABLED_MESSAGE, isSyncEnabled } from "@/features/floriday/sync-enabled";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hourly top-up. Bounded to 20 pages so one run always finishes well within the function
 * limit; if there is more to do, the next hour picks it up. Falling behind is not a data
 * problem, because the cursor decides where to resume, not the clock.
 *
 * Arithmetic behind the bound: writeSupplyPage costs ~1 s per 1000-row page (measured, see
 * its own comment), and the rate limiter caps Floriday requests at 3/s, so one page - one
 * fetch plus one write - costs on the order of 1-2 s. 20 pages is therefore tens of
 * seconds, not the 300 s ceiling; even doubled for pessimism it stays under a quarter of
 * the budget. Only a sustained run of near-max retries (5 attempts, backoff capped at 8 s)
 * on most pages could approach the limit, and at that point Floriday itself is degraded
 * enough that the run failing outright is the more likely outcome anyway.
 */
const MAX_PAGES_PER_RUN = 20;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const expected = `Bearer ${getEnv().CRON_SECRET}`;
    if (request.headers.get("authorization") !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bewust vóór runSupplySync, zodat er geen mislukte run in het log belandt: een
    // omgeving die nog wacht op gegevens is niet hetzelfde als een omgeving die stuk is.
    if (!isSyncEnabled()) {
      return NextResponse.json({ skipped: true, reason: SYNC_DISABLED_MESSAGE });
    }

    const result = await runSupplySync({ trigger: "CRON", maxPages: MAX_PAGES_PER_RUN });

    return NextResponse.json({
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      versionsAdded: result.versionsAdded,
      tradeItemsAdded: result.tradeItemsAdded,
      cursor: result.cursor.toString(),
      reachedEnd: result.reachedEnd,
      warning: result.warning ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

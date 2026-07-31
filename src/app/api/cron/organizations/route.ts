import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { runOrganizationSync } from "@/features/floriday/sync/run-organization-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily top-up, run once at 04:30 UTC after the order window closes. Bounded to 20 pages
 * for the same reason as the supply route (see its comment for the arithmetic): even
 * though this only needs to run once a day rather than hourly, an unbounded run is still
 * one bad day (a large batch of new/changed organizations) away from risking the 300 s
 * function limit, and a bounded run costs nothing extra - the cursor picks up tomorrow
 * where today left off.
 */
const MAX_PAGES_PER_RUN = 20;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const expected = `Bearer ${getEnv().CRON_SECRET}`;
    if (request.headers.get("authorization") !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runOrganizationSync({ trigger: "CRON", maxPages: MAX_PAGES_PER_RUN });

    return NextResponse.json({
      pagesProcessed: result.pagesProcessed,
      rowsProcessed: result.rowsProcessed,
      cursor: result.cursor.toString(),
      reachedEnd: result.reachedEnd,
      warning: result.warning ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

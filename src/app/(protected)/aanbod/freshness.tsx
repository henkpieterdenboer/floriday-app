import { getLastSuccessfulSyncAt, isStale } from "@/features/supply-search/freshness";
import { cn } from "@/lib/utils";

/**
 * Async server component, fetched independently of the line/summary query in page.tsx (a
 * separate SyncRun lookup, not the same data refetched) - "Boven de tabel staat permanent
 * wanneer de laatste geslaagde synchronisatie was" (spec §6). Older than three hours reads
 * as an alert, not a quiet caption, per the spec's explicit instruction.
 */
export async function Freshness() {
  const finishedAt = await getLastSuccessfulSyncAt();
  const now = new Date();
  const stale = isStale(finishedAt, now);

  const formatted = finishedAt
    ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(finishedAt)
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        stale ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted/30 text-muted-foreground",
      )}
      role={stale ? "alert" : undefined}
    >
      {formatted ? (
        <>
          Laatste synchronisatie: <span className="font-medium">{formatted}</span>
          {stale ? " - dit is langer dan drie uur geleden, de cijfers hieronder kunnen verouderd zijn." : "."}
        </>
      ) : (
        "Er is nog nooit een geslaagde synchronisatie geweest - de cijfers hieronder kunnen verouderd of onvolledig zijn."
      )}
    </div>
  );
}

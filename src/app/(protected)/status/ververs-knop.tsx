"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ververseNuAction, type VerversStand } from "./actions";
import { cn } from "@/lib/utils";

const begin: VerversStand = { status: "idle" };

/**
 * "Nu verversen", met de uitkomst ernaast.
 *
 * useActionState en geen eigen useState: de knop moet uitgeschakeld zijn zolang de
 * synchronisatie loopt, en `pending` daarvan is de enige bron die niet uit de pas kan lopen
 * met de actie zelf. De serveractie doet revalidatePath, dus de cijfers op de pagina
 * verversen mee zonder dat hier iets voor nodig is.
 */
export function VerversKnop() {
  const [stand, formAction, pending] = useActionState(
    async () => ververseNuAction(),
    begin,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Bezig met verversen..." : "Nu verversen"}
      </Button>

      {!pending && stand.status !== "idle" && stand.bericht ? (
        <span
          className={cn(
            "text-sm",
            stand.status === "fout" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {stand.bericht}
        </span>
      ) : null}
    </form>
  );
}

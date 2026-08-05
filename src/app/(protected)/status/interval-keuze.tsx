"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAXIMUM_INTERVAL, MINIMUM_INTERVAL } from "@/features/sync-status/interval";
import { zetIntervalAction, type IntervalStand } from "./actions";

const begin: IntervalStand = { status: "idle" };

/**
 * Het aantal minuten tussen twee synchronisaties.
 *
 * De geplande taak komt elke minuut langs; dit getal bepaalt of hij dan ook werkelijk
 * ophaalt. Eén minuut is dus de ondergrens - vaker vragen dan de taak langskomt verandert
 * niets.
 *
 * Wie niet mag wijzigen ziet hetzelfde veld, uitgeschakeld en zonder knop. Bewust dezelfde
 * vorm en niet een regel tekst: dat het interval een instelling ís, en geen vaste eigenschap
 * van de koppeling, hoort ook zonder beheerrechten zichtbaar te zijn. De serveractie
 * controleert de rol zelf, dus dit is puur weergave.
 */
export function IntervalKeuze({
  huidig,
  bewerkbaar,
}: {
  huidig: number;
  bewerkbaar: boolean;
}) {
  const [stand, formAction, pending] = useActionState(zetIntervalAction, begin);

  const veld = (
    <>
      <label htmlFor="minuten" className="text-xs text-muted-foreground">
        elke
      </label>
      {/* key op de huidige waarde: zonder dit blijft het veld na opslaan de oude waarde
          tonen, omdat React het component niet opnieuw aanmaakt en defaultValue dus niet
          opnieuw toepast. Zelfde patroon als het zoekveld in de filterbalk. */}
      <Input
        key={huidig}
        id="minuten"
        name="minuten"
        type="number"
        inputMode="numeric"
        min={MINIMUM_INTERVAL}
        max={MAXIMUM_INTERVAL}
        step={1}
        defaultValue={huidig}
        disabled={!bewerkbaar}
        readOnly={!bewerkbaar}
        className="h-8 w-20 text-sm"
      />
      <span className="text-xs text-muted-foreground">min.</span>
    </>
  );

  if (!bewerkbaar) {
    return <div className="mt-1.5 flex flex-wrap items-center gap-2">{veld}</div>;
  }

  return (
    <form action={formAction} className="mt-1.5 flex flex-wrap items-center gap-2">
      {veld}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "..." : "Opslaan"}
      </Button>

      {!pending && stand.bericht ? (
        <span className={kleurVanStand(stand.status)}>{stand.bericht}</span>
      ) : null}
    </form>
  );
}

function kleurVanStand(status: IntervalStand["status"]): string {
  return status === "fout" ? "text-xs text-destructive" : "text-xs text-muted-foreground";
}

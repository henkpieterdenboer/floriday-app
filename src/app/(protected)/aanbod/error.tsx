"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Route-level error boundary, required by Next.js to be a Client Component. Catches a
 * failing query from page.tsx (e.g. the database still asleep, or a genuine failure) and
 * offers a retry instead of a blank crashed screen - "Een query die faalt toont een nette
 * melding met de mogelijkheid het opnieuw te proberen. De onderliggende fout gaat naar de
 * serverlog, niet naar het scherm" (spec §7).
 */
export default function AanbodError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Aanbod-scherm kon niet laden:", error);
  }, [error]);

  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTitle>Het aanbod kon niet worden geladen</AlertTitle>
        <AlertDescription>
          Er ging iets mis bij het ophalen van de gegevens. Probeer het opnieuw - lukt het
          dan nog niet, meld het bij de beheerder.
        </AlertDescription>
      </Alert>
      <Button className="mt-3" onClick={reset}>
        Opnieuw proberen
      </Button>
    </div>
  );
}

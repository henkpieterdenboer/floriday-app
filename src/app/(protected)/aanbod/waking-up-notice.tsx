"use client";

import { useEffect, useState } from "react";

const DELAY_MS = 3000;

/**
 * Mounted for exactly as long as loading.tsx is showing - i.e. exactly as long as page.tsx's
 * data fetch takes. After three seconds of that, says the database might be waking up
 * (Neon suspends after five minutes idle, and the first query after that takes seconds - see
 * the plan). The setTimeout callback is what calls setState here, not the effect body
 * itself: this is the standard, unavoidable pattern for a delayed one-shot timer and is not
 * the "adjust state synchronously on every run of the effect" anti-pattern the project's
 * React 19 rule targets.
 */
export function WakingUpNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <p className="text-sm text-muted-foreground" role="status">
      Dit duurt langer dan gebruikelijk - de database wordt waarschijnlijk wakker na een stille
      periode. Nog even geduld.
    </p>
  );
}

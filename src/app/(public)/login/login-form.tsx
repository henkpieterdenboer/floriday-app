"use client";

import { useActionState, useRef, type RefObject } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SsoButton } from "@/components/auth/sso-button";
import { entraSignInAction, loginAction, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = {};

export interface LoginFormProps {
  verder: string;
  entraEnabled: boolean;
  entraError: string | null;
}

/**
 * Verbindt de knop uit @col/sso-button met onze server action.
 *
 * Die knop is een `type="button"` met een `onClick`; wij melden aan via een
 * `<form action={...}>`. Deze wrapper dient dat formulier in bij een klik en
 * leest de bezig-stand uit useFormStatus - dat laatste werkt alleen voor een
 * component dat binnen het formulier zelf staat, vandaar dat dit een apart
 * component is en geen stukje van LoginForm.
 */
function EntraSubmit({ formRef }: { formRef: RefObject<HTMLFormElement | null> }) {
  const { pending } = useFormStatus();

  return (
    <SsoButton
      label="Aanmelden met Microsoft"
      busyLabel="Bezig met aanmelden..."
      busy={pending}
      onClick={() => formRef.current?.requestSubmit()}
    />
  );
}

export function LoginForm({ verder, entraEnabled, entraError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const entraFormRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {entraError || state.error ? (
        <div className="mb-6 space-y-4">
          {entraError ? (
            <Alert variant="destructive">
              <AlertDescription>{entraError}</AlertDescription>
            </Alert>
          ) : null}

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      {entraEnabled ? (
        <>
          <form action={entraSignInAction} ref={entraFormRef}>
            <input type="hidden" name="verder" value={verder} />
            <EntraSubmit formRef={entraFormRef} />
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
              of
            </span>
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="verder" value={verder} />

        <div className="space-y-2">
          <Label htmlFor="email">E-mailadres</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jij@bedrijf.nl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Bezig met aanmelden..." : "Aanmelden"}
        </Button>
      </form>
    </div>
  );
}

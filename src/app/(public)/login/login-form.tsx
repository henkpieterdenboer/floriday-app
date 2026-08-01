"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { entraSignInAction, loginAction, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = {};

export interface LoginFormProps {
  verder: string;
  entraEnabled: boolean;
  entraError: string | null;
}

export function LoginForm({ verder, entraEnabled, entraError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-4">
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

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="verder" value={verder} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Wachtwoord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Bezig met aanmelden..." : "Aanmelden"}
        </Button>
      </form>

      {entraEnabled ? (
        <form action={entraSignInAction}>
          <input type="hidden" name="verder" value={verder} />
          <Button type="submit" variant="outline" className="w-full">
            Aanmelden met Microsoft
          </Button>
        </form>
      ) : null}
    </div>
  );
}

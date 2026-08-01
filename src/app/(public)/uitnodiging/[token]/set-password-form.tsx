"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setPasswordAction, type SetPasswordState } from "@/features/auth/actions";

const initialState: SetPasswordState = { status: "idle" };

export interface SetPasswordFormProps {
  token: string;
}

export function SetPasswordForm({ token }: SetPasswordFormProps) {
  const boundAction = setPasswordAction.bind(null, token);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>
            Je wachtwoord is ingesteld. Je kunt nu aanmelden.
          </AlertDescription>
        </Alert>
        <Link href="/login" className={cn(buttonVariants({ variant: "default" }), "w-full")}>
          Naar het aanmeldscherm
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Wachtwoord herhalen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Bezig..." : "Wachtwoord instellen"}
      </Button>
    </form>
  );
}

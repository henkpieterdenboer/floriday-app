"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUserAction, type CreateUserState } from "@/features/auth/actions";

const initialState: CreateUserState = { status: "idle" };

export function AddUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gebruiker toevoegen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              name="role"
              defaultValue="VIEWER"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Bezig..." : "Uitnodigen"}
          </Button>
        </form>

        {state.status === "error" && state.message ? (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "success" ? (
          <Alert>
            <AlertDescription>
              {state.message}
              {state.previewUrl ? (
                <>
                  {" "}
                  <a
                    href={state.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Bekijk de e-mail (Ethereal preview)
                  </a>
                </>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

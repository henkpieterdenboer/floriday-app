"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  resendInvitationAction,
  toggleUserActiveAction,
  type ResendInvitationState,
} from "@/features/auth/actions";
import type { UserRowData } from "./users-table";

const initialState: ResendInvitationState = { status: "idle" };

export function UserRow({ user }: { user: UserRowData }) {
  const boundResend = resendInvitationAction.bind(null, user.id, user.email, user.name);
  const [state, formAction, pending] = useActionState(boundResend, initialState);
  const boundToggle = toggleUserActiveAction.bind(null, user.id, !user.isActive);

  return (
    <>
      <tr className="border-t">
        <td className="px-3 py-2">{user.name}</td>
        <td className="px-3 py-2">{user.email}</td>
        <td className="px-3 py-2">{user.role === "ADMIN" ? "Admin" : "Viewer"}</td>
        <td className="px-3 py-2">{user.isActive ? "Actief" : "Uitgeschakeld"}</td>
        <td className="px-3 py-2">{user.hasPassword ? "Ja" : "Nee"}</td>
        <td className="px-3 py-2">{user.lastLoginAt ?? "Nooit"}</td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap gap-2">
            <form action={boundToggle}>
              <Button type="submit" size="sm" variant="outline">
                {user.isActive ? "Deactiveren" : "Activeren"}
              </Button>
            </form>
            <form action={formAction}>
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                {pending ? "Bezig..." : "Nieuwe uitnodiging"}
              </Button>
            </form>
          </div>
        </td>
      </tr>
      {state.status !== "idle" ? (
        <tr>
          <td colSpan={7} className="px-3 pb-2">
            {state.status === "error" ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
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
              </p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

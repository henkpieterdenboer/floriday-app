import type { UserRole } from "@prisma/client";
import { UserRow } from "./user-row";

export interface UserRowData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  hasPassword: boolean;
  lastLoginAt: string | null;
}

export function UsersTable({ users }: { users: UserRowData[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Naam</th>
            <th className="px-3 py-2 font-medium">E-mailadres</th>
            <th className="px-3 py-2 font-medium">Rol</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Wachtwoord ingesteld</th>
            <th className="px-3 py-2 font-medium">Laatst aangemeld</th>
            <th className="px-3 py-2 font-medium">Acties</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

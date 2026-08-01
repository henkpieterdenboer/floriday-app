import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * NextAuth's built-in `User`/`Session` types only know about `id`, `name`, `email` and
 * `image`. We carry our own `role` through the JWT and session, so both need augmenting -
 * otherwise every read of `session.user.role` needs an unsafe cast.
 *
 * See: https://authjs.dev/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface User {
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

/**
 * `next-auth/jwt` merely re-exports `@auth/core/jwt` via `export *`, so augmenting the
 * former does not merge into the `JWT` type that the `jwt`/`session` callbacks actually use
 * internally (that one comes straight from `@auth/core/jwt`). Both are augmented here so the
 * type lines up regardless of which specifier calling code imports `JWT` from.
 */
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
  }
}

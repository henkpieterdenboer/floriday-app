import { describe, expect, it } from "vitest";
import { decideEntraSignIn } from "@/features/auth/entra-linking";

const account = {
  id: "u1",
  email: "henk@coloriginz.com",
  isActive: true,
  passwordHash: null as string | null,
};

describe("decideEntraSignIn", () => {
  it("allows an existing active account", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: true, account,
    })).toEqual({ allowed: true, userId: "u1" });
  });

  it("allows an account that has no password yet", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: true,
      account: { ...account, passwordHash: null },
    }).allowed).toBe(true);
  });

  it("allows an account that does have a password", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: true,
      account: { ...account, passwordHash: "$argon2id$..." },
    }).allowed).toBe(true);
  });

  it("refuses when no account exists, and does not create one", () => {
    expect(decideEntraSignIn({
      profileEmail: "vreemde@elders.com", profileEmailVerified: true, account: null,
    })).toEqual({ allowed: false, reason: "no-account" });
  });

  it("refuses a deactivated account", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: true,
      account: { ...account, isActive: false },
    })).toEqual({ allowed: false, reason: "deactivated" });
  });

  it("refuses when the provider did not verify the address", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: false, account,
    })).toEqual({ allowed: false, reason: "email-not-verified" });
  });

  it("refuses when the provider sends no address at all", () => {
    expect(decideEntraSignIn({
      profileEmail: null, profileEmailVerified: true, account,
    })).toEqual({ allowed: false, reason: "no-email" });
  });

  it("matches case insensitively", () => {
    expect(decideEntraSignIn({
      profileEmail: "Henk@Coloriginz.COM", profileEmailVerified: true, account,
    }).allowed).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(decideEntraSignIn({
      profileEmail: "  henk@coloriginz.com  ", profileEmailVerified: true, account,
    }).allowed).toBe(true);
  });

  it("refuses when the addresses differ, even by one character", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.co", profileEmailVerified: true, account,
    })).toEqual({ allowed: false, reason: "email-mismatch" });
  });

  // Extra cases: gaps found while reviewing the plan. The given tests only cover a null
  // profileEmail; an empty or whitespace-only string is falsy-in-spirit but not falsy in
  // JS, so it needs its own coverage to prove the `=== ""` branch actually fires.
  it("refuses when the profile email is an empty string", () => {
    expect(decideEntraSignIn({
      profileEmail: "", profileEmailVerified: true, account,
    })).toEqual({ allowed: false, reason: "no-email" });
  });

  it("refuses when the profile email is only whitespace", () => {
    expect(decideEntraSignIn({
      profileEmail: "   ", profileEmailVerified: true, account,
    })).toEqual({ allowed: false, reason: "no-email" });
  });

  // An account with an empty email is pathological data, but the function must not crash
  // on it and must not accidentally treat it as a match against a real profile email.
  it("treats an account with an empty email as a mismatch, not a crash", () => {
    expect(decideEntraSignIn({
      profileEmail: "henk@coloriginz.com", profileEmailVerified: true,
      account: { ...account, email: "" },
    })).toEqual({ allowed: false, reason: "email-mismatch" });
  });
});

import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/features/auth/password";

describe("password hashing", () => {
  it("accepts the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("produces a different hash every time for the same password", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("returns false instead of throwing on a malformed hash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });

  it("handles a password with unicode and spaces", async () => {
    const password = "Wachtwoord met ëéï en spaties 🌷";
    const hash = await hashPassword(password);
    expect(await verifyPassword(hash, password)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  createInvitationToken,
  hashInvitationToken,
  isExpired,
} from "@/features/auth/invitation-token";

describe("createInvitationToken", () => {
  it("produces a token and its hash", () => {
    const { token, tokenHash } = createInvitationToken();
    expect(token.length).toBeGreaterThan(30);
    expect(tokenHash).toBe(hashInvitationToken(token));
  });

  it("never produces the same token twice", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => createInvitationToken().token));
    expect(tokens.size).toBe(200);
  });

  it("produces a url-safe token", () => {
    for (let i = 0; i < 50; i++) {
      expect(createInvitationToken().token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe("hashInvitationToken", () => {
  it("is stable for the same input", () => {
    expect(hashInvitationToken("abc")).toBe(hashInvitationToken("abc"));
  });

  it("differs for different input", () => {
    expect(hashInvitationToken("abc")).not.toBe(hashInvitationToken("abd"));
  });

  it("does not contain the token itself", () => {
    expect(hashInvitationToken("geheim")).not.toContain("geheim");
  });
});

describe("isExpired", () => {
  const now = new Date("2026-08-01T12:00:00.000Z");

  it("is false before the expiry moment", () => {
    expect(isExpired(new Date("2026-08-01T12:00:01.000Z"), now)).toBe(false);
  });

  it("is true after the expiry moment", () => {
    expect(isExpired(new Date("2026-08-01T11:59:59.000Z"), now)).toBe(true);
  });

  it("is true exactly at the expiry moment", () => {
    expect(isExpired(now, now)).toBe(true);
  });
});

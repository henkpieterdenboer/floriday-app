import { describe, expect, it } from "vitest";
import { isSafeRedirectPath, resolveRedirectTarget } from "@/features/auth/safe-redirect";

describe("isSafeRedirectPath", () => {
  it("accepts a plain internal path", () => {
    expect(isSafeRedirectPath("/aanbod")).toBe(true);
  });

  it("accepts a nested internal path with a query string", () => {
    expect(isSafeRedirectPath("/beheer/gebruikers?foo=bar")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isSafeRedirectPath("")).toBe(false);
  });

  it("rejects a path without a leading slash", () => {
    expect(isSafeRedirectPath("aanbod")).toBe(false);
  });

  it("rejects a protocol-relative path (// attack)", () => {
    expect(isSafeRedirectPath("//evil.example")).toBe(false);
  });

  it("rejects an absolute URL", () => {
    expect(isSafeRedirectPath("https://evil.example")).toBe(false);
  });

  it("rejects a backslash trick that browsers normalise to //", () => {
    expect(isSafeRedirectPath("/\\evil.example")).toBe(false);
  });

  it("rejects a path with an embedded scheme", () => {
    expect(isSafeRedirectPath("/redirect?to=https://evil.example")).toBe(false);
  });

  it("rejects a scheme-relative path hidden after a legit-looking prefix", () => {
    expect(isSafeRedirectPath("/\\/evil.example")).toBe(false);
  });
});

describe("resolveRedirectTarget", () => {
  it("returns the requested path when it is safe", () => {
    expect(resolveRedirectTarget("/beheer/gebruikers")).toBe("/beheer/gebruikers");
  });

  it("falls back to the status page when nothing was requested", () => {
    expect(resolveRedirectTarget(null)).toBe("/status");
    expect(resolveRedirectTarget(undefined)).toBe("/status");
    expect(resolveRedirectTarget("")).toBe("/status");
  });

  it("falls back to the status page when the request is an open-redirect attempt", () => {
    expect(resolveRedirectTarget("//evil.example")).toBe("/status");
    expect(resolveRedirectTarget("https://evil.example")).toBe("/status");
    expect(resolveRedirectTarget("/\\evil.example")).toBe("/status");
  });
});

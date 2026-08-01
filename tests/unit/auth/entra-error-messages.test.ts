import { describe, expect, it } from "vitest";
import { entraErrorMessage } from "@/features/auth/entra-error-messages";

describe("entraErrorMessage", () => {
  it("returns null when there is no code", () => {
    expect(entraErrorMessage(null)).toBeNull();
    expect(entraErrorMessage(undefined)).toBeNull();
    expect(entraErrorMessage("")).toBeNull();
  });

  it("translates every known rejection reason into a Dutch sentence", () => {
    expect(entraErrorMessage("no-account")).toMatch(/niet bekend/);
    expect(entraErrorMessage("deactivated")).toMatch(/uitgeschakeld/);
    expect(entraErrorMessage("email-mismatch")).toMatch(/komt niet overeen/);
    expect(entraErrorMessage("email-not-verified")).toMatch(/niet geverifieerd/);
    expect(entraErrorMessage("no-email")).toMatch(/Geen e-mailadres|geen e-mailadres/);
  });

  it("falls back to a generic message for an unrecognised code", () => {
    expect(entraErrorMessage("something-unexpected")).toMatch(/niet gelukt/);
  });
});

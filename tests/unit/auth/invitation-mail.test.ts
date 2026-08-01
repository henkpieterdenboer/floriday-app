import { describe, expect, it } from "vitest";
import { buildInvitationMail } from "@/features/auth/emails/invitation";

const base = {
  to: "henk@coloriginz.com",
  name: "Henk Pieter",
  invitationUrl: "https://app.example/uitnodiging/abc",
  expiresAt: new Date("2026-08-08T12:00:00.000Z"),
};

describe("buildInvitationMail", () => {
  it("contains the link in both plain text and html", () => {
    const mail = buildInvitationMail({ ...base, entraEnabled: false });
    expect(mail.text).toContain(base.invitationUrl);
    expect(mail.html).toContain(base.invitationUrl);
  });

  it("mentions the expiry date", () => {
    expect(buildInvitationMail({ ...base, entraEnabled: false }).text).toContain("8 augustus 2026");
  });

  it("mentions the work account only when entra is enabled", () => {
    expect(buildInvitationMail({ ...base, entraEnabled: true }).text).toContain("werkaccount");
    expect(buildInvitationMail({ ...base, entraEnabled: false }).text).not.toContain("werkaccount");
  });

  it("addresses the recipient by name", () => {
    expect(buildInvitationMail({ ...base, entraEnabled: false }).text).toContain("Henk Pieter");
  });
});

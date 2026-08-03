import { describe, expect, it } from "vitest";
import { currentEmailProvider, resolveMailRouting } from "@/features/environment/demo-mail-routing";

describe("currentEmailProvider", () => {
  it("gebruikt de cookie als die geldig is", () => {
    expect(currentEmailProvider("test", true)).toBe("test");
    expect(currentEmailProvider("live", false)).toBe("live");
  });

  it("valt terug op wat mail.ts sowieso zou kiezen als de cookie ontbreekt", () => {
    expect(currentEmailProvider(undefined, true)).toBe("live");
    expect(currentEmailProvider(undefined, false)).toBe("test");
  });

  it("negeert een onbekende cookiewaarde", () => {
    expect(currentEmailProvider("iets-anders", true)).toBe("live");
  });
});

describe("resolveMailRouting", () => {
  const base = {
    vercelEnv: "preview",
    onVercel: "1",
    smtpConfigured: true,
    providerCookie: undefined,
    recipientCookie: undefined,
    to: "klant@example.com",
    subject: "Uitnodiging",
  };

  it("gebruikt Resend als SMTP geconfigureerd is en er geen cookie staat", () => {
    expect(resolveMailRouting(base)).toEqual({
      useResend: true,
      to: "klant@example.com",
      subject: "Uitnodiging",
    });
  });

  it("valt terug op Ethereal zonder SMTP-configuratie", () => {
    expect(resolveMailRouting({ ...base, smtpConfigured: false }).useResend).toBe(false);
  });

  it("dwingt Ethereal af als de cookie 'test' zegt, ook met SMTP geconfigureerd", () => {
    expect(resolveMailRouting({ ...base, providerCookie: "test" }).useResend).toBe(false);
  });

  it("blijft bij Ethereal als de cookie 'live' zegt maar SMTP niet geconfigureerd is", () => {
    expect(resolveMailRouting({ ...base, smtpConfigured: false, providerCookie: "live" }).useResend).toBe(
      false,
    );
  });

  it("stuurt naar de override-ontvanger en zet de oorspronkelijke ontvanger in het onderwerp", () => {
    const result = resolveMailRouting({ ...base, recipientCookie: "test@example.com" });
    expect(result.to).toBe("test@example.com");
    expect(result.subject).toBe("[naar klant@example.com] Uitnodiging");
  });

  it("negeert een lege of blanco ontvanger-cookie", () => {
    expect(resolveMailRouting({ ...base, recipientCookie: "   " }).to).toBe("klant@example.com");
  });

  // De belangrijkste test: op productie telt geen enkele cookie mee, ook niet als er
  // toevallig nog een demo-cookie in de browser van een beheerder staat.
  it("negeert beide cookies volledig op productie", () => {
    const result = resolveMailRouting({
      ...base,
      vercelEnv: "production",
      providerCookie: "test",
      recipientCookie: "test@example.com",
    });
    expect(result).toEqual({ useResend: true, to: "klant@example.com", subject: "Uitnodiging" });
  });
});

describe("resolveMailRouting op een Vercel-omgeving zonder VERCEL_ENV", () => {
  // Vercel kan de systeemvariabelen verbergen. Dan is VERCEL_ENV leeg, ook op productie.
  // De cookie mag dan niets meer overrulen - anders zou iemand met een oude cookie zijn
  // productiemail naar een testadres kunnen sturen.
  it("negeert de cookies volledig", () => {
    const routing = resolveMailRouting({
      vercelEnv: undefined,
      onVercel: "1",
      smtpConfigured: true,
      providerCookie: "test",
      recipientCookie: "afvanger@example.com",
      to: "klant@example.com",
      subject: "Uitnodiging",
    });

    expect(routing.useResend).toBe(true);
    expect(routing.to).toBe("klant@example.com");
    expect(routing.subject).toBe("Uitnodiging");
  });

  it("laat de cookies wel gelden bij lokaal draaien buiten Vercel", () => {
    const routing = resolveMailRouting({
      vercelEnv: undefined,
      onVercel: undefined,
      smtpConfigured: true,
      providerCookie: "test",
      recipientCookie: "afvanger@example.com",
      to: "klant@example.com",
      subject: "Uitnodiging",
    });

    expect(routing.useResend).toBe(false);
    expect(routing.to).toBe("afvanger@example.com");
  });
});

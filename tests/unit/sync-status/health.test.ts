import { describe, expect, it } from "vitest";
import { beoordeelSync, beschrijfDuur, type GezondheidInvoer } from "@/features/sync-status/health";

const nu = new Date("2026-08-05T12:00:00Z");

function invoer(overschrijf: Partial<GezondheidInvoer> = {}): GezondheidInvoer {
  return {
    laatsteGeslaagdeRun: new Date("2026-08-05T11:58:00Z"),
    laatsteStatus: "SUCCEEDED",
    waarschuwing: null,
    bijgewerkt: true,
    nu,
    ...overschrijf,
  };
}

describe("beoordeelSync", () => {
  it("is groen bij een recente geslaagde run die bij is", () => {
    const uitkomst = beoordeelSync(invoer());
    expect(uitkomst.kleur).toBe("groen");
    expect(uitkomst.kop).toBe("Synchronisatie werkt");
  });

  it("is rood als er nog nooit gesynchroniseerd is", () => {
    const uitkomst = beoordeelSync(invoer({ laatsteGeslaagdeRun: null, laatsteStatus: null }));
    expect(uitkomst.kleur).toBe("rood");
    expect(uitkomst.toelichting).toMatch(/geplande taak/i);
  });

  // Een mislukte poging na een geslaagde is nog steeds rood: vanaf dat moment komt er niets
  // meer binnen, hoe recent de laatste geslaagde run ook was.
  it("is rood bij een mislukte laatste run, ook als er kort daarvoor een geslaagde was", () => {
    const uitkomst = beoordeelSync(invoer({ laatsteStatus: "FAILED" }));
    expect(uitkomst.kleur).toBe("rood");
    expect(uitkomst.kop).toMatch(/mislukt/i);
  });

  it("is oranje wanneer de laatste run langer dan twintig minuten geleden is", () => {
    const uitkomst = beoordeelSync(
      invoer({ laatsteGeslaagdeRun: new Date("2026-08-05T11:35:00Z") }),
    );
    expect(uitkomst.kleur).toBe("oranje");
    expect(uitkomst.toelichting).toMatch(/25 minuten/);
  });

  it("is rood wanneer de laatste run meer dan drie uur geleden is", () => {
    const uitkomst = beoordeelSync(
      invoer({ laatsteGeslaagdeRun: new Date("2026-08-05T07:00:00Z") }),
    );
    expect(uitkomst.kleur).toBe("rood");
    expect(uitkomst.kop).toMatch(/ligt stil/i);
  });

  it("is oranje wanneer de cursor de bovengrens niet haalde", () => {
    const uitkomst = beoordeelSync(invoer({ bijgewerkt: false }));
    expect(uitkomst.kleur).toBe("oranje");
    expect(uitkomst.kop).toMatch(/niet volledig bijgewerkt/i);
  });

  // Het verschil tussen "we weten het niet" en "we lopen achter". Zou null hier oranje
  // geven, dan kleurt een storing op het max-sequence-endpoint de hele pagina alarmerend
  // terwijl er niets mis is met de synchronisatie zelf.
  it("blijft groen wanneer de bovengrens niet gemeten kon worden", () => {
    const uitkomst = beoordeelSync(invoer({ bijgewerkt: null }));
    expect(uitkomst.kleur).toBe("groen");
  });

  it("is oranje bij een geslaagde run met een waarschuwing", () => {
    const uitkomst = beoordeelSync(invoer({ waarschuwing: "Lege pagina ontvangen" }));
    expect(uitkomst.kleur).toBe("oranje");
    expect(uitkomst.toelichting).toBe("Lege pagina ontvangen");
  });

  it("behandelt een lege waarschuwing als geen waarschuwing", () => {
    expect(beoordeelSync(invoer({ waarschuwing: "" })).kleur).toBe("groen");
  });

  // Een run die nu bezig is hoort niet als storing te lezen; er is net nog een geslaagde.
  it("is groen tijdens een lopende run", () => {
    expect(beoordeelSync(invoer({ laatsteStatus: "RUNNING" })).kleur).toBe("groen");
  });

  // Volgorde van oordelen: te oud weegt zwaarder dan een waarschuwing, want het eerste
  // vraagt om actie en het tweede om aandacht.
  it("meldt te-oud boven een waarschuwing wanneer beide gelden", () => {
    const uitkomst = beoordeelSync(
      invoer({
        laatsteGeslaagdeRun: new Date("2026-08-05T07:00:00Z"),
        waarschuwing: "Lege pagina ontvangen",
      }),
    );
    expect(uitkomst.kop).toMatch(/ligt stil/i);
  });
});

describe("beschrijfDuur", () => {
  it.each([
    [0.4, "nog geen minuut"],
    [1, "1 minuut"],
    [25, "25 minuten"],
    [65, "ruim een uur"],
    [200, "3 uur"],
    [1500, "een dag"],
    [4400, "3 dagen"],
  ])("beschrijft %s minuten als %s", (minuten, verwacht) => {
    expect(beschrijfDuur(minuten)).toBe(verwacht);
  });
});

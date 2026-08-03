import { describe, expect, it } from "vitest";
import { isDemoModeAllowed, resolveBanner } from "@/features/environment/environment-banner";

const staging = "https://api.staging.floriday.io/customers-api-2026v1";
const productie = "https://api.floriday.io/customers-api-2026v1";

describe("resolveBanner", () => {
  it("toont niets op productie", () => {
    expect(resolveBanner({ vercelEnv: "production", floridayBaseUrl: productie }))
      .toEqual({ show: false, message: "" });
  });

  it("toont een testbalk op preview", () => {
    const banner = resolveBanner({ vercelEnv: "preview", floridayBaseUrl: staging });
    expect(banner.show).toBe(true);
    expect(banner.message).toContain("Testomgeving");
    expect(banner.message).toContain("staging");
  });

  it("noemt de lokale omgeving bij naam", () => {
    const banner = resolveBanner({ vercelEnv: undefined, floridayBaseUrl: staging });
    expect(banner.show).toBe(true);
    expect(banner.message).toContain("Lokale omgeving");
  });

  // Dit is de regel die het meest uitmaakt: een onbekende waarde valt aan de veilige kant.
  // Een ontbrekende balk op een testomgeving is gevaarlijker dan een balk te veel - dan
  // denk je naar echte cijfers te kijken terwijl het testdata is.
  it("toont de balk bij een onbekende omgevingswaarde", () => {
    expect(resolveBanner({ vercelEnv: "iets-nieuws", floridayBaseUrl: staging }).show).toBe(true);
  });

  it("toont de balk als de omgeving helemaal niet gezet is", () => {
    expect(resolveBanner({ vercelEnv: undefined, floridayBaseUrl: undefined }).show).toBe(true);
  });

  it("waarschuwt wanneer een niet-productieomgeving tegen Floriday productie praat", () => {
    const banner = resolveBanner({ vercelEnv: "preview", floridayBaseUrl: productie });
    expect(banner.message).toContain("Floriday productie");
  });

  it("meldt het als Floriday helemaal niet geconfigureerd is", () => {
    const banner = resolveBanner({ vercelEnv: "preview", floridayBaseUrl: undefined });
    expect(banner.message).toContain("niet geconfigureerd");
  });

  it("zegt er altijd bij dat de cijfers niet echt zijn", () => {
    for (const env of [undefined, "preview", "development"]) {
      expect(resolveBanner({ vercelEnv: env, floridayBaseUrl: staging }).message)
        .toContain("geen echte cijfers");
    }
  });
});

describe("isDemoModeAllowed", () => {
  const OP_VERCEL = "1";

  // Dit is de regel waar de rolwisselaar op vertrouwt: fout om zou betekenen dat een
  // viewer zichzelf tot beheerder kan maken op productie.
  it("staat demo-besturing niet toe op productie", () => {
    expect(isDemoModeAllowed("production", OP_VERCEL)).toBe(false);
  });

  it("staat demo-besturing toe op preview", () => {
    expect(isDemoModeAllowed("preview", OP_VERCEL)).toBe(true);
  });

  it("staat demo-besturing toe bij lokaal draaien, buiten Vercel", () => {
    expect(isDemoModeAllowed(undefined, undefined)).toBe(true);
  });

  // Dit is het geval waarvoor deze functie los staat van resolveBanner. Vercel kent een
  // instelling die de systeemvariabelen niet blootstelt; dan is VERCEL_ENV leeg, ook op
  // productie. De balk mag dan verschijnen (bij twijfel tonen), maar de rolwisselaar
  // absoluut niet.
  it("weigert demo-besturing op Vercel wanneer VERCEL_ENV ontbreekt", () => {
    expect(isDemoModeAllowed(undefined, OP_VERCEL)).toBe(false);
  });

  it("weigert demo-besturing bij een onbekende waarde op Vercel", () => {
    expect(isDemoModeAllowed("iets-nieuws", OP_VERCEL)).toBe(false);
  });

  // De twee functies vallen bij twijfel naar tegengestelde kanten. Vastgelegd omdat het
  // eruitziet als een inconsistentie en het bij een opruimactie makkelijk "rechtgetrokken"
  // wordt - waarmee precies het gat terugkomt.
  it("laat de balk wel zien waar demo-besturing geweigerd wordt", () => {
    const vercelEnv = undefined;
    const onVercel = OP_VERCEL;

    expect(isDemoModeAllowed(vercelEnv, onVercel)).toBe(false);
    expect(resolveBanner({ vercelEnv, floridayBaseUrl: staging }).show).toBe(true);
  });
});

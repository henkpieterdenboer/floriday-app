import { describe, expect, it } from "vitest";
import { pickNewRole } from "@/features/auth/pick-new-role";

describe("pickNewRole", () => {
  // De echte situatie: DemoRoleSwitcher's nextRoles() voegt de nieuw aangevinkte rol toe
  // aan het einde van de al actieve rollen in plaats van te vervangen.
  it("pakt de rol die verschilt van de huidige, ongeacht de volgorde", () => {
    expect(pickNewRole(["ADMIN", "VIEWER"], "ADMIN")).toBe("VIEWER");
    expect(pickNewRole(["VIEWER", "ADMIN"], "VIEWER")).toBe("ADMIN");
  });

  it("valt terug op het eerste element als er niets afwijkt", () => {
    expect(pickNewRole(["ADMIN"], "ADMIN")).toBe("ADMIN");
  });

  it("geeft undefined bij een lege lijst", () => {
    expect(pickNewRole([], "ADMIN")).toBeUndefined();
  });
});

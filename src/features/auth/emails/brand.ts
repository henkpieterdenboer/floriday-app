import type { EmailBrand } from "@/components/email/email-types";
import { EMAIL_LOGO_BASE64, EMAIL_LOGO_BREEDTE, EMAIL_LOGO_HOOGTE } from "./logo-base64";

/**
 * Het merk waarmee deze applicatie mailt. Eén merk, dus een vaste waarde en geen keuze uit
 * `emailAccents` van @col/brand-tokens - die tabel is er voor apps die meerdere merken
 * bedienen.
 *
 * De hexwaarden komen wél uit diezelfde tabel (COLORIGINZ, versie 1.1.0), zodat de knop
 * hier dezelfde kleur heeft als in de andere applicaties. `accent` is bewust brand-700 en
 * niet brand-500: wit op brand-500 haalt met 3,2:1 de 4,5:1 van WCAG AA niet, en knoptekst
 * van 15px vet telt niet als grote tekst. Het streepje bovenaan (`rule`) draagt geen tekst
 * en houdt daarom brand-500.
 *
 * Een functie en geen constante: `content` moet een verse `Buffer` zijn. Nodemailer leest
 * een Buffer bij het versturen uit, en een gedeeld exemplaar hergebruiken over meerdere
 * verzendingen is precies het soort verborgen toestand waar je later een middag aan kwijt
 * bent.
 */
export function coloriginzBrand(): EmailBrand {
  return {
    name: "Coloríginz",
    logo: {
      filename: "coloriginz.png",
      content: Buffer.from(EMAIL_LOGO_BASE64, "base64"),
      cid: "merklogo",
      width: EMAIL_LOGO_BREEDTE,
      height: EMAIL_LOGO_HOOGTE,
    },
    accent: "#006799",
    accentContrast: "#ffffff",
    rule: "#0098da",
    footerText: "Coloríginz — OZ Import BV, Aalsmeer",
  };
}

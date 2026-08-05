import { getEnv } from "@/lib/env";
import { isSyncEnabled } from "@/features/floriday/sync-enabled";

/**
 * Wat er van de instellingen klopt, zonder ook maar één waarde te tonen.
 *
 * Bestaat omdat een lege statuspagina drie heel verschillende oorzaken kan hebben: de
 * synchronisatie staat uit, de Floriday-gegevens ontbreken, of er is echt iets stuk. Zonder
 * dit onderscheid stuurt de pagina je de verkeerde kant op - precies wat er gebeurde toen de
 * productieomgeving dagenlang niets deed en het scherm "controleer of de geplande taak
 * draait" adviseerde, terwijl die taak keurig draaide en alleen oversloeg.
 */
export interface Configuratie {
  synchronisatieAan: boolean;
  /** Namen van de Floriday-instellingen die leeg zijn. Leeg betekent: alles ingevuld. */
  ontbrekend: string[];
  /** Waar de app draait, voor zover Vercel dat vertelt. */
  omgeving: string;
  /** Staging of productie, afgeleid uit de api-url. */
  floridayOmgeving: "staging" | "productie" | "onbekend";
  /**
   * Of er echt verstuurd wordt. Alle vier de SMTP-velden moeten gevuld zijn; ontbreekt er
   * één, dan valt mail.ts terug op Ethereal en komt er niets aan bij een uitgenodigde
   * collega. Die terugval is stil, en dat is precies waarom hij hier zichtbaar hoort.
   */
  mailViaResend: boolean;
  /** Namen van de SMTP-instellingen die leeg zijn. */
  ontbrekendeMail: string[];
}

const FLORIDAY_VELDEN = [
  "FLORIDAY_TOKEN_URL",
  "FLORIDAY_CUSTOMERS_API_BASE_URL",
  "FLORIDAY_CUSTOMERS_CLIENT_ID",
  "FLORIDAY_CUSTOMERS_CLIENT_SECRET",
  "FLORIDAY_CUSTOMERS_API_KEY",
] as const;

/** Dezelfde vier die sendMail controleert. MAIL_FROM hoort er bewust niet bij: zonder dat
 *  veld valt mail.ts terug op een standaardafzender, maar hij verstuurt wel. */
const SMTP_VELDEN = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"] as const;

export function leesConfiguratie(): Configuratie {
  const env = getEnv();

  // Rechtstreeks uit process.env en niet uit getFloridayEnv(): die gooit zodra er iets
  // ontbreekt, en juist dan wil deze pagina vertellen wát er ontbreekt.
  const ontbrekend = FLORIDAY_VELDEN.filter((naam) => {
    const waarde = process.env[naam];
    return waarde === undefined || waarde.trim() === "";
  });

  const url = env.FLORIDAY_CUSTOMERS_API_BASE_URL ?? "";

  // Exact dezelfde vier velden waar sendMail op beslist; die twee mogen niet uit elkaar
  // lopen, anders meldt dit scherm iets anders dan er gebeurt.
  const ontbrekendeMail = SMTP_VELDEN.filter((naam) => {
    const waarde = process.env[naam];
    return waarde === undefined || waarde.trim() === "";
  });

  return {
    synchronisatieAan: isSyncEnabled(),
    ontbrekend: [...ontbrekend],
    omgeving: process.env.VERCEL_ENV ?? (process.env.VERCEL ? "vercel" : "lokaal"),
    floridayOmgeving: url === "" ? "onbekend" : url.includes("staging") ? "staging" : "productie",
    mailViaResend: ontbrekendeMail.length === 0,
    ontbrekendeMail: [...ontbrekendeMail],
  };
}

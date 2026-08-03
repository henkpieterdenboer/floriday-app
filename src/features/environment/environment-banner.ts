export interface EnvironmentInput {
  /** Wat Vercel zelf zet: "production" | "preview" | "development". Lokaal afwezig. */
  vercelEnv: string | undefined;
  /** De Floriday-basis-URL, om te zien of we tegen staging of productie praten. */
  floridayBaseUrl: string | undefined;
}

export interface BannerState {
  show: boolean;
  message: string;
}

/**
 * Bepaalt of de testbalk getoond wordt, en met welke tekst.
 *
 * De regel is bewust omgekeerd aan wat voor de hand ligt: tonen **tenzij** aantoonbaar
 * productie. Een ontbrekende balk op een testomgeving is gevaarlijker dan een balk te
 * veel — dan denk je dat je naar echte cijfers kijkt terwijl het staging-testdata is.
 * Een onbekende of niet-gezette waarde valt daarom aan de veilige kant.
 *
 * De tekst noemt ook tegen welke Floriday-omgeving de app praat. Dat lijkt overbodig
 * naast "testomgeving", maar het vangt de combinatie af die het meest verwarrend is: een
 * testomgeving die per ongeluk tegen productiegegevens praat, of andersom.
 */
export function resolveBanner(input: EnvironmentInput): BannerState {
  const { vercelEnv, floridayBaseUrl } = input;

  // Bewust NIET isDemoModeAllowed: die twee vallen naar tegengestelde kanten terug bij
  // twijfel, en dat is geen slordigheid maar het hele punt. Zie de toelichting daar.
  if (vercelEnv === "production") {
    return { show: false, message: "" };
  }

  const omgeving = vercelEnv === "preview" ? "Testomgeving" : "Lokale omgeving";

  const floriday = !floridayBaseUrl
    ? "Floriday niet geconfigureerd"
    : floridayBaseUrl.includes("staging")
      ? "Floriday staging"
      : "Floriday productie";

  return { show: true, message: `${omgeving} · ${floriday} · geen echte cijfers` };
}

/**
 * Of demo-besturing (rolwisselaar, e-mailschakelaar) mag draaien. Gebruikt door
 * `/api/auth/switch-role`, `/api/email-provider`, `demo-controls.tsx` en `mail.ts` - één
 * implementatie, zodat niemand een van die plekken vergeet.
 *
 * **Deze valt naar de andere kant terug dan de balk, en dat is opzet.** De balk verschijnt
 * bij twijfel, want een ontbrekende balk laat je denken dat je naar echte cijfers kijkt.
 * Demo-besturing verdwijnt bij twijfel, want de rolwisselaar schrijft naar `User.role`: als
 * die ooit op productie aanstaat, kan elke viewer zichzelf beheerder maken. Allebei "de
 * veilige kant", maar tegengesteld — vandaar twee functies in plaats van één.
 *
 * De regel: toestaan zolang we buiten Vercel draaien (lokale ontwikkeling), en op Vercel
 * alleen bij een expliciete `preview` of `development`.
 *
 * Waarom niet simpelweg `vercelEnv !== "production"`: Vercel kent een instelling
 * "Automatically expose System Environment Variables". Staat die uit, dan is `VERCEL_ENV`
 * leeg — ook op productie. Met die kortere regel zou de rolwisselaar dan juist op productie
 * verschijnen, precies het geval dat hij moet voorkomen.
 *
 * Bewust ook geen `NEXT_PUBLIC_DEMO_MODE`: die reist mee naar de browser en moet met de
 * hand goed gezet worden. Vergeten op preview is hinderlijk; per ongeluk aan op productie is
 * een gat. `VERCEL_ENV` en `VERCEL` zet Vercel zelf.
 */
export function isDemoModeAllowed(
  vercelEnv: string | undefined,
  onVercel: string | undefined,
): boolean {
  // Buiten Vercel (lokaal draaien) is er geen productie om te beschermen.
  if (!onVercel) return true;

  return vercelEnv === "preview" || vercelEnv === "development";
}

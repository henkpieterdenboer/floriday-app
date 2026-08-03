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

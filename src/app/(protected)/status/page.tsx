import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { beoordeelSync, beschrijfDuur, type Stoplicht } from "@/features/sync-status/health";
import { beoordeelSessie, type SessieToestand } from "@/features/sync-status/rfh-sessie";
import {
  haalArchiefTelling,
  haalCursors,
  haalFeedBovengrens,
  haalLaatsteKlokRun,
  haalLaatsteRuns,
  haalLaatsteWijzigingen,
} from "@/features/sync-status/queries";
import { formatInteger, formatPrice } from "@/features/supply-search/format";
import { cn } from "@/lib/utils";
import { leesConfiguratie } from "@/features/sync-status/configuratie";
import { VerversKnop } from "./ververs-knop";
import { IntervalKeuze } from "./interval-keuze";
import { leesInterval } from "@/features/sync-status/interval-store";
import { auth } from "@/features/auth/auth-config";
import { leesSessie } from "@/features/rfh-preauction/client/session-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "API-status - Floriday Middleware" };

const KLEUREN: Record<Stoplicht, { stip: string; rand: string; vlak: string }> = {
  groen: {
    stip: "bg-emerald-500",
    rand: "border-emerald-200 dark:border-emerald-900",
    vlak: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  oranje: {
    stip: "bg-amber-500",
    rand: "border-amber-200 dark:border-amber-900",
    vlak: "bg-amber-50 dark:bg-amber-950/40",
  },
  rood: {
    stip: "bg-red-500",
    rand: "border-red-200 dark:border-red-900",
    vlak: "bg-red-50 dark:bg-red-950/40",
  },
};

// "verlopen" (mislukte poging) en "niet-gekoppeld" (nog nooit gekoppeld) leveren allebei
// geen enkele nieuwe regel op, dus rood. "verouderd" heeft geen fout - de sessie kan zelf
// nog goed zijn - maar 24 uur stilte op een feed zonder volgnummer is precies het scenario
// waar niemand het opvalt; dat verdient oranje, niet groen.
const SESSIE_KLEUR: Record<SessieToestand, Stoplicht> = {
  "niet-gekoppeld": "rood",
  verlopen: "rood",
  verouderd: "oranje",
  goed: "groen",
};

const SESSIE_KOP: Record<SessieToestand, string> = {
  "niet-gekoppeld": "Nog niet gekoppeld",
  verlopen: "RFH-sessie verlopen",
  verouderd: "Geen recente vernieuwing",
  goed: "RFH-sessie is in orde",
};

function tijdstip(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

/**
 * "3s", "4m 12s", "2u 5m". Een mislukte backfill kan uren hebben gedraaid voordat hij
 * opgaf; "14624s" is dan wel juist maar onleesbaar.
 */
function duurTekst(seconden: number): string {
  if (seconden < 60) return `${Math.max(1, Math.round(seconden))}s`;
  const minuten = Math.floor(seconden / 60);
  if (minuten < 60) return `${minuten}m ${Math.round(seconden % 60)}s`;
  return `${Math.floor(minuten / 60)}u ${minuten % 60}m`;
}

function Kerncijfer({
  label,
  waarde,
  onder,
}: {
  label: string;
  waarde: string;
  onder?: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg leading-tight font-medium tabular-nums">{waarde}</div>
      {onder ? <div className="mt-0.5 text-xs text-muted-foreground">{onder}</div> : null}
    </div>
  );
}

export default async function StatusPage() {
  const nu = new Date();

  const [runs, wijzigingen, telling, cursors, feed, klokRun, rfhSessie] = await Promise.all([
    haalLaatsteRuns(10),
    haalLaatsteWijzigingen(50),
    haalArchiefTelling(),
    haalCursors(),
    haalFeedBovengrens(),
    haalLaatsteKlokRun(),
    leesSessie(),
  ]);

  // Apart van de Promise.all hierboven: met auth() erbij verliest TypeScript het tuple-type
  // van die array en worden alle vijf impliciet any.
  const interval = await leesInterval();
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const sessieOordeel = beoordeelSessie(rfhSessie, nu);
  const sessieKleur = KLEUREN[SESSIE_KLEUR[sessieOordeel.toestand]];

  const laatste = runs[0] ?? null;
  const laatsteGeslaagd = runs.find((r) => r.status === "SUCCEEDED") ?? null;

  // De bovengrens komt live van Floriday, de cursor uit onze database. Alleen als we beide
  // hebben kan er een uitspraak over "bij zijn" gedaan worden.
  const bijgewerkt =
    feed.bovengrens === null || cursors.aanbod === null
      ? null
      : cursors.aanbod >= feed.bovengrens;

  const config = leesConfiguratie();

  const gezondheid = beoordeelSync({
    synchronisatieAan: config.synchronisatieAan,
    ontbrekendeInstellingen: config.ontbrekend,
    intervalMinuten: interval,
    laatsteGeslaagdeRun: laatsteGeslaagd?.finishedAt ?? null,
    laatsteStatus: (laatste?.status as "SUCCEEDED" | "FAILED" | "RUNNING" | undefined) ?? null,
    waarschuwing: laatste?.warning ?? null,
    bijgewerkt,
    nu,
  });

  const kleur = KLEUREN[gezondheid.kleur];
  const achterstand =
    feed.bovengrens !== null && cursors.aanbod !== null ? feed.bovengrens - cursors.aanbod : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">API-status</h1>
          <p className="text-sm text-muted-foreground">
            De verbinding met de Floriday customers-API en wat er binnenkomt.
          </p>
        </div>
        <VerversKnop />
      </div>

      <div className={cn("flex items-start gap-4 rounded-xl border p-5", kleur.rand, kleur.vlak)}>
        <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
          {gezondheid.kleur === "groen" ? (
            <span
              className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", kleur.stip)}
            />
          ) : null}
          <span className={cn("relative inline-flex h-3.5 w-3.5 rounded-full", kleur.stip)} />
        </span>
        <div className="min-w-0">
          <div className="font-medium">{gezondheid.kop}</div>
          {gezondheid.toelichting ? (
            <p className="mt-1 text-sm text-muted-foreground">{gezondheid.toelichting}</p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {laatsteGeslaagd?.finishedAt
                ? `Laatste synchronisatie ${beschrijfDuur(
                    (nu.getTime() - laatsteGeslaagd.finishedAt.getTime()) / 60_000,
                  )} geleden, om ${tijdstip(laatsteGeslaagd.finishedAt)}.`
                : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kerncijfer
          label="Ons volgnummer"
          waarde={cursors.aanbod === null ? "—" : cursors.aanbod.toString()}
          onder="laatst verwerkte sequenceNumber"
        />
        <Kerncijfer
          label="Volgnummer bij Floriday"
          waarde={feed.bovengrens === null ? "niet op te halen" : feed.bovengrens.toString()}
          onder={
            feed.bovengrens === null
              ? "max-sequence-number gaf een fout"
              : achterstand !== null && achterstand > 0n
                ? `${achterstand} achter`
                : "gelijk — volledig bijgewerkt"
          }
        />
        <Kerncijfer
          label="Laatste synchronisatie"
          waarde={laatsteGeslaagd?.finishedAt ? tijdstip(laatsteGeslaagd.finishedAt) : "—"}
          onder={
            laatsteGeslaagd?.finishedAt
              ? `${beschrijfDuur((nu.getTime() - laatsteGeslaagd.finishedAt.getTime()) / 60_000)} geleden`
              : "nog geen geslaagde run"
          }
        />
        <Kerncijfer
          label="Regels bijgewerkt"
          waarde={laatsteGeslaagd ? formatInteger(laatsteGeslaagd.rowsProcessed) : "—"}
          onder={
            laatsteGeslaagd
              ? `${formatInteger(laatsteGeslaagd.versionsAdded)} nieuwe versies, ${laatsteGeslaagd.pagesProcessed} pagina's`
              : ""
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RFH Pre-Auction — klokaanbod</CardTitle>
          <CardDescription>
            De tweede bron: het volledige klokaanbod snijbloemen, per veildag opgehaald omdat
            deze feed geen volgnummer kent om &ldquo;bij zijn&rdquo; mee te bewijzen. Een gemiste
            veildag is niet opnieuw op te halen, dus stilte hier is de belangrijkste storing om
            op te merken.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            className={cn(
              "flex items-start gap-4 rounded-xl border p-4",
              sessieKleur.rand,
              sessieKleur.vlak,
            )}
          >
            <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
              {sessieOordeel.toestand === "goed" ? (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                    sessieKleur.stip,
                  )}
                />
              ) : null}
              <span className={cn("relative inline-flex h-3.5 w-3.5 rounded-full", sessieKleur.stip)} />
            </span>
            <div className="min-w-0">
              <div className="font-medium">{SESSIE_KOP[sessieOordeel.toestand]}</div>
              <p className="mt-1 text-sm text-muted-foreground">{sessieOordeel.bericht}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kerncijfer
              label="Laatste synchronisatie"
              waarde={klokRun?.finishedAt ? tijdstip(klokRun.finishedAt) : "—"}
              onder={
                klokRun?.finishedAt
                  ? `${beschrijfDuur((nu.getTime() - klokRun.finishedAt.getTime()) / 60_000)} geleden`
                  : "nog geen geslaagde run"
              }
            />
            <Kerncijfer
              label="Regels bijgewerkt"
              waarde={klokRun ? formatInteger(klokRun.rowsProcessed) : "—"}
              onder={
                klokRun
                  ? `${formatInteger(klokRun.versionsAdded)} nieuwe versies, ${klokRun.pagesProcessed} pagina's`
                  : ""
              }
            />
            <Kerncijfer
              label="Uitkomst"
              waarde={
                klokRun === null
                  ? "—"
                  : klokRun.status === "SUCCEEDED"
                    ? "geslaagd"
                    : klokRun.status === "FAILED"
                      ? "mislukt"
                      : "loopt"
              }
            />
          </div>

          {klokRun?.errorMessage ? (
            <p className="text-sm text-destructive">{klokRun.errorMessage}</p>
          ) : null}
          {klokRun?.warning ? (
            <p className="text-xs text-muted-foreground">{klokRun.warning}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instellingen van deze omgeving</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-xs text-muted-foreground">Synchronisatie</div>
            <div className="mt-1 font-mono text-lg leading-tight font-medium">
              {config.synchronisatieAan ? "aan" : "uit"}
            </div>
            <IntervalKeuze huidig={interval} bewerkbaar={isAdmin} />
            {!config.synchronisatieAan ? (
              <div className="mt-1 text-xs text-muted-foreground">
                SYNC_ENABLED=false — de taak slaat over
              </div>
            ) : null}
          </div>
          <Kerncijfer
            label="Floriday-gegevens"
            waarde={config.ontbrekend.length === 0 ? "compleet" : `${config.ontbrekend.length} ontbreekt`}
            onder={config.ontbrekend.length === 0 ? "alle vijf ingevuld" : config.ontbrekend.join(", ")}
          />
          <Kerncijfer
            label="Floriday-omgeving"
            waarde={config.floridayOmgeving}
            onder="afgeleid uit de api-url"
          />
          <Kerncijfer label="Draait op" waarde={config.omgeving} />
          <Kerncijfer
            label="E-mail"
            waarde={config.mailViaResend ? "Resend" : "Ethereal"}
            onder={
              config.mailViaResend
                ? "wordt echt verstuurd"
                : `komt niet aan — ${config.ontbrekendeMail.join(", ")} leeg`
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Het archief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kerncijfer label="Aanbodregels" waarde={formatInteger(telling.regels)} />
          <Kerncijfer
            label="Versies"
            waarde={formatInteger(telling.versies)}
            onder={`${formatInteger(telling.versies - telling.regels)} mutaties`}
          />
          <Kerncijfer label="Nu beschikbaar" waarde={formatInteger(telling.beschikbaar)} />
          <Kerncijfer label="Artikelen" waarde={formatInteger(telling.artikelen)} />
          <Kerncijfer label="Organisaties" waarde={formatInteger(telling.organisaties)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Laatste tien runs</CardTitle>
          <CardDescription>
            De geplande taak kijkt elke minuut en synchroniseert zodra het ingestelde interval
            verstreken is.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {/* Ruimte tussen de kolommen op de cellen zelf: zonder dit lopen een
              rechts-uitgelijnd getal en de kolom erna tegen elkaar aan. */}
          <table className="w-full text-sm [&_td]:pr-4 [&_th]:pr-4 [&_td:last-child]:pr-0 [&_th:last-child]:pr-0">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Gestart</th>
                <th className="pb-2 font-medium">Aanleiding</th>
                <th className="pb-2 font-medium">Uitkomst</th>
                <th className="pb-2 text-right font-medium">Pagina&apos;s</th>
                <th className="pb-2 text-right font-medium">Regels</th>
                <th className="pb-2 text-right font-medium">Versies</th>
                <th className="pb-2 font-medium">Duur</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nog geen enkele run vastgelegd.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const duur =
                    run.finishedAt !== null
                      ? duurTekst((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)
                      : "loopt nog";
                  return (
                    <tr key={run.id} className="border-b last:border-0 align-top">
                      <td className="py-2 whitespace-nowrap">{tijdstip(run.startedAt)}</td>
                      <td className="py-2 text-muted-foreground">{run.trigger.toLowerCase()}</td>
                      <td className="py-2">
                        <Badge
                          variant={
                            run.status === "SUCCEEDED"
                              ? "secondary"
                              : run.status === "FAILED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {run.status === "SUCCEEDED"
                            ? "geslaagd"
                            : run.status === "FAILED"
                              ? "mislukt"
                              : "loopt"}
                        </Badge>
                        {run.errorMessage ? (
                          <div className="mt-1 max-w-md text-xs text-destructive">
                            {run.errorMessage}
                          </div>
                        ) : null}
                        {run.warning ? (
                          <div className="mt-1 max-w-md text-xs text-muted-foreground">
                            {run.warning}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2 text-right tabular-nums">{run.pagesProcessed}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatInteger(run.rowsProcessed)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatInteger(run.versionsAdded)}
                      </td>
                      <td className="py-2 whitespace-nowrap text-muted-foreground">{duur}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Laatste vijftig wijzigingen</CardTitle>
          <CardDescription>
            Wat er als laatste binnenkwam. &ldquo;Nieuw&rdquo; is een regel die wij niet eerder
            zagen; een hoger versienummer betekent dat een bestaande regel veranderde.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {/* Ruimte tussen de kolommen op de cellen zelf: zonder dit lopen een
              rechts-uitgelijnd getal en de kolom erna tegen elkaar aan. */}
          <table className="w-full text-sm [&_td]:pr-4 [&_th]:pr-4 [&_td:last-child]:pr-0 [&_th:last-child]:pr-0">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Gezien</th>
                <th className="pb-2 font-medium">Artikel</th>
                <th className="pb-2 font-medium">Kweker</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Stuks</th>
                <th className="pb-2 text-right font-medium">Prijs</th>
                <th className="pb-2 font-medium">Versie</th>
                <th className="pb-2 text-right font-medium">Volgnummer</th>
              </tr>
            </thead>
            <tbody>
              {wijzigingen.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    Nog niets binnengekomen.
                  </td>
                </tr>
              ) : (
                wijzigingen.map((w) => (
                  <tr key={`${w.supplyLineId}-${w.sequenceNumber}`} className="border-b last:border-0">
                    <td className="py-1.5 whitespace-nowrap text-muted-foreground">
                      {tijdstip(w.observedAt)}
                    </td>
                    <td className="max-w-[16rem] truncate py-1.5">{w.artikel ?? "—"}</td>
                    <td className="max-w-[12rem] truncate py-1.5 text-muted-foreground">
                      {w.kweker ?? "—"}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={cn(
                          "text-xs",
                          w.status === "AVAILABLE" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                      >
                        {w.status === "AVAILABLE" ? "beschikbaar" : "niet beschikbaar"}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatInteger(w.numberOfPieces)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatPrice(Number(w.pricePerPiece), "EUR")}
                    </td>
                    <td className="py-1.5">
                      {w.versie === 1 ? (
                        <Badge variant="outline">nieuw</Badge>
                      ) : (
                        <Badge variant="secondary">versie {w.versie}</Badge>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {w.sequenceNumber.toString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {feed.fout ? (
        <p className="text-xs text-muted-foreground">
          De bovengrens van de feed kon niet worden opgehaald: {feed.fout}
        </p>
      ) : null}
    </div>
  );
}

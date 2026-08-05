/**
 * Legt de huidige stand vast, synchroniseert, en rapporteert wat er veranderd is.
 *
 * Bedoeld om te zien wat er met het levende aanbod gebeurt: welke partijen zijn verkocht of
 * verlopen, welke zijn van prijs of aantal veranderd, en wat is er nieuw bijgekomen.
 *
 * Gebruik:
 *   npm run delta                    vastleggen, synchroniseren, rapporteren
 *   npm run delta -- --alleen-meten  alleen de huidige stand vastleggen, niet synchroniseren
 *   npm run delta -- --pages 5       de synchronisatie na vijf pagina's stoppen
 *   npm run delta -- --env .env.lokaal-productie
 *
 * De momentopname gaat naar export/ als json, dus buiten de database: de synchronisatie
 * schrijft in dezelfde tabellen die we willen vergelijken, en een referentie die daarin
 * meebeweegt is geen referentie. SupplyLineVersion bewaart oude versies weliswaar vanzelf -
 * daar zit een unieke sleutel op (supplyLineId, sequenceNumber), dus een wijziging voegt toe
 * in plaats van te overschrijven - maar dat is de bewering die dit script juist controleert.
 *
 * Veilig om te herhalen. Elke run schrijft een eigen momentopname en de synchronisatie zelf
 * is idempotent: dezelfde pagina twee keer verwerken levert geen dubbele versies op.
 */
import "@/lib/load-env";
import { writeFileSync, mkdirSync } from "node:fs";
import { prisma } from "@/lib/db";
import { runSupplySync } from "@/features/floriday/sync/run-supply-sync";
import { SUPPLY_RESOURCE, readCursor } from "@/features/floriday/sync/cursor";

function heeftVlag(naam: string): boolean {
  return process.argv.includes(`--${naam}`);
}

function readFlag(naam: string): string | undefined {
  const i = process.argv.indexOf(`--${naam}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

interface Momentopname {
  gemaaktOp: string;
  cursor: string;
  regels: number;
  versies: number;
  beschikbaar: number;
  /** De sleutels van alles wat nu te koop staat, met genoeg eromheen om te kunnen vergelijken. */
  beschikbareRegels: {
    supplyLineId: string;
    sequenceNumber: string;
    numberOfPieces: number;
    pricePerPiece: string;
    auctionDate: string;
  }[];
}

async function maakMomentopname(): Promise<Momentopname> {
  const cursor = await readCursor(SUPPLY_RESOURCE);

  const [tellingen] = await prisma.$queryRaw<{ regels: bigint; versies: bigint; av: bigint }[]>`
    SELECT
      (SELECT count(*) FROM "SupplyLine") AS regels,
      (SELECT count(*) FROM "SupplyLineVersion") AS versies,
      (SELECT count(*) FROM "SupplyLine" WHERE status = 'AVAILABLE') AS av
  `;

  const beschikbaar = await prisma.$queryRaw<
    {
      supplyLineId: string;
      sequenceNumber: bigint;
      numberOfPieces: number;
      pricePerPiece: unknown;
      auctionDate: Date;
    }[]
  >`
    SELECT "supplyLineId", "sequenceNumber", "numberOfPieces", "pricePerPiece", "auctionDate"
    FROM "SupplyLine" WHERE status = 'AVAILABLE'
    ORDER BY "supplyLineId"
  `;

  return {
    gemaaktOp: new Date().toISOString(),
    cursor: cursor.toString(),
    regels: Number(tellingen.regels),
    versies: Number(tellingen.versies),
    beschikbaar: Number(tellingen.av),
    beschikbareRegels: beschikbaar.map((r) => ({
      supplyLineId: r.supplyLineId,
      sequenceNumber: r.sequenceNumber.toString(),
      numberOfPieces: r.numberOfPieces,
      pricePerPiece: String(r.pricePerPiece),
      auctionDate: r.auctionDate.toISOString().slice(0, 10),
    })),
  };
}

interface Verschil {
  supplyLineId: string;
  wasStuks: number;
  isStuks: number | null;
  wasPrijs: string;
  isPrijs: string | null;
  isStatus: string | null;
  veranderd: string[];
}

/**
 * Vergelijkt de vastgelegde beschikbare regels met hun huidige stand.
 *
 * Een regel die uit de database zou zijn verdwenen krijgt null-waarden in plaats van te
 * worden overgeslagen: "weg" is een uitkomst die je wilt zien, niet een rij die stilletjes
 * uit het rapport valt.
 */
async function vergelijkBeschikbaar(voor: Momentopname): Promise<Verschil[]> {
  if (voor.beschikbareRegels.length === 0) return [];

  const ids = voor.beschikbareRegels.map((r) => r.supplyLineId);
  const nu = await prisma.$queryRaw<
    { supplyLineId: string; status: string; numberOfPieces: number; pricePerPiece: unknown }[]
  >`
    SELECT "supplyLineId", status::text AS status, "numberOfPieces", "pricePerPiece"
    FROM "SupplyLine" WHERE "supplyLineId" = ANY(${ids}::uuid[])
  `;
  const perId = new Map(nu.map((r) => [r.supplyLineId, r]));

  const verschillen: Verschil[] = [];
  for (const oud of voor.beschikbareRegels) {
    const huidig = perId.get(oud.supplyLineId);
    const veranderd: string[] = [];

    if (!huidig) {
      veranderd.push("verdwenen uit de database");
    } else {
      if (huidig.status !== "AVAILABLE") veranderd.push(`status naar ${huidig.status}`);
      if (huidig.numberOfPieces !== oud.numberOfPieces) {
        veranderd.push(`stuks ${oud.numberOfPieces} naar ${huidig.numberOfPieces}`);
      }
      if (String(huidig.pricePerPiece) !== oud.pricePerPiece) {
        veranderd.push(`prijs ${oud.pricePerPiece} naar ${huidig.pricePerPiece}`);
      }
    }

    if (veranderd.length > 0) {
      verschillen.push({
        supplyLineId: oud.supplyLineId,
        wasStuks: oud.numberOfPieces,
        isStuks: huidig?.numberOfPieces ?? null,
        wasPrijs: oud.pricePerPiece,
        isPrijs: huidig ? String(huidig.pricePerPiece) : null,
        isStatus: huidig?.status ?? null,
        veranderd,
      });
    }
  }
  return verschillen;
}

async function main(): Promise<void> {
  const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const pad = `export/delta-${stempel}.json`;

  console.log("Huidige stand vastleggen...");
  const voor = await maakMomentopname();
  mkdirSync("export", { recursive: true });
  writeFileSync(pad, JSON.stringify(voor, null, 2));

  console.log(`  cursor        ${voor.cursor}`);
  console.log(`  aanbodregels  ${voor.regels.toLocaleString("nl-NL")}`);
  console.log(`  versies       ${voor.versies.toLocaleString("nl-NL")}`);
  console.log(`  beschikbaar   ${voor.beschikbaar.toLocaleString("nl-NL")}`);
  console.log(`  vastgelegd in ${pad}`);

  if (heeftVlag("alleen-meten")) {
    console.log("\n--alleen-meten: er wordt niet gesynchroniseerd.");
    await prisma.$disconnect();
    return;
  }

  const maxPages = readFlag("pages") ? Number(readFlag("pages")) : undefined;
  console.log(`\nSynchroniseren vanaf cursor ${voor.cursor}...`);

  const begonnen = Date.now();
  const resultaat = await runSupplySync({
    trigger: "MANUAL",
    maxPages,
    onProgress: (bericht) => console.log(`  ${bericht}`),
  });

  const duur = Math.round((Date.now() - begonnen) / 1000);
  console.log(`\nKlaar in ${duur}s.`);
  console.log(`  pagina's         ${resultaat.pagesProcessed}`);
  console.log(`  regels verwerkt  ${resultaat.rowsProcessed.toLocaleString("nl-NL")}`);
  console.log(`  versies erbij    ${resultaat.versionsAdded.toLocaleString("nl-NL")}`);
  console.log(`  artikelen erbij  ${resultaat.tradeItemsAdded.toLocaleString("nl-NL")}`);
  console.log(`  einde bereikt    ${resultaat.reachedEnd ? "ja" : "nee"}`);
  // Gemeten tegen /auction/clock-presales-supply/max-sequence-number, de enige bron die de
  // hele feed beschrijft: "bij" is hier een uitspraak, geen aanname.
  console.log(
    `  bijgewerkt       ${
      resultaat.caughtUp === null || resultaat.caughtUp === undefined
        ? "niet vast te stellen"
        : resultaat.caughtUp
          ? `ja, tot volgnummer ${resultaat.feedMaxSequence}`
          : `nee, feed staat op ${resultaat.feedMaxSequence}`
    }`,
  );
  if (resultaat.warning) console.log(`  let op: ${resultaat.warning}`);

  const na = await maakMomentopname();

  console.log("\n--- Wat er veranderd is ---");
  console.log(`  aanbodregels  ${voor.regels.toLocaleString("nl-NL")} -> ${na.regels.toLocaleString("nl-NL")} ` +
    `(${na.regels - voor.regels >= 0 ? "+" : ""}${(na.regels - voor.regels).toLocaleString("nl-NL")} nieuw)`);
  console.log(`  versies       ${voor.versies.toLocaleString("nl-NL")} -> ${na.versies.toLocaleString("nl-NL")} ` +
    `(${na.versies - voor.versies >= 0 ? "+" : ""}${(na.versies - voor.versies).toLocaleString("nl-NL")})`);
  console.log(`  beschikbaar   ${voor.beschikbaar.toLocaleString("nl-NL")} -> ${na.beschikbaar.toLocaleString("nl-NL")}`);

  // Het verschil tussen nieuwe versies en nieuwe regels is wat we tot nu toe nooit gezien
  // hebben: een tweede versie van een regel die er al stond.
  const nieuweRegels = na.regels - voor.regels;
  const echteMutaties = (na.versies - voor.versies) - nieuweRegels;
  console.log(`\n  waarvan mutaties op bestaande regels: ${echteMutaties.toLocaleString("nl-NL")}`);

  const verschillen = await vergelijkBeschikbaar(voor);
  console.log(`\n--- Van de ${voor.beschikbaar} regels die te koop stonden ---`);
  if (verschillen.length === 0) {
    console.log("  geen enkele veranderd.");
  } else {
    console.log(`  ${verschillen.length} veranderd:`);
    const perSoort = new Map<string, number>();
    for (const v of verschillen) {
      for (const reden of v.veranderd) {
        const soort = reden.split(" ").slice(0, 2).join(" ");
        perSoort.set(soort, (perSoort.get(soort) ?? 0) + 1);
      }
    }
    for (const [soort, aantal] of [...perSoort].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${soort}: ${aantal}`);
    }
    console.log("\n  eerste tien:");
    for (const v of verschillen.slice(0, 10)) {
      console.log(`    ${v.supplyLineId.slice(0, 8)}  ${v.veranderd.join("; ")}`);
    }
  }

  const naPad = pad.replace(".json", "-na.json");
  writeFileSync(naPad, JSON.stringify({ na, verschillen }, null, 2));
  console.log(`\nStand achteraf en verschillen: ${naPad}`);
  console.log("Voor het levende aanbod van nu: npm run export-aanbod -- --selectie beschikbaar");

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

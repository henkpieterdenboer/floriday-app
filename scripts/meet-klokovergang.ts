/**
 * Meet of onverkochte voorverkooppartijen daadwerkelijk op de klok belanden.
 *
 * Dit is de meting uit §11.1 van de spec. De vraag: de documentatie van RFH zegt dat
 * onverkochte klokvoorverkoop na sluiting van het ordervenster wordt toegewezen als
 * klok-supply. Op 6 augustus 2026 zagen wij 96 van onze 252 voorverkoopregels voor de
 * volgende veildag *niet* op de klok staan, waarvan 79 met status UNAVAILABLE en stuks > 0
 * - precies de categorie die zou moeten doorschuiven. Die meting viel midden in de
 * overgang, dus zei nog niets.
 *
 * Anders dan de rest van deze feed kijkt dit script over alle drie de hoofdgroepen, niet
 * alleen snijbloemen, omdat de meting van 6 augustus dat ook deed en de getallen anders
 * niet vergelijkbaar zijn.
 *
 * Gebruik: npm run meet-klokovergang -- --dag 2026-08-07
 */
import "@/lib/load-env";
import { prisma } from "@/lib/db";
import { createPreauctionClient } from "@/features/rfh-preauction/client";
import { VEILLOCATIE_SLEUTELS } from "@/features/rfh-preauction/sync/sneden";

const HOOFDGROEPEN = ["1", "2", "3"] as const;

function argument(naam: string): string | undefined {
  const i = process.argv.indexOf(naam);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main(): Promise<void> {
  const dag = argument("--dag") ?? "2026-08-07";
  const sleutel = dag.replaceAll("-", "");

  console.log(`veildag ${dag}, gemeten om ${new Date().toISOString()}\n`);

  const client = createPreauctionClient();

  const klokregels: {
    presaleId: string | null;
    isAuctioned: boolean;
    synthetisch: boolean;
  }[] = [];

  for (const groep of HOOFDGROEPEN) {
    for (const locatie of VEILLOCATIE_SLEUTELS) {
      let skip = 0;
      for (;;) {
        const pagina = await client.zoekKlokaanbod({
          auctionDate: sleutel,
          mainGroupKey: groep,
          auctionLocationKey: locatie,
          skip,
          take: 500,
        });
        for (const r of pagina.results) {
          klokregels.push({
            presaleId: r.clockPresalesSupplyLineId ?? null,
            isAuctioned: r.isAuctioned ?? false,
            synthetisch: r.reference.startsWith("synth_"),
          });
        }
        skip += pagina.results.length;
        if (klokregels.length >= pagina.totalDocuments || pagina.results.length < 500) break;
      }
    }
  }

  const echt = klokregels.filter((r) => !r.synthetisch);
  const opKlok = new Set(echt.map((r) => r.presaleId).filter((id): id is string => id !== null));

  console.log("--- De klokkant ---");
  console.log(`  klokregels totaal        : ${klokregels.length}`);
  console.log(`  waarvan synthetisch      : ${klokregels.length - echt.length}`);
  console.log(`  echte klokregels         : ${echt.length}`);
  console.log(`  met voorverkooplink      : ${opKlok.size}`);
  console.log(`  zonder link              : ${echt.length - echt.filter((r) => r.presaleId).length}`);
  console.log(`  al geveild (isAuctioned) : ${echt.filter((r) => r.isAuctioned).length}`);

  const onze = await prisma.supplyLine.findMany({
    where: { auctionDate: new Date(`${dag}T00:00:00.000Z`) },
    select: { supplyLineId: true, status: true, numberOfPieces: true },
  });

  const nietOpKlok = onze.filter((r) => !opKlok.has(r.supplyLineId));

  const verdeel = (set: typeof onze) => {
    const uit: Record<string, number> = {};
    for (const r of set) {
      const sleutel = `${r.status}/${r.numberOfPieces === 0 ? "nul stuks" : "stuks > 0"}`;
      uit[sleutel] = (uit[sleutel] ?? 0) + 1;
    }
    return uit;
  };

  console.log("\n--- Onze voorverkoopkant ---");
  console.log(`  onze regels voor deze dag : ${onze.length}`);
  console.log(`  daarvan op de klok        : ${onze.length - nietOpKlok.length}`);
  console.log(`  niet op de klok           : ${nietOpKlok.length}`);
  console.log(`  verdeling van die laatste : ${JSON.stringify(verdeel(nietOpKlok))}`);

  console.log("\n--- Het antwoord op §11.1 ---");
  const onverkochtNietOpKlok = nietOpKlok.filter(
    (r) => r.status === "UNAVAILABLE" && r.numberOfPieces > 0,
  ).length;
  console.log(`  UNAVAILABLE met stuks, niet op de klok: ${onverkochtNietOpKlok}`);
  console.log(
    onverkochtNietOpKlok === 0
      ? "  -> alles doorgeschoven; de documentatie klopt."
      : "  -> deze partijen zijn niet op de klok verschenen.",
  );
}

main()
  .catch((error) => {
    console.error(`\nMislukt: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

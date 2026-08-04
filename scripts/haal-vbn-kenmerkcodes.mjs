/**
 * Haalt de VBN-kenmerkcodelijsten bij Floricode op en schrijft ze als TypeScript weg.
 *
 *   node scripts/haal-vbn-kenmerkcodes.mjs
 *
 * De Floriday-API levert artikelkenmerken als paren van `vbnCode` en `vbnValueCode`, zonder
 * namen: je krijgt `S20=070` en verder niets. Die codes zijn geen Floriday-eigen verzinsel
 * maar de sectorstandaard van Floricode, en de lijsten staan publiek als pdf.
 *
 * Waarom uit de pdf halen en niet overtypen: het zijn er ruim tweehonderd, ze veranderen,
 * en een overgetypte lijst is meteen een tweede waarheid. Zo is de herkomst na te lopen en
 * een verversing één commando.
 *
 * De pdf's zetten losse letters uit elkaar voor de opmaak ("S t ee l l en g te"), dus de
 * namen komen er zonder spaties uit ("Minimumsteellengte"). Dat is lelijk maar eenduidig;
 * NETTE_NAMEN hieronder overschrijft dat voor de codes die wij zelf tonen.
 */
import { writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const BRONNEN = [
  { soort: "snijbloemen", url: "https://www.floricode.com/Portals/0/Downloads/VBN%20codes/N-Kenmerkcodes%20snij_4.pdf" },
  { soort: "planten", url: "https://www.floricode.com/Portals/0/Downloads/VBN%20codes/N-Kenmerkcodes%20pot_3.pdf" },
];

/**
 * Voor de codes die als kolom of toelichting in beeld komen, met spaties en hoofdletters
 * zoals een mens ze schrijft. De rest houdt de naam uit de pdf.
 */
const NETTE_NAMEN = {
  S01: "Potmaat",
  S02: "Minimum planthoogte inclusief pot",
  S05: "Rijpheidsstadium",
  S15: "Transporthoogte",
  S20: "Minimum steellengte",
  S21: "Gewicht (gemiddeld)",
  S23: "Minimum bloemdiameter",
  S29: "Minimum bloeiwijzelengte",
  S35: "Minimum bundelgewicht",
  S42: "Maximum steellengte",
  S50: "Bloem-, bes- of vruchtkleur",
  S56: "Teeltwijze",
  S62: "Land van herkomst",
  S98: "Kwaliteitsklasse",
  L11: "Aantal stelen per bos",
  L12: "Aantal bossen per bundel",
  L13: "Aantal stuks per fust",
  L14: "Aantal bossen per fust",
  V14: "RFH-milieucertificeringsstatus",
};

function pakStreamsUit(buffer) {
  const stukken = [];
  let pos = 0;
  while (true) {
    const start = buffer.indexOf("stream", pos);
    if (start === -1) break;
    let begin = start + 6;
    if (buffer[begin] === 0x0d) begin++;
    if (buffer[begin] === 0x0a) begin++;
    const eind = buffer.indexOf("endstream", begin);
    if (eind === -1) break;
    pos = eind + 9;
    try {
      stukken.push(inflateSync(buffer.subarray(begin, eind)).toString("latin1"));
    } catch {
      // Niet elke stream is tekst; afbeeldingen en lettertypen slaan we over.
    }
  }
  return stukken.join("\n");
}

function haalTekst(inhoud) {
  const delen = [];
  const re = /\((?:\\.|[^\\()])*\)/g;
  let m;
  while ((m = re.exec(inhoud)) !== null) {
    delen.push(m[0].slice(1, -1).replace(/\\([()\\])/g, "$1"));
  }
  return delen.join(" ");
}

/**
 * Een kenmerkcode is een hoofdletter met twee cijfers, gevolgd door zijn naam en dan de
 * eerste waardecode van drie cijfers. Alles aan elkaar geplakt omdat de opmaakspaties geen
 * woordgrenzen zijn.
 */
function haalCodes(tekst) {
  const plat = tekst.replace(/\s+/g, "");
  const gevonden = new Map();
  const re = /([A-Z]\d{2})([A-Za-z()\-/.,']{3,60}?)(?=\d{3}|[A-Z]\d{2})/g;
  let m;
  while ((m = re.exec(plat)) !== null) {
    if (!gevonden.has(m[1])) gevonden.set(m[1], m[2]);
  }
  return gevonden;
}

const alle = new Map();
const perBron = [];

for (const bron of BRONNEN) {
  const res = await fetch(bron.url);
  if (!res.ok) {
    console.error(`${bron.soort}: HTTP ${res.status} op ${bron.url}`);
    process.exit(1);
  }
  const codes = haalCodes(haalTekst(pakStreamsUit(Buffer.from(await res.arrayBuffer()))));
  perBron.push(`${bron.soort}: ${codes.size}`);
  // Snijbloemen eerst: waar beide lijsten dezelfde code kennen wint de eerste, en die twee
  // spreken elkaar niet tegen op de codes die wij gebruiken.
  for (const [code, naam] of codes) if (!alle.has(code)) alle.set(code, naam);
}

const gesorteerd = [...alle].sort((a, b) => a[0].localeCompare(b[0]));
const regels = gesorteerd.map(([code, naam]) => {
  const net = NETTE_NAMEN[code] ?? naam;
  return `  ${code}: ${JSON.stringify(net)},`;
});

const bestand = `/**
 * Namen bij de VBN-kenmerkcodes die Floriday als \`vbnCode\` meestuurt.
 *
 * Gegenereerd door scripts/haal-vbn-kenmerkcodes.mjs uit de publieke codelijsten van
 * Floricode - niet met de hand bijwerken, draai dat script opnieuw.
 *
 * Bron: ${BRONNEN.map((b) => b.url).join("\n *        ")}
 * Opgehaald: ${new Date().toISOString().slice(0, 10)} (${perBron.join(", ")})
 */
export const VBN_KENMERKCODES: Record<string, string> = {
${regels.join("\n")}
};

/** De naam bij een code, of de code zelf als die niet in de lijst staat. */
export function kenmerkNaam(code: string): string {
  return VBN_KENMERKCODES[code] ?? code;
}
`;

writeFileSync("src/features/floriday/vbn-kenmerkcodes.ts", bestand);
console.log(`${gesorteerd.length} kenmerkcodes weggeschreven (${perBron.join(", ")}).`);
console.log("Naar: src/features/floriday/vbn-kenmerkcodes.ts");

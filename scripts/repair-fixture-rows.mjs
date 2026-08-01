/**
 * Haalt de aanbodregels en artikelen terug die door de oude integratietests uit het archief
 * verwijderd zijn.
 *
 * Die tests gebruikten de primaire sleutels uit de fixtures, en die fixtures zijn echte
 * API-antwoorden. Hun opruimstap wiste daardoor bij elke testrun echte rijen. Dat is
 * inmiddels verholpen (zie tests/helpers/test-ids.ts), maar de al verdwenen rijen moeten
 * nog terug.
 *
 * Dit script haalt ze rechtstreeks bij Floriday op in plaats van uit de fixture, zodat wat
 * er terugkomt de actuele stand is en niet een momentopname van weken geleden.
 *
 * Eenmalig bedoeld. Opnieuw draaien is ongevaarlijk: bestaat alles al, dan doet het niets.
 *
 * Gebruik: node scripts/repair-fixture-rows.mjs
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

const SCOPES = [
  "role:app",
  "catalog:read",
  "organization:read",
  "supply:read",
  "sales-order:read",
  "delivery-conditions:read",
].join(" ");

function readFixture(name) {
  return JSON.parse(readFileSync(`tests/fixtures/${name}.json`, "utf8"));
}

/**
 * fetch gooit bij een verbroken verbinding in plaats van een antwoord terug te geven, en
 * over tientallen opeenvolgende aanroepen gebeurt dat vroeg of laat. Zonder deze lus
 * stopte dit script halverwege op een ECONNRESET.
 */
async function fetchWithRetry(url, options, attempts = 5) {
  let lastError = "onbekend";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 500));
      }
    }
  }
  throw new Error(`Verbinding bleef falen na ${attempts} pogingen: ${lastError}`);
}

async function getToken() {
  const response = await fetch(process.env.FLORIDAY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FLORIDAY_CUSTOMERS_CLIENT_ID,
      client_secret: process.env.FLORIDAY_CUSTOMERS_CLIENT_SECRET,
      scope: SCOPES,
    }),
  });
  if (!response.ok) throw new Error(`Token: ${response.status}`);
  return (await response.json()).access_token;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Api-Key": process.env.FLORIDAY_CUSTOMERS_API_KEY,
    Accept: "application/json",
  };
  const base = process.env.FLORIDAY_CUSTOMERS_API_BASE_URL;

  const supplyIds = readFixture("supply-page").results.map((r) => r.supplyLineId);
  const tradeItemIds = [...new Set(readFixture("trade-items").map((i) => i.tradeItemId))];

  const missingSupply = (
    await pool.query(
      `SELECT id FROM unnest($1::uuid[]) id
       WHERE id NOT IN (SELECT "supplyLineId" FROM "SupplyLine")`,
      [supplyIds],
    )
  ).rows.map((r) => r.id);

  const missingItems = (
    await pool.query(
      `SELECT id FROM unnest($1::uuid[]) id
       WHERE id NOT IN (SELECT "tradeItemId" FROM "TradeItem")`,
      [tradeItemIds],
    )
  ).rows.map((r) => r.id);

  console.log(`ontbrekend: ${missingSupply.length} aanbodregels, ${missingItems.length} artikelen`);

  if (missingItems.length > 0) {
    const items = await (
      await fetchWithRetry(`${base}/trade-items?tradeItemIds=${missingItems.join(",")}`, { headers })
    ).json();

    for (const item of items) {
      await pool.query(
        `INSERT INTO "TradeItem" ("tradeItemId","supplierOrganizationId","name","vbnProductCode",
           "code","gtin","botanicalNames","countryOfOriginIsoCodes","tradeItemVersion","isDeleted",
           "sequenceNumber","characteristics","photos","packingConfigurations","fetchedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())
         ON CONFLICT ("tradeItemId") DO NOTHING`,
        [
          item.tradeItemId, item.supplierOrganizationId, item.name, item.vbnProductCode,
          item.code, item.gtin, item.botanicalNames ?? [], item.countryOfOriginIsoCodes ?? [],
          item.tradeItemVersion, item.isDeleted, item.sequenceNumber,
          JSON.stringify(item.characteristics), JSON.stringify(item.photos),
          JSON.stringify(item.packingConfigurations),
        ],
      );
    }
    console.log(`  ${items.length} artikelen teruggezet`);
  }

  let restored = 0;
  for (const id of missingSupply) {
    const response = await fetchWithRetry(`${base}/auction/clock-presales-supply/${id}`, { headers });
    if (!response.ok) {
      console.log(`  ${id}: ${response.status}, overgeslagen`);
      continue;
    }
    const r = await response.json();
    const p = r.packingConfiguration;

    await pool.query(
      `INSERT INTO "SupplyLine" ("supplyLineId","status","tradeItemId","tradeItemVersion",
         "pricePerPiece","currency","numberOfPieces","deliveryNoteReference","deliveryNoteCode",
         "deliveryNoteLetter","piecesPerPackage","vbnPackageCode","customPackageId",
         "packagesPerLayer","layersPerLoadCarrier","loadCarrier","tradePeriodStart",
         "tradePeriodEnd","supplierOrganizationId","sequenceNumber","creationDateTime",
         "lastModifiedDateTime","auctionDate","initialAuctionLocation","photoUrl",
         "firstSeenAt","lastSeenAt")
       VALUES ($1,$2::"SupplyStatus",$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19,$20,$21,$22,$23::date,$24::"AuctionLocation",$25,now(),now())
       ON CONFLICT ("supplyLineId") DO NOTHING`,
      [
        r.supplyLineId, r.status, r.tradeItemId, r.tradeItemVersion,
        r.pricePerPiece.value.toFixed(4), r.pricePerPiece.currency, r.numberOfPieces,
        r.deliveryNoteReference, r.deliveryNoteCode, r.deliveryNoteLetter,
        p.piecesPerPackage, p.package.vbnPackageCode, p.package.customPackageId,
        p.packagesPerLayer, p.layersPerLoadCarrier, p.loadCarrier,
        r.tradePeriod.startDateTime, r.tradePeriod.endDateTime,
        r.supplierOrganizationId, r.sequenceNumber, r.creationDateTime,
        r.lastModifiedDateTime, r.auctionDate, r.initialAuctionLocation, r.photoUrl,
      ],
    );

    // Ook een eerste versie, anders staat de regel wel in de actuele stand maar niet in
    // het archief - en juist die twee horen gelijk op te lopen.
    await pool.query(
      `INSERT INTO "SupplyLineVersion" ("supplyLineId","sequenceNumber","observedAt","status",
         "tradeItemId","tradeItemVersion","pricePerPiece","currency","numberOfPieces",
         "deliveryNoteReference","deliveryNoteCode","deliveryNoteLetter","piecesPerPackage",
         "vbnPackageCode","customPackageId","packagesPerLayer","layersPerLoadCarrier",
         "loadCarrier","tradePeriodStart","tradePeriodEnd","supplierOrganizationId",
         "creationDateTime","lastModifiedDateTime","auctionDate","initialAuctionLocation","photoUrl")
       VALUES ($1,$2,now(),$3::"SupplyStatus",$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
               $18,$19,$20,$21,$22,$23::date,$24::"AuctionLocation",$25)
       ON CONFLICT ("supplyLineId","sequenceNumber") DO NOTHING`,
      [
        r.supplyLineId, r.sequenceNumber, r.status, r.tradeItemId, r.tradeItemVersion,
        r.pricePerPiece.value.toFixed(4), r.pricePerPiece.currency, r.numberOfPieces,
        r.deliveryNoteReference, r.deliveryNoteCode, r.deliveryNoteLetter,
        p.piecesPerPackage, p.package.vbnPackageCode, p.package.customPackageId,
        p.packagesPerLayer, p.layersPerLoadCarrier, p.loadCarrier,
        r.tradePeriod.startDateTime, r.tradePeriod.endDateTime,
        r.supplierOrganizationId, r.creationDateTime, r.lastModifiedDateTime,
        r.auctionDate, r.initialAuctionLocation, r.photoUrl,
      ],
    );

    restored += 1;
    await new Promise((resolve) => setTimeout(resolve, 340)); // onder de rate limit blijven
  }

  console.log(`  ${restored} aanbodregels teruggezet`);

  const after = (
    await pool.query(
      `SELECT (SELECT count(*) FROM "SupplyLine") l,
              (SELECT count(*) FROM "SupplyLineVersion") v,
              (SELECT count(*) FROM "TradeItem") t`,
    )
  ).rows[0];
  console.log(`nu: ${after.l} aanbodregels, ${after.v} versies, ${after.t} artikelen`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

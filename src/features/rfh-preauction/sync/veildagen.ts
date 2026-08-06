/**
 * The auction day, as RFH names it: YYYYMMDD in Dutch local time.
 *
 * This is not a formatting detail. Between midnight and 02:00 in summer, the UTC date is
 * still yesterday - and those are exactly the hours in which the next auction day's supply
 * fills up. Computing the day in UTC would make the sync fetch the wrong day every night,
 * silently, and only for the window that matters most.
 */
const AMSTERDAM = "Europe/Amsterdam";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: AMSTERDAM,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function veildagSleutel(moment: Date): string {
  // en-CA formats as YYYY-MM-DD, which is the only locale-stable way to get ISO order out
  // of Intl without assembling the parts by hand.
  return formatter.format(moment).replaceAll("-", "");
}

/** Turns "20260807" into the Date stored in auctionDate: midnight UTC on that calendar day. */
export function sleutelNaarDatum(sleutel: string): Date {
  const jaar = sleutel.slice(0, 4);
  const maand = sleutel.slice(4, 6);
  const dag = sleutel.slice(6, 8);
  return new Date(`${jaar}-${maand}-${dag}T00:00:00.000Z`);
}

/**
 * Which auction days one run covers: yesterday for the closing state, today, and two days
 * ahead because that is as far as supply is created (spec §3.5).
 *
 * What actually protects this near midnight is that the anchor is built from `vandaag` -
 * the day key, already resolved correctly in Amsterdam time - rather than by stepping from
 * `moment` itself. Adding 24-hour multiples in UTC to an arbitrary instant shifts local time
 * by an hour across a DST boundary, and near midnight that shift can land on the wrong
 * calendar day; stepping from the already-resolved key cannot, because the key is the right
 * day before any offset is applied.
 *
 * The anchor is pinned at 12:00 UTC on top of that as extra margin, not because it is load
 * bearing: Amsterdam never has a negative UTC offset, so any anchor hour up to roughly
 * 21:00 UTC would keep the +1/+2 steps inside the same local day. Midday just makes that
 * margin generous instead of tight.
 */
export function veildagenVoorRun(moment: Date, terug = 1, vooruit = 2): string[] {
  const vandaag = veildagSleutel(moment);
  const anker = new Date(
    `${vandaag.slice(0, 4)}-${vandaag.slice(4, 6)}-${vandaag.slice(6, 8)}T12:00:00.000Z`,
  );

  const dagen: string[] = [];
  for (let offset = -terug; offset <= vooruit; offset++) {
    dagen.push(veildagSleutel(new Date(anker.getTime() + offset * 86_400_000)));
  }
  return dagen;
}

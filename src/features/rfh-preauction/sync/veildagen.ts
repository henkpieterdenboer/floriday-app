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
 * Days are stepped from an anchor at 12:00 UTC rather than from `moment` itself. Adding
 * 24 hours to an arbitrary instant shifts local time by an hour across a DST boundary, and
 * near midnight that lands on the wrong calendar day. At midday there is no boundary close
 * enough for an hour to matter.
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

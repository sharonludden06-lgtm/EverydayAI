// UK local time for everything shown in the admin area.
// Timestamps are stored as exact moments (TIMESTAMPTZ); they're only converted here, for display.
// "Europe/London" switches between GMT and BST automatically, so there's never a fixed offset.

export const UK_TIME_ZONE = "Europe/London";

type Moment = Date | string | number | null | undefined;

const valid = (d: Moment) => {
  if (d === null || d === undefined || d === "") return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** A date in UK local time, e.g. "29 Sept 2026". */
export function ukDate(d: Moment, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = valid(d);
  return date ? date.toLocaleDateString("en-GB", { ...options, timeZone: UK_TIME_ZONE }) : "—";
}

/** A date and time in UK local time, e.g. "29 Sept 2026, 10:00". */
export function ukDateTime(d: Moment) {
  const date = valid(d);
  return date
    ? date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: UK_TIME_ZONE,
      })
    : "—";
}

/** A calendar-only date (a DATE column, e.g. a finding's event date), shown exactly as stored with no time-zone shift. */
export function calendarDate(d: Moment) {
  const date = valid(d);
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
}

/** Today's date in the UK as YYYY-MM-DD (for storing), optionally shifted by a number of days. */
export function ukIsoDate(daysAgo = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: UK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  const day = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - daysAgo));
  return day.toISOString().slice(0, 10);
}

/** A readable UK calendar date, e.g. "29 September 2026", for use in prompts. */
export function ukLongDate(daysAgo = 0, now = new Date()) {
  return new Date(`${ukIsoDate(daysAgo, now)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // already a UK calendar date; just format it
  });
}

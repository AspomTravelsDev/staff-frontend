const TIME_ZONE = "Africa/Lagos";
const calendarFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE, year: "numeric", month: "numeric", day: "numeric",
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE, year: "numeric", month: "short", day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true,
});
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "always" });

function calendarDate(date: Date) {
  const parts = calendarFormatter.formatToParts(date);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

/** Readable calendar dates, with the exact Lagos date/time retained in parentheses. */
export function formatReadableDate(value: string | Date | null | undefined, options: { includeTime?: boolean; now?: Date } = {}): string {
  if (!value) return "No date";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const now = options.now ?? new Date();
  const target = calendarDate(date);
  const current = calendarDate(now);
  const days = Math.round((Date.UTC(target.year, target.month - 1, target.day) - Date.UTC(current.year, current.month - 1, current.day)) / 86400000);
  const absoluteDays = Math.abs(days);
  let relative: string;
  if (days === 0) relative = "Today";
  else if (days === -1) relative = "Yesterday";
  else if (days === 1) relative = "Tomorrow";
  else {
    const earlier = days < 0 ? target : current;
    const later = days < 0 ? current : target;
    const months = (later.year - earlier.year) * 12 + later.month - earlier.month - (later.day < earlier.day ? 1 : 0);
    const sign = Math.sign(days);
    if (months >= 12) relative = relativeFormatter.format(sign * Math.floor(months / 12), "year");
    else if (months >= 1) relative = relativeFormatter.format(sign * months, "month");
    else if (absoluteDays >= 7) relative = relativeFormatter.format(sign * Math.floor(absoluteDays / 7), "week");
    else relative = relativeFormatter.format(days, "day");
    relative = relative.charAt(0).toUpperCase() + relative.slice(1);
  }
  const exact = dateFormatter.format(date) + (options.includeTime === false ? "" : ` at ${timeFormatter.format(date)}`);
  return `${relative} (${exact})`;
}

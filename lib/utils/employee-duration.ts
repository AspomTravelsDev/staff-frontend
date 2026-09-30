import { intervalToDuration, parseISO } from "date-fns";

export function formatEmployeeDuration(
  joinDate: string | null | undefined,
  status: "Active" | "Inactive",
  exitDate?: string | null,
  now: Date = new Date(),
): string {
  if (!joinDate) return "—";
  if (status === "Inactive" && !exitDate) return "Exit date not recorded";

  const start = parseISO(joinDate.split(" ")[0]);
  const end = status === "Active" ? now : parseISO(exitDate!.split(" ")[0]);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  if (end < start) return "0 days";

  const duration = intervalToDuration({ start, end });
  if (duration.years) return `${duration.years} year${duration.years === 1 ? "" : "s"}`;
  if (duration.months) return `${duration.months} month${duration.months === 1 ? "" : "s"}`;
  if (duration.days) return `${duration.days} day${duration.days === 1 ? "" : "s"}`;
  return "Less than a day";
}

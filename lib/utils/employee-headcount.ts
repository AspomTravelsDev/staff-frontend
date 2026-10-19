type EmploymentRecord = {
  joinDate: string | null;
  exit_date?: string | null;
  status: "Active" | "Inactive";
};

export function lagosDateKey(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dateKey(value: string | null | undefined): string | null {
  const key = value?.slice(0, 10);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const timestamp = Date.parse(`${key}T00:00:00Z`);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === key
    ? key
    : null;
}

/** Reconstruct week-end headcount from recorded employment dates; exit day is included. */
export function weeklyHeadcount(employees: EmploymentRecord[], asOf: string) {
  const records = employees
    .map((employee) => ({
      joined: dateKey(employee.joinDate),
      exited: dateKey(employee.exit_date),
      status: employee.status,
      hasExit: !!employee.exit_date,
    }))
    .filter(
      (record) =>
        record.joined &&
        (!record.hasExit ||
          (record.exited && record.exited >= record.joined)) &&
        (record.status === "Active" || record.exited),
    );
  const current = new Date(`${asOf}T00:00:00Z`);
  const monday = new Date(current);
  monday.setUTCDate(current.getUTCDate() - ((current.getUTCDay() + 6) % 7));
  const rows = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(monday);
    start.setUTCDate(monday.getUTCDate() - (11 - index) * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const through = index === 11 ? asOf : end.toISOString().slice(0, 10);
    return {
      week: start.toISOString().slice(0, 10),
      through,
      headcount: records.filter(
        (record) =>
          record.joined! <= through &&
          (!record.exited || record.exited >= through),
      ).length,
    };
  });
  return {
    rows,
    excluded: employees.length - records.length,
    recorded: records.length,
  };
}

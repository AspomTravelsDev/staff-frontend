"use client";
import type { ClockInSummary } from "@/lib/api/clock-in";

export function AttendanceStats({
  stats,
  isLoading,
}: {
  stats: ClockInSummary | null;
  isLoading: boolean;
}) {
  const items = [
    ["Clock-in records", stats?.total_clock_ins ?? 0],
    ["On time", stats?.on_time ?? 0],
    ["Late", stats?.late_arrivals ?? 0],
    ["Permitted late", stats?.late_permitted ?? 0],
    ["Late clock-outs", stats?.late_clock_outs ?? 0],
  ] as const;
  return (
    <div className="space-y-2" aria-busy={isLoading}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-muted/20 px-4 py-3 sm:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {stats?.earliest_staff_name && stats.earliest_staff_name !== "-" && (
        <p className="text-xs text-muted-foreground">
          Earliest average arrival: {stats.earliest_staff_name}
          {stats.earliest_staff_time && stats.earliest_staff_time !== "-"
            ? ` · ${stats.earliest_staff_time}`
            : ""}
        </p>
      )}
    </div>
  );
}

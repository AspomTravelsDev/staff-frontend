"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ManagementDashboardSummary } from "@/lib/types/management-dashboard";

const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
const tick = { fill: "var(--muted-foreground)", fontSize: 11 };

export function AttendanceTrendChart({
  rows,
}: {
  rows: ManagementDashboardSummary["trend"];
}) {
  if (!rows.some((row) => row.present > 0))
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No clock-ins recorded in this period.
      </div>
    );
  return (
    <div
      className="h-64 w-full min-w-0"
      role="img"
      aria-label="Daily clock-ins over the last 30 days, grouped into early or on time, late, and late permitted."
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 256 }}
      >
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            tick={tick}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tickFormatter={(value) =>
              String(value).slice(5).split("-").reverse().join("/")
            }
          />
          <YAxis
            allowDecimals={false}
            tick={tick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            labelFormatter={(value) =>
              new Intl.DateTimeFormat("en-GB", {
                timeZone: "Africa/Lagos",
                day: "numeric",
                month: "short",
              }).format(new Date(`${value}T12:00:00+01:00`))
            }
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          <Bar
            dataKey="early"
            name="Early / on time"
            stackId="attendance"
            fill="#059669"
            maxBarSize={22}
          />
          <Bar
            dataKey="late"
            name="Late"
            stackId="attendance"
            fill="#d97706"
            maxBarSize={22}
          />
          <Bar
            dataKey="late_permitted"
            name="Late permitted"
            stackId="attendance"
            fill="#6366f1"
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentOverviewChart({
  rows,
}: {
  rows: ManagementDashboardSummary["departments"];
}) {
  if (!rows.length)
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No active employees to display.
      </div>
    );
  return (
    <div
      className="max-h-96 overflow-y-auto"
      role="img"
      aria-label="Active employee count and today's clock-ins by department."
    >
      <div
        className="w-full min-w-0"
        style={{ height: Math.max(240, rows.length * 45) }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{
            width: 320,
            height: Math.max(240, rows.length * 45),
          }}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={tick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={tick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                String(value).length > 15
                  ? `${String(value).slice(0, 14)}…`
                  : String(value)
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar
              dataKey="employees"
              name="Active employees"
              fill="var(--muted-foreground)"
              maxBarSize={9}
              radius={[0, 3, 3, 0]}
            />
            <Bar
              dataKey="present"
              name="Clocked in today"
              fill="#059669"
              maxBarSize={9}
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

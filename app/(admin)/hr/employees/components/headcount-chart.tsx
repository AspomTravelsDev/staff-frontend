"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { weeklyHeadcount } from "@/lib/utils/employee-headcount";
import type { Employee } from "@/lib/api/employees";

export function HeadcountChart({
  employees,
  asOf,
}: {
  employees: Employee[];
  asOf: string;
}) {
  const { rows, excluded, recorded } = weeklyHeadcount(employees, asOf);
  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    }).format(new Date(`${value}T00:00:00Z`));
  return (
    <Card className="min-w-0 gap-2 py-4 shadow-none">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-sm font-medium">Weekly headcount</CardTitle>
        <p className="text-xs text-muted-foreground">
          Last 12 weeks · current week so far
        </p>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {recorded === 0 ? (
          <p className="flex h-24 items-center text-xs text-muted-foreground">
            Add joining and exit dates to show headcount history.
          </p>
        ) : (
          <div
            className="h-24 min-w-0"
            role="img"
            aria-label={`Weekly headcount over 12 weeks: ${rows.map((row) => `${dateLabel(row.week)}: ${row.headcount}`).join("; ")}. Based on recorded employment dates.`}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 240, height: 96 }}
            >
              <LineChart
                data={rows}
                margin={{ top: 4, right: 6, left: -28, bottom: 0 }}
                accessibilityLayer
              >
                <XAxis
                  dataKey="week"
                  tickFormatter={dateLabel}
                  ticks={[rows[0].week, rows[11].week]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  labelFormatter={(_value, payload) => {
                    const row = payload?.[0]?.payload;
                    return row
                      ? `${dateLabel(row.week)}–${dateLabel(row.through)}${row.week === rows[11].week ? " (so far)" : ""}`
                      : "";
                  }}
                  contentStyle={{
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  dataKey="headcount"
                  name="Employees"
                  type="linear"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {excluded > 0 && (
          <p className="text-xs text-muted-foreground">
            {excluded} {excluded === 1 ? "record excluded" : "records excluded"}
            : missing or inconsistent employment dates.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

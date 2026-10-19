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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AttendanceChartSummary } from "@/lib/utils/attendance-charts";

const tick = { fill: "var(--muted-foreground)", fontSize: 11 };
const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00Z`));

export function AttendanceCharts({
  data,
  onSelectDay,
  onSelectDepartment,
}: {
  data: AttendanceChartSummary | null;
  onSelectDay: (date: string) => void;
  onSelectDepartment: (department: string) => void;
}) {
  if (!data)
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Attendance charts could not load. Refresh the page to try again.
      </div>
    );
  const hasArrivals = data.departments.length > 0;
  const period = `${dateLabel(data.from)}–${dateLabel(data.to)} (${data.from.slice(0, 4)}${data.from.slice(0, 4) !== data.to.slice(0, 4) ? `–${data.to.slice(0, 4)}` : ""})`;
  return (
    <section className="space-y-2" aria-label="Attendance insights">
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Card className="min-w-0 gap-3 py-4 shadow-none">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-medium">
              Daily attendance trend
            </CardTitle>
            <CardDescription className="text-xs">
              {period} · first arrival per person each day
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            {!hasArrivals ? (
              <EmptyChart />
            ) : (
              <>
                <div
                  className="h-40 min-w-0"
                  role="img"
                  aria-label="Daily arrivals split into early or on time, late, and permitted late. Exact counts and record links are available below."
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    initialDimension={{ width: 400, height: 160 }}
                  >
                    <BarChart
                      data={data.days}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                      accessibilityLayer
                      onClick={(state) => {
                        if (state?.activeLabel)
                          onSelectDay(String(state.activeLabel));
                      }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="date"
                        tick={tick}
                        tickFormatter={dateLabel}
                        minTickGap={24}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={tick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(value) => dateLabel(String(value))}
                        cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Bar
                        dataKey="early"
                        name="Early / on time"
                        stackId="arrivals"
                        fill="#059669"
                        maxBarSize={28}
                        isAnimationActive={false}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="late"
                        name="Late"
                        stackId="arrivals"
                        fill="#d97706"
                        maxBarSize={28}
                        isAnimationActive={false}
                        cursor="pointer"
                      />
                      <Bar
                        dataKey="permitted"
                        name="Permitted late"
                        stackId="arrivals"
                        fill="#6366f1"
                        maxBarSize={28}
                        isAnimationActive={false}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Daily counts & records
                  </summary>
                  <div className="mt-2 max-h-52 overflow-auto">
                    <table className="w-full text-left tabular-nums">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Date</th>
                          <th>On time</th>
                          <th>Late</th>
                          <th>Permitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.days.map((day) => (
                          <tr key={day.date} className="border-b last:border-0">
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-8 px-0 text-xs"
                                onClick={() => onSelectDay(day.date)}
                              >
                                {dateLabel(day.date)}
                              </Button>
                            </td>
                            <td>{day.early}</td>
                            <td>{day.late}</td>
                            <td>{day.permitted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-3 py-4 shadow-none">
          <CardHeader className="px-4">
            <CardTitle className="text-sm font-medium">
              On-time rate by department
            </CardTitle>
            <CardDescription className="text-xs">
              {period} · on-time arrivals ÷ recorded arrivals
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            {!hasArrivals ? (
              <EmptyChart />
            ) : (
              <>
                <div
                  className="max-h-40 space-y-3 overflow-auto pr-1"
                  aria-label="Department on-time rates"
                >
                  {data.departments.map((row) => (
                    <button
                      key={row.department}
                      type="button"
                      className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40"
                      onClick={() => onSelectDepartment(row.department)}
                      aria-label={`${row.department}: ${row.rate}% on time, ${row.early} of ${row.arrivals} arrivals. Filter attendance table.`}
                    >
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                        <span className="truncate font-medium">
                          {row.department}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <span className="font-medium">{row.rate}%</span>
                          <span className="ml-2 text-muted-foreground">
                            {row.early}/{row.arrivals}
                          </span>
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-sm bg-muted"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-sm bg-primary/70"
                          style={{ width: `${row.rate}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Select a department to filter the table. Counts show on-time /
                  recorded arrivals.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        On time includes arrivals through 9:05 a.m. Lagos time. Permitted late
        arrivals remain separate. These charts measure recorded arrivals, not
        absences or leave. Departments reflect current staff records.
      </p>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
      No clock-ins recorded for these filters.
    </div>
  );
}

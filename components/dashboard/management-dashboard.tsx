import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AttendanceTrendChart,
  DepartmentOverviewChart,
} from "./management-charts";
import { ManagementRefresh } from "./management-refresh";
import type { ManagementDashboardSummary } from "@/lib/types/management-dashboard";

export function ManagementDashboard({
  data,
}: {
  data: ManagementDashboardSummary;
}) {
  const { attendance, employees, leave, decisions } = data;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(data.generated_at));
  const updated = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data.generated_at));
  const loanHr = "/hr/loan-requests?status=pending_hr&from_date=&to_date=";
  const loanAccounts =
    "/accounts/loan-requests?status=pending_accounts&from_date=&to_date=";
  const advanceHr =
    "/hr/salary-advance-requests?status=pending_hr&from_date=&to_date=";
  const advanceAccounts =
    "/accounts/salary-advance-requests?status=pending_accounts&from_date=&to_date=";
  const attention = [
    {
      label: "Recruitment reviews",
      count: decisions.recruitment,
      href: "/hr/recruitment",
      detail: "Candidates submitted by HR",
      queues: [],
    },
    {
      label: "Leave approvals",
      count: decisions.leave,
      href: "/hr/leave",
      detail: "Requests awaiting a decision",
      queues: [],
    },
    {
      label: "Loan approvals",
      count: decisions.loans,
      href:
        decisions.loan_hr || !decisions.loan_accounts ? loanHr : loanAccounts,
      detail: "No loan approvals pending",
      queues: [
        { label: "HR", count: decisions.loan_hr, href: loanHr },
        {
          label: "Accounts",
          count: decisions.loan_accounts,
          href: loanAccounts,
        },
      ].filter((queue) => queue.count > 0),
    },
    {
      label: "Salary advances",
      count: decisions.salary_advances,
      href:
        decisions.advance_hr || !decisions.advance_accounts
          ? advanceHr
          : advanceAccounts,
      detail: "No salary advances pending",
      queues: [
        { label: "HR", count: decisions.advance_hr, href: advanceHr },
        {
          label: "Accounts",
          count: decisions.advance_accounts,
          href: advanceAccounts,
        },
      ].filter((queue) => queue.count > 0),
    },
  ];
  return (
    <div className="w-full min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Management overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{date} · Lagos</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated {updated}
          </span>
          <ManagementRefresh />
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-3 py-4 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-sm font-medium">
              Attendance today
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <Link
              href="/attendance"
              className="group flex items-baseline gap-2"
            >
              <span className="text-3xl font-semibold tabular-nums">
                {attendance.present}
              </span>
              <span className="text-xs text-muted-foreground">
                {attendance.working_day
                  ? `of ${attendance.expected} expected`
                  : "clock-ins recorded"}
              </span>
              <ArrowUpRight className="ml-auto size-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="font-semibold tabular-nums">{attendance.early}</p>
                <p className="mt-1 text-muted-foreground">Early / on time</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums">{attendance.late}</p>
                <p className="mt-1 text-muted-foreground">Late</p>
              </div>
              <div>
                <p className="font-semibold tabular-nums">
                  {attendance.late_permitted}
                </p>
                <p className="mt-1 text-muted-foreground">Late permitted</p>
              </div>
            </div>
            <p className="border-t pt-2 text-xs text-muted-foreground">
              {!attendance.working_day
                ? "Weekend · no attendance expected"
                : attendance.not_yet_clocked_in > 0
                  ? `${attendance.not_yet_clocked_in} not yet clocked in`
                  : `${attendance.unrecorded} with no clock-in recorded`}
              {attendance.flagged > 0
                ? ` · ${attendance.flagged} flagged for review`
                : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="gap-3 py-4 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-sm font-medium">
              Active employees
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <Link
              href="/hr/employees"
              className="group flex items-center justify-between"
            >
              <span className="text-3xl font-semibold tabular-nums">
                {employees.active}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <div className="space-y-1 text-xs">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Full time</span>
                <span className="tabular-nums">{employees.full_time}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Intern / NYSC</span>
                <span className="tabular-nums">{employees.intern_nysc}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">
                  Other / unspecified
                </span>
                <span className="tabular-nums">{employees.other}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-3 py-4 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-sm font-medium">
              On leave today
            </CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <Link
              href="/hr/leave"
              className="group flex items-center justify-between"
            >
              <span className="text-3xl font-semibold tabular-nums">
                {leave.today}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <p className="text-xs text-muted-foreground">Approved leave only</p>
            <p className="border-t pt-2 text-xs">
              <span className="font-semibold tabular-nums">
                {leave.next_seven_days}
              </span>
              <span className="text-muted-foreground">
                {" "}
                starting leave in the next 7 days
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="gap-3 py-4 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
            <CardTitle className="text-sm font-medium">
              Decisions pending
            </CardTitle>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <a
              href="#management-attention"
              className="group flex items-center justify-between"
            >
              <span className="text-3xl font-semibold tabular-nums">
                {decisions.total}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground" />
            </a>
            <p className="text-xs text-muted-foreground">
              Recruitment, leave, loans and advances
            </p>
            <p className="border-t pt-2 text-xs text-muted-foreground">
              {decisions.total
                ? "Review the queues below"
                : "No decisions waiting for you"}
            </p>
          </CardContent>
        </Card>
      </div>
      <section
        id="management-attention"
        aria-labelledby="attention-heading"
        className="rounded-lg border"
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 id="attention-heading" className="text-sm font-semibold">
            Needs your attention
          </h2>
          <span className="text-xs text-muted-foreground">
            {decisions.total
              ? `${decisions.total} pending`
              : "You're up to date"}
          </span>
        </div>
        <div className="grid divide-y sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0">
          {attention.map((item) => (
            <div
              key={item.label}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-6 text-xl font-semibold tabular-nums">
                {item.count}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  className="text-sm font-medium hover:underline"
                >
                  {item.label}
                </Link>
                {item.queues.length ? (
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {item.queues.map((queue) => (
                      <Link
                        key={queue.label}
                        href={queue.href}
                        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        {`${queue.count} ${queue.label}`}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                )}
              </div>
              <Link
                href={item.href}
                aria-label={`Open ${item.label.toLowerCase()}`}
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowUpRight className="size-4 shrink-0" />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="min-w-0 gap-3 py-4 shadow-none">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base font-semibold">
              Attendance trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Last 30 days · weekdays · currently active staff
            </p>
          </CardHeader>
          <CardContent className="px-3">
            <AttendanceTrendChart rows={data.trend} />
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                View daily counts
              </summary>
              <div className="mt-2 max-h-56 overflow-auto">
                <table className="w-full text-left tabular-nums">
                  <caption className="sr-only">
                    Attendance counts by day
                  </caption>
                  <thead>
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">On time</th>
                      <th className="p-2">Late</th>
                      <th className="p-2">Permitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trend.map((row) => (
                      <tr key={row.date} className="border-t">
                        <td className="p-2">{row.date}</td>
                        <td className="p-2">{row.early}</td>
                        <td className="p-2">{row.late}</td>
                        <td className="p-2">{row.late_permitted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-3 py-4 shadow-none">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base font-semibold">
              Department overview
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Active employees and clock-ins today
            </p>
          </CardHeader>
          <CardContent className="px-3">
            <DepartmentOverviewChart rows={data.departments} />
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                View department counts
              </summary>
              <div className="mt-2 overflow-auto">
                <table className="w-full text-left tabular-nums">
                  <caption className="sr-only">
                    Employee and attendance counts by department
                  </caption>
                  <thead>
                    <tr>
                      <th className="p-2">Department</th>
                      <th className="p-2">Staff</th>
                      <th className="p-2">Present</th>
                      <th className="p-2">Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.departments.map((row) => (
                      <tr key={row.name} className="border-t">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.employees}</td>
                        <td className="p-2">{row.present}</td>
                        <td className="p-2">{row.on_leave}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        On time means clocked in by 9:05 a.m. Lagos. Approved leave is excluded
        from expected attendance; the leave end date is the resumption date. A
        missing clock-in is not a confirmed absence. Department accounts are
        excluded.
      </p>
    </div>
  );
}

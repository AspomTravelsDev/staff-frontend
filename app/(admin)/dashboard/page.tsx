import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  FileText,
  Trophy,
  LucideIcon,
  MailIcon,
  Earth,
  TreePalm,
  Baby,
  Clock10Icon,
} from "lucide-react";

import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { StatsCard } from "@/components/stats-card";
import { ExchangeRateCard } from "@/components/dashboard/exchange-rate-card";
import { EmployeeOfTheMonthCard } from "@/components/dashboard/employee-of-month-card";
import {
  AttendanceStatusBlocks,
  AttendanceStatus,
} from "@/components/dashboard/attendance-status-blocks";
import Link from "next/link";
import { getClockInHistory, getTodayStatus } from "@/lib/api/clock-in";

interface QuickLinkButtonProps {
  icon: LucideIcon;
  title: string;
  url: string;
  color?: string;
  target?: "_blank" | "_self";
}

function QuickLinkButton({
  icon: Icon,
  title,
  url,
  color = "blue",
  target = "_blank",
}: QuickLinkButtonProps) {
  const colorStyles = {
    blue: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100",
    green:
      "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100",
    purple:
      "text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-100",
    orange:
      "text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-100",
    indigo:
      "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-100",
    rose: "text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100",
  };

  return (
    <Link href={url} target={target} className="flex items-center gap-2 ">
      <Button
        variant="outline"
        className={`h-10 w-fit flex items-center justify-center gap-2 transition-colors cursor-pointer ${
          colorStyles[color as keyof typeof colorStyles]
        }`}
      >
        <Icon className="h-6 w-6" />
        <span className="font-semibold">{title}</span>
      </Button>
    </Link>
  );
}

// import { ClockInAction } from "@/components/dashboard/clock-in-action";
import { mockDashboardStats } from "@/lib/data/mock-dashboard";

import { getAllAwards } from "@/lib/api/awards";

// ... imports

export default async function Page() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Fetch both history and today's status in parallel
  const [clockInResponse, todayStatusResponse, allAwards] = await Promise.all([
    getClockInHistory(formatDate(startOfMonth), formatDate(now)),
    getTodayStatus(),
    getAllAwards().catch(() => []), // Fail gracefully
  ]);

  // const todayRecord = todayStatusResponse.success
  //   ? todayStatusResponse.data.data
  //   : null;

  let totalAttendance = 0;
  let lateDays = 0;
  let attendanceStatuses: AttendanceStatus[] = [];

  if (clockInResponse.success) {
    const history = clockInResponse.data.data;
    totalAttendance = history.length;
    const workingDaysThisMonth: Date[] = [];
    const currentDate = new Date(now);

    while (currentDate >= startOfMonth) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysThisMonth.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    workingDaysThisMonth.reverse();

    attendanceStatuses = workingDaysThisMonth.map((workDay) => {
      const dayStr = formatDate(workDay);
      const record = history.find((r) => {
        const recordDate = formatDate(new Date(r.clock_in_at));
        return recordDate === dayStr;
      });

      if (!record) {
        return "absent" as AttendanceStatus;
      }

      const date = new Date(record.clock_in_at);
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();

      const isLate = utcHours > 8 || (utcHours === 8 && utcMinutes > 5);

      if (isLate) {
        lateDays++;
        return "late" as AttendanceStatus;
      }

      return "on-time" as AttendanceStatus;
    });
  }

  const employeeOfTheMonthAward = allAwards.find(
    (a) =>
      (a.award_type === "employee_of_the_month" ||
        a.award_name.toLowerCase().includes("month")) &&
      a.month === formatDate(now).substring(0, 7),
  );

  const employeeOfTheMonth = employeeOfTheMonthAward
    ? {
        name: employeeOfTheMonthAward.user
          ? `${employeeOfTheMonthAward.user.first_name} ${employeeOfTheMonthAward.user.last_name}`
          : "Unknown",
        role: employeeOfTheMonthAward.user?.department || "Staff",
        image: employeeOfTheMonthAward.image?.url || null,
        initials: employeeOfTheMonthAward.user
          ? `${employeeOfTheMonthAward.user.first_name[0]}${employeeOfTheMonthAward.user.last_name[0]}`
          : "EM",
      }
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      {/* ... existing stats grid ... */}
      <div className="grid gap-4 md:grid-cols-4">{/* ... */}</div>

      <div className="flex flex-col gap-4">{/* ... quick links ... */}</div>

      <div className="flex flex-col lg:flex-row gap-4">
        <RecentUpdates className="lg:w-5/7" />
        <EmployeeOfTheMonthCard employee={employeeOfTheMonth} />
      </div>
    </div>
  );
}

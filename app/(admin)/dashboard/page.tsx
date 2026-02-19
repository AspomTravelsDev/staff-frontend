import { Button } from "@/components/ui/button";
import {
  Baby,
  Calendar,
  Clock10Icon,
  Cloud,
  CreditCard,
  Earth,
  FileText,
  Globe2,
  LucideIcon,
  MailIcon,
  TreePalm,
  Trophy,
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

import { mockDashboardStats } from "@/lib/data/mock-dashboard";

import { getAllAwards, getMyAwards } from "@/lib/api/awards";
import { getInitials } from "@/lib/utils";

export default async function Page() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Fetch both history and today's status in parallel
  const [clockInResponse, todayStatusResponse, allAwards, myAwards] =
    await Promise.all([
      getClockInHistory(formatDate(startOfMonth), formatDate(now)),
      getTodayStatus(),
      getAllAwards().catch(() => []), // Fail gracefully
      getMyAwards().catch(() => []), // Fail gracefully
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
      a.award_type === "staff_of_the_month" &&
      a.month === formatDate(now).substring(0, 7),
  );

  const employeeOfTheMonth = employeeOfTheMonthAward
    ? {
        name: employeeOfTheMonthAward.user
          ? employeeOfTheMonthAward.user.name
          : "Unknown",
        role: employeeOfTheMonthAward.user?.department || "Staff",
        image:
          employeeOfTheMonthAward.image?.url ||
          employeeOfTheMonthAward.user?.image_url ||
          null,
        initials: employeeOfTheMonthAward.user
          ? getInitials(employeeOfTheMonthAward.user.name)
          : "EM",
      }
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title={`Attendance - Clock In (${now.toLocaleString("default", { month: "long" })})`}
          icon={Clock10Icon}
          value={`${totalAttendance} / ${
            Array.from({ length: now.getDate() }, (_, i) =>
              new Date(now.getFullYear(), now.getMonth(), i + 1).getDay(),
            ).filter((day) => day !== 0 && day !== 6).length
          }`}
          footer={<AttendanceStatusBlocks statuses={attendanceStatuses} />}
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title={mockDashboardStats.leaveDays.title}
          icon={Calendar}
          value={mockDashboardStats.leaveDays.value}
          description={mockDashboardStats.leaveDays.description}
          variant="dashboard"
          cardColor={mockDashboardStats.leaveDays.color}
        />
        <StatsCard
          title="My Awards"
          icon={Trophy}
          value={myAwards.length.toString()}
          description={`${myAwards.filter((a) => a.month === formatDate(now).substring(0, 7)).length} this month`}
          variant="dashboard"
          cardColor="yellow"
        />
        <ExchangeRateCard />
      </div>

      <div className="flex flex-col gap-4">
        <h6 className="text-sm font-bold">Quick Links</h6>
        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <QuickLinkButton
            icon={TreePalm}
            title="Aspom Website"
            url="https://office.aspomtravels.com"
            color="green"
          />
          <QuickLinkButton
            icon={Cloud}
            title="My Cloud"
            url="https://home.mycloud.com"
            color="blue"
          />
          <QuickLinkButton
            icon={MailIcon}
            title="My Webmail"
            url="https://webmail.aspomtravels.com"
            color="rose"
          />
          <QuickLinkButton
            icon={Earth}
            title="Aspom Travels FAQ"
            url="https://faq.aspomtravels.com/"
            color="blue"
          />
          <QuickLinkButton
            icon={Baby}
            title="Aspom Birth Services"
            url="http://aspombirthservices.com/"
            color="green"
          />
          <QuickLinkButton
            icon={Globe2}
            title="Passport Index"
            url="https://visa-index.netlify.app/"
            color="green"
          />

          <QuickLinkButton
            icon={FileText}
            title="Request Leave"
            url="/my/leave"
            target="_self"
            color="rose"
          />
          <QuickLinkButton
            icon={FileText}
            title="Submit Task Report"
            url="/my/tasks"
            target="_self"
            color="indigo"
          />
          <QuickLinkButton
            icon={CreditCard}
            title="Report IT Issue"
            url="/my/it-issue"
            target="_self"
            color="rose"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <RecentUpdates className="lg:w-5/7" />
        <EmployeeOfTheMonthCard employee={employeeOfTheMonth} />
      </div>
    </div>
  );
}

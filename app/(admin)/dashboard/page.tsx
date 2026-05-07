import {
  Baby,
  Calendar,
  Clock10Icon,
  Cloud,
  CreditCard,
  Earth,
  FileText,
  Globe2,
  MailIcon,
  TreePalm,
  Trophy,
} from "lucide-react";

import { getTodayBirthdays, getTodayAnniversaries } from "@/lib/api/employees";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { StatsCard } from "@/components/stats-card";
import { ExchangeRateCard } from "@/components/dashboard/exchange-rate-card";
import { DashboardCelebrationCard } from "@/components/dashboard/dashboard-celebration-card";
import {
  AttendanceStatusBlocks,
  AttendanceStatus,
} from "@/components/dashboard/attendance-status-blocks";
import { getClockInHistory } from "@/lib/api/clock-in";
import { QuickLinkButton } from "@/components/dashboard/quick-link-button";

import { mockDashboardStats } from "@/lib/data/mock-dashboard";

import { getAllAwards, getMyAwards } from "@/lib/api/awards";
import { isLate } from "@/lib/utils/attendance";
import { getInitials } from "@/lib/utils";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";
import { getRates } from "@/lib/api/rates";
import { getAnnouncements } from "@/lib/api/announcements";

export default async function Page() {
  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const [
    clockInResponse,
    allAwards,
    myAwards,
    ratesResponse,
    announcementsData,
    todayBirthdays,
    todayAnniversaries,
    rolesMetadata,
  ] = await Promise.all([
    getClockInHistory(formatDate(startOfMonth), formatDate(now)),
    getAllAwards().catch(() => []),
    getMyAwards().catch(() => []),
    getRates().catch(() => ({
      success: false as const,
      error: { code: "500", error: "Failed" },
    })),
    getAnnouncements({ status: "approved", limit: 50 }).catch(() => ({
      items: [],
      pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
    })),
    getTodayBirthdays().catch(() => []),
    getTodayAnniversaries().catch(() => []),
    getRolesMetadataContract(),
  ]);

  const roleToDepartment = rolesMetadata.role_to_department;

  const ratesPayload = ratesResponse.success ? ratesResponse.data : null;
  const rates = ratesPayload
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((ratesPayload as any)?.data ?? ratesPayload)
    : null;

  let totalAttendance = 0;
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

      if (isLate(record.clock_in_at)) {
        return "late" as AttendanceStatus;
      }

      return "on-time" as AttendanceStatus;
    });
  }

  const employeeOfTheMonthAward = allAwards.find(
    (a) =>
      a.award_type === "staff_of_the_month" &&
      a.month === formatMonthKey(previousMonthDate),
  );

  const employeeOfTheMonth = employeeOfTheMonthAward
    ? {
        name: employeeOfTheMonthAward.user
          ? employeeOfTheMonthAward.user.name
          : "Unknown",
        role:
          employeeOfTheMonthAward.user?.department ||
          roleToDepartment[employeeOfTheMonthAward.user?.role ?? ""] ||
          "Staff",
        image:
          toProxiedImageUrl(
            employeeOfTheMonthAward.image?.url ||
              employeeOfTheMonthAward.user?.image_url,
          ) || null,
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
        <ExchangeRateCard rates={rates} />
      </div>

      <div className="flex flex-col gap-4">
        <h6 className="text-sm font-bold">Quick Links</h6>
        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <QuickLinkButton
            icon={TreePalm}
            title="Aspom Website"
            url="https://aspomtravels.com"
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
            title="Outlook"
            url="https://outlook.live.com/mail/0/"
            color="sky"
          />
          <QuickLinkButton
            icon={Earth}
            title="Aspom Travels FAQ"
            url="https://faq.aspomtravels.com/"
            color="blue"
          />
          <QuickLinkButton
            icon={Baby}
            title="Birth Services FAQ"
            url="https://aspombirthservices.com/faq/"
            color="green"
          />
          <QuickLinkButton
            icon={Baby}
            title="Aspom Birth Services"
            url="https://aspombirthservices.com/faq/"
            color="green"
          />
          <QuickLinkButton
            icon={Globe2}
            title="Passport Access"
            url="https://passport.aspomtravels.com/"
            color="green"
          />

          <QuickLinkButton
            icon={FileText}
            title="Request Leave"
            url="/my/leave"
            target="_self"
            color="rose"
            disabled={true}
          />
          <QuickLinkButton
            icon={FileText}
            title="Submit To-Do / Report"
            url="/my/tasks"
            target="_self"
            color="indigo"
          />
          <QuickLinkButton
            icon={FileText}
            title="Admin Requests"
            url="/my/requests"
            target="_self"
            color="red"
          />
          <QuickLinkButton
            icon={CreditCard}
            title="IT Info Desk"
            url="/my/it"
            target="_self"
            color="sky"
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
        <RecentUpdates
          className="lg:w-5/7"
          updates={(announcementsData.items ?? []).filter((a) => {
            if (!a.publish_at) return true;
            return new Date(a.publish_at) <= new Date();
          })}
        />
        <DashboardCelebrationCard
          employeeOfTheMonth={employeeOfTheMonth}
          todayBirthdays={todayBirthdays}
          todayAnniversaries={todayAnniversaries}
        />
      </div>
    </div>
  );
}

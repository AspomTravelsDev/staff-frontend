import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getManagementDashboard } from "@/lib/api/management-dashboard";
import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import { renderDataPage } from "@/lib/api/render-data-page";
import {
  Baby,
  Calendar,
  Clock,
  Clock10Icon,
  Cloud,
  CreditCard,
  Earth,
  FileText,
  Globe2,
  MailIcon,
  TreePalm,
  Trophy,
  MessageSquare,
  CalendarCheck2,
} from "lucide-react";

import { getTodayBirthdays, getTodayAnniversaries } from "@/lib/api/employees";
import { getMyLeaveStats, getMyLeaveRequests } from "@/lib/api/leave";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { UpcomingTasksWidget } from "@/components/dashboard/upcoming-tasks-widget";
import { getTaskTrackerDashboardSummary } from "@/lib/api/task-tracker";
import { StatsCard } from "@/components/stats-card";
import { ExchangeRateCard } from "@/components/dashboard/exchange-rate-card";
import { DashboardCelebrationCard } from "@/components/dashboard/dashboard-celebration-card";
import {
  AttendanceStatusBlocks,
  AttendanceStatus,
} from "@/components/dashboard/attendance-status-blocks";
import { getClockInHistory } from "@/lib/api/clock-in";
import { QuickLinkButton } from "@/components/dashboard/quick-link-button";
import { AnonymousCommentDialog } from "@/components/dashboard/anonymous-comment-dialog";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";

import { getAllAwards, getMyAwards } from "@/lib/api/awards";
import { getAttendanceStatusInfo } from "@/lib/utils/attendance";
import { getInitials } from "@/lib/utils";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";
import { getRates } from "@/lib/api/rates";
import { getAnnouncements } from "@/lib/api/announcements";
import { getMyWorkFromHomeRequests } from "@/lib/api/work-from-home";
import { getRandomCheatsheetItems } from "@/lib/api/cheatsheet";
import { CheatsheetCard } from "@/components/dashboard/cheatsheet-card";
import { DashboardTour, DashboardTourButton } from "./components/dashboard-tour";

export default async function Page() {
  const user = await getCurrentUser();
  if (userHasAnyRole(user, ["mp", "md"])) {
    return renderDataPage(async () => {
      const [managementData, awards, announcementsResult] = await Promise.all([
        getManagementDashboard(),
        getAllAwards().catch(() => []),
        getAnnouncements({ status: "approved", limit: 50 }).catch(() => ({
          items: [],
          pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
        })),
      ]);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;
      const spotlightAwards = awards
        .filter((award) => {
          const type = award.award_type?.toLowerCase().replace(/[-\s]+/g, "_");
          return (type === "staff_of_the_month" || type === "employee_of_the_month") && award.month === previousMonthKey;
        })
        .map((award) => ({
          id: award.id,
          name: award.user?.name ?? "Unknown",
          role: award.user?.department || award.user?.role || "Staff",
          image: toProxiedImageUrl(award.image?.url || award.user?.image_url) || null,
          initials: award.user ? getInitials(award.user.name) : "EM",
          awardName: award.award_name || "Staff of the Month",
        }));

      return (
        <ManagementDashboard
          data={managementData}
          spotlightAwards={spotlightAwards}
          announcements={announcementsResult.items ?? []}
        />
      );
    }, "Unable to load management overview");
  }

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
    cheatsheetItems,
    myLeaveStats,
    taskTrackerSummaryResponse,
    workFromHomeResponse,
    leaveRequests,
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
    getRandomCheatsheetItems(2).catch(() => []),
    getMyLeaveStats().catch(() => ({
      totalLeaveDaysLeft: 20,
      allowance: 20,
      casualLeaveDays: 0,
      emergencyLeaveTaken: 0,
      sickLeaveTaken: 0,
      sickInstances: 0,
      unpaidLeaveTaken: 0,
      studyLeaveTaken: 0,
      maternityTaken: false,
      totalDaysAbsent: 0,
      isConfirmed: true,
      tenureMonths: 12,
    })),
    getTaskTrackerDashboardSummary().catch(() => ({
      success: false as const,
      error: { code: "500", error: "Failed" },
    })),
    getMyWorkFromHomeRequests().catch(() => ({ success: false as const, error: { code: "500", error: "Failed" } })),
    getMyLeaveRequests().catch(() => []),
  ]);

  const wfhPayload = workFromHomeResponse.success ? workFromHomeResponse.data?.data : null;
  const approvedWfhRequests = Array.isArray(wfhPayload) ? wfhPayload : (wfhPayload?.data || []);

  const taskTrackerData = taskTrackerSummaryResponse.success
    ? taskTrackerSummaryResponse.data
    : { data: [], stats: { total_pending: 0, overdue: 0, due_soon: 0 } };

  const roleToDepartment = rolesMetadata.role_to_department;

  const ratesPayload = ratesResponse.success ? ratesResponse.data : null;
  const rates = ratesPayload
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((ratesPayload as any)?.data ?? ratesPayload)
    : null;

  let totalAttendance = 0;
  let attendanceStatuses: AttendanceStatus[] = [];
  let hasFlaggedProxy = false;

  if (clockInResponse.success) {
    const history = clockInResponse.data.data;
    totalAttendance = history.length;
    hasFlaggedProxy = history.some((r) => r.is_flagged_proxy);
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

      const isApprovedWfh = approvedWfhRequests.some((request: {status: string; start_date: string; end_date: string}) => request.status === "approved" && dayStr >= request.start_date && dayStr <= request.end_date);
      const isApprovedLeave = leaveRequests.some((request) => request.status.toLowerCase() === "approved" && dayStr >= request.startDate && dayStr < request.endDate);
      if (isApprovedLeave) return "leave" as AttendanceStatus;
      if (isApprovedWfh) return "work-from-home" as AttendanceStatus;

      if (!record) {
        return "absent" as AttendanceStatus;
      }

      const { status } = getAttendanceStatusInfo(record);
      if (record.is_half_day) return "half-day" as AttendanceStatus;
      return status === "proxy" ? "flagged" : status;
    });
    totalAttendance = attendanceStatuses.filter((status) => !["absent", "placeholder", "leave"].includes(status)).length;
  }

  const spotlightAwards = allAwards
    .filter((a) => {
      const awardType = a.award_type?.toLowerCase().replace(/[-\s]+/g, "_");
      const isStaffOfTheMonthType =
        awardType === "staff_of_the_month" ||
        awardType === "employee_of_the_month";

      if (isStaffOfTheMonthType) {
        return a.month === formatMonthKey(previousMonthDate);
      }

      return true;
    })
    .map((award) => ({
      id: award.id,
      name: award.user ? award.user.name : "Unknown",
      role:
        award.user?.department ||
        roleToDepartment[award.user?.role ?? ""] ||
        "Staff",
      image:
        toProxiedImageUrl(
          award.image?.url || award.user?.image_url,
        ) || null,
      initials: award.user ? getInitials(award.user.name) : "EM",
      awardName: award.award_name || "Employee of the Month",
    }));

  return (
    <div className="flex flex-1 flex-col gap-8 pt-2">
      {/* Dashboard Top Header Bar with Tour Button */}
      <div id="tour-dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here is your daily overview, attendance stats, and company updates.
          </p>
        </div>
        <DashboardTourButton />
      </div>

      <div id="tour-dashboard-stats" className="grid gap-4 md:grid-cols-4">
        <div id="tour-attendance-card">
          <StatsCard
            title={`Attendance - Clock In (${now.toLocaleString("default", { month: "long" })})`}
            icon={Clock10Icon}
            value={`${totalAttendance} / ${
              Array.from({ length: now.getDate() }, (_, i) =>
                new Date(now.getFullYear(), now.getMonth(), i + 1).getDay(),
              ).filter((day) => day !== 0 && day !== 6).length
            }`}
            footer={<AttendanceStatusBlocks statuses={attendanceStatuses} showLegend />}
            variant="dashboard"
            cardColor={hasFlaggedProxy ? "red" : "blue"}
          />
        </div>
        <div id="tour-leave-card">
          <StatsCard
            title="Leave Days Remaining"
            icon={Calendar}
            value={`${myLeaveStats.totalLeaveDaysLeft} Days`}
            description={`Out of ${myLeaveStats.allowance || 20} annual days allowance`}
            variant="dashboard"
            cardColor={myLeaveStats.totalLeaveDaysLeft <= 5 ? "red" : "green"}
          />
        </div>
        <div id="tour-awards-card">
          <StatsCard
            title="My Awards"
            icon={Trophy}
            value={myAwards.length.toString()}
            description={`${myAwards.filter((a) => a.month === formatDate(now).substring(0, 7)).length} this month`}
            variant="dashboard"
            cardColor="yellow"
          />
        </div>
        <div id="tour-exchange-rates">
          <ExchangeRateCard rates={rates} />
        </div>
      </div>

      {/* {cheatsheetItems && cheatsheetItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {cheatsheetItems.map((item) => (
            <CheatsheetCard key={item.id} item={item} />
          ))}
        </div>
      )} */}

      <div id="tour-dashboard-quicklinks" className="flex flex-col gap-4">
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
            title="ABS Health Connect"
            url="https://abshealthconnect.com"
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
          />
          <LatePermissionRequestModal
            trigger={
              <button
                type="button"
                className="h-10 px-4 rounded-md border flex items-center justify-center gap-2 transition-all text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 cursor-pointer"
              >
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Late Requests</span>
              </button>
            }
          />
          <QuickLinkButton
            icon={FileText}
            title="Submit To-Do / Report"
            url="/my/tasks"
            target="_self"
            color="indigo"
          />
          <QuickLinkButton
            icon={CalendarCheck2}
            title="Task Tracker"
            url="/my/task-tracker"
            target="_self"
            color="emerald"
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
          <AnonymousCommentDialog
            trigger={
              <button
                type="button"
                className="h-10 px-4 rounded-md border flex items-center justify-center gap-2 transition-all text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-100 cursor-pointer"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Leave Comment</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Upcoming Personal Tasks & Deadlines Widget */}
      {taskTrackerData.data.length > 0 && (
        <div id="tour-dashboard-tasks" className="w-full">
          <UpcomingTasksWidget
            initialTasks={taskTrackerData.data}
            stats={taskTrackerData.stats}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div id="tour-dashboard-updates" className="w-full lg:w-5/7 flex flex-col">
          <RecentUpdates
            className="h-full"
            updates={(announcementsData.items ?? []).filter((a) => {
              if (!a.publish_at) return true;
              return new Date(a.publish_at) <= new Date();
            })}
          />
        </div>
        <div id="tour-dashboard-celebrations" className="w-full lg:w-2/7 flex flex-col">
          <DashboardCelebrationCard
            className="h-full"
            monthlyAwards={spotlightAwards}
            todayBirthdays={todayBirthdays}
            todayAnniversaries={todayAnniversaries}
          />
        </div>
      </div>

      {/* Auto-runner for first-time visitors */}
      <DashboardTour />
    </div>
  );
}

import {
  getClockInHistory,
  getClockInSummary,
  getMyLatePermissionRequests,
  type ClockInRecord,
  type LatePermissionRequestItem,
} from "@/lib/api/clock-in";
import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, History, CalendarClock } from "lucide-react";
import { AttendanceTable } from "./components/attendance-table";
import { LateRequestsTable } from "./components/late-requests-table";
import { isLate } from "@/lib/utils/attendance";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AttendanceTour, AttendanceTourButton } from "./components/attendance-tour";

export default async function MyAttendancePage() {
  const [summaryResponse, historyResponse, lateRequestsResponse] = await Promise.all([
    getClockInSummary(),
    getClockInHistory(),
    getMyLatePermissionRequests(),
  ]);

  let summary = null;
  let history: ClockInRecord[] = [];
  let lateRequests: LatePermissionRequestItem[] = [];
  let totalClockIns = "0";
  let averageDuration = 0;

  if (summaryResponse.success) {
    summary = summaryResponse.data.data;
    totalClockIns = summary.total_clock_ins.toString();
    averageDuration = summary.average_duration_minutes;
  }

  if (historyResponse.success) {
    history = historyResponse.data.data;
  }

  if (lateRequestsResponse.success && lateRequestsResponse.data?.data) {
    // Check structure of response: standard response wrapper vs direct data object
    const resData = lateRequestsResponse.data.data;
    lateRequests = Array.isArray(resData) ? resData : (resData.data || []);
  }

  const unexcusedLateDays = history.filter(
    (record: ClockInRecord) => isLate(record.clock_in_at) && !record.is_late_permitted,
  ).length;

  const permittedLateDays = history.filter(
    (record: ClockInRecord) => isLate(record.clock_in_at) && record.is_late_permitted,
  ).length;

  const onTimeDays = history.filter(
    (record: ClockInRecord) => !isLate(record.clock_in_at),
  ).length;

  const pendingLateCount = lateRequests.filter(
    (req: LatePermissionRequestItem) => req.status === "pending"
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div id="tour-attendance-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View your attendance stats, check-in history, and late requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AttendanceTourButton />
          <div id="tour-late-request-btn">
            <LatePermissionRequestModal />
          </div>
        </div>
      </div>

      <AttendanceTour />

      <div id="tour-attendance-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Clock-Ins"
          icon={Clock}
          value={totalClockIns}
          description="Lifetime check-ins"
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title="On Time"
          icon={CalendarCheck}
          value={onTimeDays.toString()}
          description="Arrivals before 9:05 AM"
          variant="dashboard"
          cardColor="green"
        />
        <StatsCard
          title="Late (Permitted)"
          icon={CalendarCheck}
          value={permittedLateDays.toString()}
          description="Approved late requests"
          variant="dashboard"
          cardColor="purple"
        />
        <StatsCard
          title="Late (Unexcused)"
          icon={AlertTriangle}
          value={unexcusedLateDays.toString()}
          description="Arrivals without approval"
          variant="dashboard"
          cardColor="red"
        />
        <StatsCard
          title="Avg. Duration"
          icon={History}
          value={
            averageDuration
              ? `${Math.floor(averageDuration / 60)}h ${Math.round(
                  averageDuration % 60,
                )}m`
              : "0h 0m"
          }
          description="Per work day"
          variant="dashboard"
          cardColor="purple"
        />
      </div>

      <Tabs id="tour-attendance-tabs" defaultValue="history" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 mb-4">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Attendance History</span>
          </TabsTrigger>
          <TabsTrigger value="late-requests" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>My Late Requests</span>
            {pendingLateCount > 0 ? (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px] h-4">
                {pendingLateCount}
              </Badge>
            ) : lateRequests.length > 0 ? (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4">
                {lateRequests.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-0">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Clock-In History</h2>
            <AttendanceTable history={history} />
          </div>
        </TabsContent>

        <TabsContent value="late-requests" className="mt-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Late Permission Requests</h2>
            </div>
            <LateRequestsTable requests={lateRequests} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import {
  getClockInHistory,
  getClockInSummary,
  getMyLatePermissionRequests,
  type ClockInRecord,
  type LatePermissionRequestItem,
} from "@/lib/api/clock-in";
import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, History, CalendarClock, House } from "lucide-react";
import { AttendanceTable } from "./components/attendance-table";
import { LateRequestsTable } from "./components/late-requests-table";
import { isLate } from "@/lib/utils/attendance";
import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AttendanceTour, AttendanceTourButton } from "./components/attendance-tour";
import { WorkFromHomeRequestDialog } from "@/components/work-from-home-request-dialog";
import { getMyWorkFromHomeRequests } from "@/lib/api/work-from-home";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function MyAttendancePage() {
  const [summaryResponse, historyResponse, lateRequestsResponse, workFromHomeResponse] = await Promise.all([
    getClockInSummary(),
    getClockInHistory(),
    getMyLatePermissionRequests(),
    getMyWorkFromHomeRequests(),
  ]);

  let summary = null;
  let history: ClockInRecord[] = [];
  let lateRequests: LatePermissionRequestItem[] = [];
  let totalClockIns = "0";
  let averageDuration = 0;
  const wfhPayload = workFromHomeResponse.success ? workFromHomeResponse.data?.data : null;
  const workFromHomeRequests = Array.isArray(wfhPayload) ? wfhPayload : (wfhPayload?.data || []);

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
      <div id="tour-attendance-header" className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View your attendance stats, check-in history, and attendance requests
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <AttendanceTourButton />
          <div id="tour-late-request-btn" className="min-w-0">
            <LatePermissionRequestModal />
          </div>
          <WorkFromHomeRequestDialog />
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
        <TabsList aria-label="Attendance sections" className="mb-4 grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1 sm:w-auto sm:gap-1.5">
          <TabsTrigger value="history" className="min-h-11 min-w-0 gap-1 px-1.5 py-2 text-[11px] leading-tight sm:gap-2 sm:px-3 sm:text-xs">
            <Clock className="size-4" />
            <span className="whitespace-normal text-center">History</span>
          </TabsTrigger>
          <TabsTrigger value="work-from-home" className="min-h-11 min-w-0 gap-1 px-1.5 py-2 text-[11px] leading-tight sm:gap-2 sm:px-3 sm:text-xs">
            <House className="size-4" />
            <span className="whitespace-normal text-center">Work from home</span>
            {workFromHomeRequests.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 hidden h-4 px-1.5 py-0 text-[10px] sm:inline-flex">
                {workFromHomeRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="late-requests" className="min-h-11 min-w-0 gap-1 px-1.5 py-2 text-[11px] leading-tight sm:gap-2 sm:px-3 sm:text-xs">
            <CalendarClock className="size-4" />
            <span className="whitespace-normal text-center">Requests</span>
            {pendingLateCount > 0 ? (
              <Badge variant="destructive" className="ml-0.5 h-4 px-1.5 py-0 text-[10px]">
                {pendingLateCount}
              </Badge>
            ) : lateRequests.length > 0 ? (
              <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 py-0 text-[10px]">
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
              <h2 className="text-lg font-semibold">My Attendance Requests</h2>
            </div>
            <LateRequestsTable requests={lateRequests} />
          </div>
        </TabsContent>

        <TabsContent value="work-from-home" className="mt-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">My Work-from-Home Requests</h2>
              <p className="text-sm text-muted-foreground">Approved weekdays count as attended for payroll.</p>
            </div>
            <div className="overflow-x-auto rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Weekdays</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workFromHomeRequests.length ? workFromHomeRequests.map((request: { id: number; start_date: string; end_date: string; days: number; status: string; reviewer_note?: string | null }) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap font-medium">{request.start_date} – {request.end_date}</TableCell>
                      <TableCell>{request.days}</TableCell>
                      <TableCell><Badge variant="outline" className={request.status === "approved" ? "border-sky-200 bg-sky-500/10 text-sky-700 dark:text-sky-300" : request.status === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive" : request.status === "pending" ? "border-amber-200 bg-amber-500/10 text-amber-800 dark:text-amber-300" : ""}>{request.status}</Badge></TableCell>
                      <TableCell className="max-w-sm whitespace-normal text-sm text-muted-foreground">{request.reviewer_note || "—"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No work-from-home requests found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

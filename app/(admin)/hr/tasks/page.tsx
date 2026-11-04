import { AllTasksTable } from "./components/all-tasks-table";
import { TaskFilters } from "./components/task-filters";
import { HRTaskStats } from "./components/task-stats";
import { getDailyTasksOverview } from "@/lib/api/tasks";
import { BackfillReportDialog } from "./components/backfill-report-dialog";
import { format } from "date-fns";
import { getAllClockInsForFilters } from "@/lib/api/clock-in";
import { getApprovedLeaveForExport } from "@/lib/api/leave";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    start_date?: string;
    end_date?: string;
    report_submitted?: string;
    user_id?: string;
  }>;
}

export default async function HRTasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    date: params.date,
    start_date: params.start_date,
    end_date: params.end_date,
    report_submitted:
      params.report_submitted === "true"
        ? true
        : params.report_submitted === "false"
          ? false
          : undefined,
    user_id: params.user_id,
  };

  // Default to today only if no date filter is provided
  if (!filters.date && !filters.start_date && !filters.end_date) {
    filters.date = format(new Date(), "yyyy-MM-dd");
  }

  const fromDate = filters.start_date || filters.date;
  const toDate = filters.end_date || filters.date;

  const [overview, attendanceResult, leaveResult, exportOverview] = await Promise.all([
    getDailyTasksOverview(filters),
    getAllClockInsForFilters(fromDate, toDate, filters.user_id).then(data => ({ data, error: "" })).catch(() => ({ data: [], error: "Attendance could not be loaded." })),
    getApprovedLeaveForExport(fromDate, toDate, filters.user_id).then(data => ({ data, error: "" })).catch(() => ({ data: [], error: "Leave records could not be loaded." })),
    filters.report_submitted !== undefined ? getDailyTasksOverview({ ...filters, report_submitted: undefined }) : Promise.resolve(null),
  ]);

  const records = overview.data;
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Daily Tasks
          </h1>
          <p className="text-muted-foreground">
            Monitor staff daily activities and end-of-day reports.
          </p>
        </div>
        {overview.can_backfill && (
          <BackfillReportDialog
            users={overview.backfill_users}
            initialUserId={filters.user_id}
            initialDate={filters.date}
          />
        )}
      </div>

      <HRTaskStats records={records} />

      <TaskFilters
        filters={filters}
        records={exportOverview?.data ?? records}
        attendance={attendanceResult.data}
        approvedLeaves={leaveResult.data}
        exportError={attendanceResult.error || leaveResult.error}
      />

      <AllTasksTable records={records} isLoading={false} />
    </div>
  );
}

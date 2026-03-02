import { AllTasksTable } from "./components/all-tasks-table";
import { TaskFilters } from "./components/task-filters";
import { getHRTasks } from "./queries";
import { format } from "date-fns";

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

  const records = await getHRTasks(filters);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Daily Tasks
          </h1>
          <p className="text-muted-foreground">
            Monitor staff daily activities and end-of-day reports.
          </p>
        </div>
      </div>

      <TaskFilters filters={filters} records={records} />

      <AllTasksTable records={records} isLoading={false} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { AllTasksTable } from "./components/all-tasks-table";
import { TaskFilters } from "./components/task-filters";
import { useAllDailyTasks } from "@/lib/api/hooks/use-tasks";
import { AllTaskFilters } from "@/types/task-types";
import { format } from "date-fns";

export default function HRTasksPage() {
  const [filters, setFilters] = useState<AllTaskFilters>({
    date: format(new Date(), "yyyy-MM-dd"), // Default to today
  });

  const { data: records, isLoading } = useAllDailyTasks(filters);

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

      <TaskFilters filters={filters} onFilterChange={setFilters} />

      <AllTasksTable records={records || []} isLoading={isLoading} />
    </div>
  );
}

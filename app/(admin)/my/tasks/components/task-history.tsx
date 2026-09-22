"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { useMyDailyTasks } from "@/lib/api/hooks/use-tasks";
import { TaskItem } from "./task-item";
import { TableExportButton } from "@/components/ui/table-export-button";
import { DailyTaskRecord } from "@/types/task-types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Loader2, History, Info } from "lucide-react";
import { CopyTasksButton } from "@/components/tasks/copy-tasks-button";
import type { User } from "@/types/user-types";

interface TaskHistoryProps {
  user?: User | null;
}

export function TaskHistory({ user }: TaskHistoryProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: subDays(new Date(), 1), // Exclude today by default
  });

  const { data: historyRecords, isLoading } = useMyDailyTasks({
    start_date: dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined,
    end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  });

  // Filter out today's record if it accidentally appears in the range
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const filteredHistory = historyRecords
    ?.filter(
      (record) =>
        format(new Date(record.date || record.created_at), "yyyy-MM-dd") !==
        todayStr,
    )
    .sort(
      (a, b) =>
        new Date(b.date || b.created_at).getTime() -
        new Date(a.date || a.created_at).getTime(),
    );

  const exportColumns = [
    {
      header: "Date",
      key: (r: DailyTaskRecord) =>
        r.date || format(new Date(r.created_at), "yyyy-MM-dd"),
    },
    { header: "Total Tasks", key: (r: DailyTaskRecord) => r.tasks.length },
    {
      header: "Completed",
      key: (r: DailyTaskRecord) => r.tasks.filter((t) => t.completed).length,
    },
    {
      header: "Ongoing",
      key: (r: DailyTaskRecord) => r.tasks.filter((t) => !t.completed).length,
    },
    {
      header: "Progress %",
      key: (r: DailyTaskRecord) => {
        const total = r.tasks.length;
        const completed = r.tasks.filter((t) => t.completed).length;
        return total > 0 ? Math.round((completed / total) * 100) + "%" : "0%";
      },
    },
    {
      header: "Report Status",
      key: (r: DailyTaskRecord) =>
        r.report_submitted ? "Submitted" : "Pending",
    },
    {
      header: "First Saved",
      key: (r: DailyTaskRecord) =>
        r.first_saved_at ? format(new Date(r.first_saved_at), "HH:mm") : "-",
    },
    {
      header: "Submitted At",
      key: (r: DailyTaskRecord) =>
        r.report_submitted_at
          ? format(new Date(r.report_submitted_at), "HH:mm")
          : "-",
    },
    {
      header: "Task List",
      key: (r: DailyTaskRecord) =>
        r.tasks
          .map((t) => (t.completed ? "[x] " : "[ ] ") + t.text)
          .join(" | "),
    },
  ];

  return (
    <div id="tour-task-history" className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-col items-start gap-4 px-0 pb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Task History</CardTitle>
            <p className="text-xs text-muted-foreground">
              Review your past daily activities
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 px-4 sm:w-auto sm:px-0">
          {filteredHistory && filteredHistory.length > 0 && (
            <TableExportButton
              data={filteredHistory}
              columns={exportColumns}
              filename={`My_Tasks_${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "Export"}`}
            />
          )}
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="min-w-0 flex-1 scale-95 origin-left sm:flex-none sm:origin-right"
          />
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredHistory || filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/30 border-dashed">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground font-medium">
              No task history found for this range.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different date range.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filteredHistory.map((record) => {
              const date = new Date(record.date || record.created_at);
              const completedCount = record.tasks.filter(
                (t) => t.completed,
              ).length;
              const totalCount = record.tasks.length;

              return (
                <AccordionItem
                  key={record.id}
                  value={`item-${record.id}`}
                  className="border rounded-xl bg-card px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-base capitalize">
                          {format(date, "EEEE, MMM dd, yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {totalCount} {totalCount === 1 ? "task" : "tasks"}{" "}
                            recorded
                          </span>
                          {record.report_submitted && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 py-0 bg-green-50 text-green-700 border-green-200"
                            >
                              Locked/Submitted
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {completedCount}/{totalCount} completed
                        </div>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{
                              width: `${(completedCount / totalCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-2">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        {record.tasks.length} {record.tasks.length === 1 ? "task" : "tasks"} logged
                      </span>
                      <CopyTasksButton
                        tasks={record.tasks}
                        date={record.date || record.created_at}
                        userName={user?.name}
                        staffId={user?.staff_id}
                        department={user?.department}
                        isSubmitted={record.report_submitted}
                        size="sm"
                      />
                    </div>
                    <div className="space-y-2">
                      {record.tasks.map((task, idx) => (
                        <TaskItem
                          key={idx}
                          index={idx}
                          task={task}
                          onUpdate={() => {}} // Read-only
                          onRemove={() => {}} // Read-only
                          disabled={true}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </div>
  );
}

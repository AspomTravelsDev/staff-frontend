"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DailyTaskRecord } from "@/types/task-types";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useSort, type SortConfig } from "@/lib/hooks/use-sort";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getInitials } from "@/lib/utils";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { CopyTasksButton } from "@/components/tasks/copy-tasks-button";

interface AllTasksTableProps {
  records: DailyTaskRecord[];
  isLoading: boolean;
}

function renderSortIcon(
  sortConfig: SortConfig<DailyTaskRecord> | null,
  columnKey: keyof DailyTaskRecord,
) {
  if (sortConfig?.key !== columnKey) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
  }

  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}

export function AllTasksTable({ records, isLoading }: AllTasksTableProps) {
  const sortOptions = useMemo(
    () => ({
      dateFields: [
        "date",
        "first_saved_at",
        "report_submitted_at",
      ] as (keyof DailyTaskRecord)[],
      customSorts: {
        user: (
          a: DailyTaskRecord,
          b: DailyTaskRecord,
          direction: "asc" | "desc",
        ) => {
          const aName = a.user?.name || "";
          const bName = b.user?.name || "";
          if (aName < bName) return direction === "asc" ? -1 : 1;
          if (aName > bName) return direction === "asc" ? 1 : -1;
          return 0;
        },
        completed_count: (
          a: DailyTaskRecord,
          b: DailyTaskRecord,
          direction: "asc" | "desc",
        ) => {
          const aRate =
            a.total_tasks > 0 ? a.completed_count / a.total_tasks : 0;
          const bRate =
            b.total_tasks > 0 ? b.completed_count / b.total_tasks : 0;
          if (aRate < bRate) return direction === "asc" ? -1 : 1;
          if (aRate > bRate) return direction === "asc" ? 1 : -1;
          return 0;
        },
      },
    }),
    [],
  );

  const {
    sortedData: sorted,
    sortConfig,
    handleSort,
  } = useSort(records, sortOptions);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading tasks...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-muted/10 text-muted-foreground">
        No tasks found for the selected filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12.5"></TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("user")}
            >
              <div className="flex items-center">
                Staff Member {renderSortIcon(sortConfig, "user")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">
                Date {renderSortIcon(sortConfig, "date")}
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("completed_count")}
            >
              <div className="flex items-center justify-center">
                Progress {renderSortIcon(sortConfig, "completed_count")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("report_submitted")}
            >
              <div className="flex items-center">
                Status {renderSortIcon(sortConfig, "report_submitted")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("first_saved_at")}
            >
              <div className="flex items-center">
                First Saved At {renderSortIcon(sortConfig, "first_saved_at")}
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("report_submitted_at")}
            >
              <div className="flex items-center justify-end">
                Submitted At {renderSortIcon(sortConfig, "report_submitted_at")}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        {sorted.map((record) => (
          <TaskRow key={record.id} record={record} />
        ))}
      </Table>
    </div>
  );
}

function TaskRow({ record }: { record: DailyTaskRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const completionRate =
    record.total_tasks > 0
      ? Math.round((record.completed_count / record.total_tasks) * 100)
      : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <TableBody
        className={cn(
          "border-b transition-colors",
          isOpen ? "bg-muted/10" : "",
        )}
      >
        <TableRow className="cursor-pointer hover:bg-muted/50 border-0">
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle details</span>
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={toProxiedImageUrl(record.user?.image_url)}
                  className="object-cover object-center"
                />
                <AvatarFallback>
                  {getInitials(record.user?.name || "Unknown")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {record.user?.name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {record.user?.staff_id}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-sm">
            {format(new Date(record.date), "MMM dd, yyyy")}
          </TableCell>
          <TableCell>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {record.completed_count}/{record.total_tasks}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({completionRate}%)
                </span>
              </div>
              <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    completionRate === 100
                      ? "bg-green-500"
                      : completionRate > 50
                        ? "bg-blue-500"
                        : "bg-orange-500",
                  )}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </TableCell>
          <TableCell>
            {record.report_submitted ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200"
              >
                Submitted
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-200 bg-yellow-50"
              >
                Pending
              </Badge>
            )}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {record.first_saved_at
              ? format(new Date(record.first_saved_at), "HH:mm")
              : "-"}
          </TableCell>
          <TableCell className="text-right text-sm text-muted-foreground">
            {record.report_submitted_at
              ? format(new Date(record.report_submitted_at), "HH:mm")
              : "-"}
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30 border-b hover:bg-muted/30">
            <TableCell colSpan={7} className="p-0">
              <div className="p-4 pl-16 grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Detailed Tasks</h4>
                  {record.tasks.length > 0 && (
                    <CopyTasksButton
                      tasks={record.tasks}
                      date={record.date}
                      userName={record.user?.name}
                      staffId={record.user?.staff_id}
                      isSubmitted={record.report_submitted}
                      size="sm"
                    />
                  )}
                </div>
                {record.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 py-1 border-b last:border-0 border-muted/50"
                  >
                    <div className="flex items-start gap-2 text-sm">
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={cn(
                          task.completed &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {task.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 pl-6 text-xs text-muted-foreground">
                      {task.created_at && (
                        <span className="flex items-center gap-1">
                          Added: {format(new Date(task.created_at), "HH:mm")}
                        </span>
                      )}
                      {task.completed_at && (
                        <span className="flex items-center gap-1">
                          Completed:{" "}
                          {format(new Date(task.completed_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {record.tasks.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">
                    No tasks recorded.
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </TableBody>
    </Collapsible>
  );
}

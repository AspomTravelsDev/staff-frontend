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
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getInitials } from "@/lib/utils";
import { toProxiedImageUrl } from "@/lib/utils/image-url";

interface AllTasksTableProps {
  records: DailyTaskRecord[];
  isLoading: boolean;
}

export function AllTasksTable({ records, isLoading }: AllTasksTableProps) {
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
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Staff Member</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Submitted At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TaskRow key={record.id} record={record} />
          ))}
        </TableBody>
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
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
        <>
          <TableRow className="cursor-pointer hover:bg-muted/50">
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
            <TableCell className="text-right text-sm text-muted-foreground">
              {record.report_submitted_at
                ? format(new Date(record.report_submitted_at), "HH:mm")
                : "-"}
            </TableCell>
          </TableRow>
          <CollapsibleContent asChild>
            <TableRow className="bg-muted/30 border-b hover:bg-muted/30">
              <TableCell colSpan={6} className="p-0">
                <div className="p-4 pl-16 grid gap-2">
                  <h4 className="font-semibold text-sm mb-2">Detailed Tasks</h4>
                  {record.tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
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
                      {task.completed_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(task.completed_at), "HH:mm")}
                        </span>
                      )}
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
        </>
      </Collapsible>
    </>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, FileText } from "lucide-react";
import { DailyTaskRecord } from "@/types/task-types";

interface HRTaskStatsProps {
  records: DailyTaskRecord[];
}

export function HRTaskStats({ records }: HRTaskStatsProps) {
  const totalReports = records.length;
  const submittedReports = records.filter((r) => r.report_submitted).length;
  const pendingReports = totalReports - submittedReports;

  // Calculate average completion rate across all reports
  const totalCompletionRate = records.reduce((acc, record) => {
    const rate =
      record.total_tasks > 0
        ? (record.completed_count / record.total_tasks) * 100
        : 0;
    return acc + rate;
  }, 0);

  const avgCompletionRate =
    totalReports > 0 ? Math.round(totalCompletionRate / totalReports) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
          <div className="text-sm font-medium text-muted-foreground">
            Total Reports
          </div>
          <div className="flex items-center gap-2 mt-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{totalReports}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
          <div className="text-sm font-medium text-muted-foreground">
            Submitted
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{submittedReports}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
          <div className="text-sm font-medium text-muted-foreground">
            Pending
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Circle className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{pendingReports}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 pt-4 flex flex-col justify-between h-full">
          <div className="text-sm font-medium text-primary">
            Avg. Completion Rate
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {avgCompletionRate}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

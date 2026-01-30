"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Building, UserMinus } from "lucide-react";
import type { ComplianceStats } from "@/lib/api/compliance";

interface ComplianceStatsProps {
  stats: ComplianceStats;
}

export function ComplianceStatsCards({ stats }: ComplianceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Clock-in</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgClockInTime}</div>
          <p className="text-xs text-muted-foreground">Company wide average</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalIssues}</div>
          <p className="text-xs text-muted-foreground">Reported occurrences</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Offender</CardTitle>
          <UserMinus className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div
            className="text-2xl font-bold truncate"
            title={stats.topOffender?.name || "None"}
          >
            {stats.topOffender?.name || "None"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.topOffender?.count || 0} occurrences
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Department</CardTitle>
          <Building className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div
            className="text-2xl font-bold truncate"
            title={stats.topDepartment?.name || "None"}
          >
            {stats.topDepartment?.name || "None"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.topDepartment?.count || 0} occurrences
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

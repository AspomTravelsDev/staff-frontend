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
import { ClockInRecord } from "@/lib/api/clock-in";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  isLate,
  formatLagosTime,
  formatLagosDate,
} from "@/lib/utils/attendance";

interface AdminAttendanceTableProps {
  history: ClockInRecord[];
  isLoading: boolean;
}

export function AdminAttendanceTable({
  history,
  isLoading,
}: AdminAttendanceTableProps) {
  // Helpers removed in favor of centralized attendance utils

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "A";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Member</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No attendance records found for the selected criteria.
              </TableCell>
            </TableRow>
          ) : (
            history.map((record: any) => {
              const late = isLate(record.clock_in_at);
              const user = record.user || {};

              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground hidden md:inline-block">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatLagosDate(record.clock_in_at)}</TableCell>
                  <TableCell>{formatLagosTime(record.clock_in_at)}</TableCell>
                  <TableCell>
                    {record.clock_out_at
                      ? formatLagosTime(record.clock_out_at)
                      : "-"}
                  </TableCell>

                  <TableCell>
                    {record.duration_minutes
                      ? `${Math.floor(record.duration_minutes / 60)}h ${
                          record.duration_minutes % 60
                        }m`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={late ? "destructive" : "default"}
                      className={!late ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {late ? "Late" : "On Time"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

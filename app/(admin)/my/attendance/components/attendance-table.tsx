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
import {
  isLate,
  formatLagosTime,
  formatLagosDate,
} from "@/lib/utils/attendance";

interface AttendanceTableProps {
  history: ClockInRecord[];
}

export function AttendanceTable({ history }: AttendanceTableProps) {
  // Helpers removed in favor of centralized attendance utils

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={5} className="h-24 text-center">
                No attendance records found.
              </TableCell>
            </TableRow>
          ) : (
            history.map((record) => {
              const late = isLate(record.clock_in_at);
              return (
                <TableRow key={record.id}>
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
                      {late ? "Late Arrival" : "On Time"}
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

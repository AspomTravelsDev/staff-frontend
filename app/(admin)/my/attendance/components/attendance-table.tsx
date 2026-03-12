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
            <TableHead>Method</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No attendance records found.
              </TableCell>
            </TableRow>
          ) : (
            history.map((record) => {
              const late = isLate(record.clock_in_at);
              const method = record.location_method || "ip";
              
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
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 h-5 w-fit ${
                          method === "gps"
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : method === "ip"
                            ? "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                            : method === "exempt"
                            ? "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : method === "disabled"
                            ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {method === "ip"
                          ? "WiFi"
                          : method === "exempt"
                          ? "Exempt"
                          : method === "disabled"
                          ? "Disabled"
                          : method}
                      </Badge>
                      {record.ip_address && (
                        <span className="text-[9px] font-mono text-muted-foreground opacity-70">
                          {record.ip_address}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {record.distance !== undefined ? (
                      <div className="flex flex-col">
                        <span
                          className={
                            record.distance > 500
                              ? "text-destructive font-bold"
                              : ""
                          }
                        >
                          {record.distance}m
                        </span>
                        {method === "gps" && record.accuracy && (
                          <span className="text-[9px] opacity-60">
                            ±{Math.round(record.accuracy)}m
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
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

"use client";

import { useMemo } from "react";
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
import { useSort } from "@/lib/hooks/use-sort";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface AdminAttendanceTableProps {
  history: ClockInRecord[];
  isLoading: boolean;
}

export function AdminAttendanceTable({
  history,
  isLoading,
}: AdminAttendanceTableProps) {
  const sortOptions = useMemo(() => ({
    dateFields: ["clock_in_at", "clock_out_at"] as (keyof ClockInRecord)[],
    customSorts: {
      user: (a: ClockInRecord, b: ClockInRecord, direction: "asc" | "desc") => {
        const aName = a.user ? (a.user.first_name || a.user.name || "") : "";
        const bName = b.user ? (b.user.first_name || b.user.name || "") : "";
        if (aName < bName) return direction === "asc" ? -1 : 1;
        if (aName > bName) return direction === "asc" ? 1 : -1;
        return 0;
      }
    }
  }), []);

  const { sortedData: sorted, sortConfig, handleSort } = useSort(history, sortOptions);

  const SortIcon = ({ columnKey }: { columnKey: keyof ClockInRecord }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };
  // Helpers removed in favor of centralized attendance utils

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
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("user")}
            >
              <div className="flex items-center">Staff Member <SortIcon columnKey="user" /></div>
            </TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("clock_in_at")}
            >
              <div className="flex items-center">Date <SortIcon columnKey="clock_in_at" /></div>
            </TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("clock_out_at")}
            >
              <div className="flex items-center">Clock Out <SortIcon columnKey="clock_out_at" /></div>
            </TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("location_method")}
            >
              <div className="flex items-center">Method <SortIcon columnKey="location_method" /></div>
            </TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("office_name")}
            >
              <div className="flex items-center">Office <SortIcon columnKey="office_name" /></div>
            </TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("distance")}
            >
              <div className="flex items-center">Distance <SortIcon columnKey="distance" /></div>
            </TableHead>
            <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("duration_minutes")}
            >
              <div className="flex items-center">Duration <SortIcon columnKey="duration_minutes" /></div>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No attendance records found for the selected criteria.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((record: ClockInRecord) => {
              const late = isLate(record.clock_in_at);
              const user = record.user;
              const method = record.location_method || "ip";
              const isGps = method === "gps";

              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {user ? (
                            user.first_name || user.last_name ? (
                              `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                            ) : (
                              user.name || "Unknown Staff"
                            )
                          ) : (
                            "Unknown Staff"
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground hidden md:inline-block">
                          {user?.email || "No email"}
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
                          ? "Office WiFi"
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

                  <TableCell>
                    <span className="text-sm font-medium">
                      {record.office_name || "-"}
                    </span>
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
                        {isGps && record.accuracy && (
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
                      className={
                        !late
                          ? "bg-green-600 hover:bg-green-700 text-[10px]"
                          : "text-[10px]"
                      }
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

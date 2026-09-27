"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClockInRecord } from "@/lib/api/clock-in";
import {
  isLate,
  formatLagosTime,
  formatLagosDate,
  getAttendanceStatusInfo,
} from "@/lib/utils/attendance";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceTableProps {
  history: ClockInRecord[];
}

export function AttendanceTable({ history }: AttendanceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRecords = history.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  // Reset page if bounds change
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedHistory = history.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-card">
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
            {totalRecords === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedHistory.map((record) => {
                const late = isLate(record.clock_in_at);
                const method = record.location_method || "ip";

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatLagosDate(record.clock_in_at)}</TableCell>
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
                            method === "qrcode"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : method === "gps"
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
                          {method === "qrcode"
                            ? "Office QR"
                            : method === "ip"
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
                      {(() => {
                        const statusInfo = getAttendanceStatusInfo(record);
                        return (
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 border ${statusInfo.badgeClass}`}
                            >
                              {statusInfo.label}
                            </Badge>
                            {record.late_permission_reason && (
                              <span className="text-[9px] text-muted-foreground italic max-w-[120px] truncate" title={record.late_permission_reason}>
                                {record.late_permission_reason}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-foreground">{startIndex + 1}</strong> to{" "}
              <strong className="text-foreground">
                {Math.min(startIndex + pageSize, totalRecords)}
              </strong>{" "}
              of <strong className="text-foreground">{totalRecords}</strong> records
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {validPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

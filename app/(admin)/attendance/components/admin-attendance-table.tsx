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

interface AdminAttendanceTableProps {
  history: ClockInRecord[];
  isLoading: boolean;
}

export function AdminAttendanceTable({
  history,
  isLoading,
}: AdminAttendanceTableProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isLate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours > 9) return true;
    if (hours === 9 && minutes > 5) return true;
    return false;
  };

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
                  <TableCell>{formatDate(record.clock_in_at)}</TableCell>
                  <TableCell>{formatTime(record.clock_in_at)}</TableCell>
                  <TableCell>
                    {record.clock_out_at
                      ? formatTime(record.clock_out_at)
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

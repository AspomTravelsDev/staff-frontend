"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  ClockInRecord,
  markClockInAsLate,
  flagClockInAsProxy,
  removeClockInProxyFlag,
} from "@/lib/api/clock-in";
import {
  isLate,
  formatLagosTime,
  formatLagosDate,
} from "@/lib/utils/attendance";
import { useSort } from "@/lib/hooks/use-sort";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Clock,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function SortIcon({
  columnKey,
  sortConfig,
}: {
  columnKey: keyof ClockInRecord;
  sortConfig?: {
    key?: keyof ClockInRecord | string;
    direction?: "asc" | "desc";
  } | null;
}) {
  if (sortConfig?.key !== columnKey) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
  }

  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}

function AttendanceActions({
  record,
  onRefresh,
}: {
  record: ClockInRecord;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"late" | "early" | "flag" | "unflag" | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const handleMarkLate = async () => {
    try {
      setLoading("late");
      const res = await markClockInAsLate(record.id, "09:06");
      if (res.success) {
        toast.success("Clock-in time updated to 09:06 AM");
        setOpen(false);
        onRefresh();
      } else {
        toast.error(res.error?.error || "Failed to update record");
      }
    } catch {
      toast.error("Failed to mark as late");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkEarly = async () => {
    try {
      setLoading("early");
      const res = await markClockInAsLate(record.id, "09:00");
      if (res.success) {
        toast.success("Clock-in time updated to 09:00 AM");
        setOpen(false);
        onRefresh();
      } else {
        toast.error(res.error?.error || "Failed to update record");
      }
    } catch {
      toast.error("Failed to mark as early");
    } finally {
      setLoading(null);
    }
  };

  const handleFlagProxy = async () => {
    if (!flagReason.trim()) {
      toast.error("Please enter a reason for flagging");
      return;
    }
    try {
      setLoading("flag");
      const res = await flagClockInAsProxy(record.id, flagReason);
      if (res.success) {
        toast.success("Clock-in flagged as proxy");
        setFlagReason("");
        setOpen(false);
        onRefresh();
      } else {
        toast.error(res.error?.error || "Failed to flag clock-in");
      }
    } catch {
      toast.error("Failed to flag clock-in");
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveFlag = async () => {
    try {
      setLoading("unflag");
      const res = await removeClockInProxyFlag(record.id);
      if (res.success) {
        toast.success("Proxy flag removed successfully");
        setOpen(false);
        onRefresh();
      } else {
        toast.error(res.error?.error || "Failed to remove flag");
      }
    } catch {
      toast.error("Failed to remove flag");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2.5 gap-1">
          Actions
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 flex flex-col gap-3 p-3" align="end">
        <div className="space-y-1">
          <h4 className="font-semibold text-xs leading-none">Attendance Actions</h4>
          <p className="text-muted-foreground text-[10px]">
            Manage record for {record.user?.name || "this user"}
          </p>
        </div>

        <div className="h-px bg-muted" />

        {/* Time adjustment controls */}
        <div className="space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Time Adjustments
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] h-7 border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900 gap-1"
              disabled={loading !== null}
              onClick={handleMarkLate}
            >
              {loading === "late" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              Mark Late
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] h-7 border-green-300 text-green-800 hover:bg-green-50 hover:text-green-900 gap-1"
              disabled={loading !== null}
              onClick={handleMarkEarly}
            >
              {loading === "early" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <UserCheck className="h-3 w-3" />
              )}
              Mark Early
            </Button>
          </div>
        </div>

        <div className="h-px bg-muted" />

        {/* Proxy flag controls */}
        <div className="space-y-2">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Security Flags
          </Label>
          {record.is_flagged_proxy ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] h-7 border-green-300 text-green-800 hover:bg-green-50 hover:text-green-900 gap-1"
              disabled={loading !== null}
              onClick={handleRemoveFlag}
            >
              {loading === "unflag" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              Remove Proxy Flag
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Reason/Note for flag..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="h-7 text-xs px-2"
                disabled={loading !== null}
              />
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-[11px] h-7 gap-1"
                disabled={loading !== null || !flagReason.trim()}
                onClick={handleFlagProxy}
              >
                {loading === "flag" ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ShieldAlert className="h-3 w-3" />
                )}
                Flag as Proxy
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface AdminAttendanceTableProps {
  history: ClockInRecord[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
}

export function AdminAttendanceTable({
  history,
  isLoading,
  currentPage,
  pageSize,
}: AdminAttendanceTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUser();

  const canMarkLate = currentUser?.id === "019c56b9-09c2-729b-84de-a13bfc2b8e8d";

  const sortOptions = useMemo(
    () => ({
      dateFields: ["clock_in_at", "clock_out_at"] as (keyof ClockInRecord)[],
      customSorts: {
        user: (
          a: ClockInRecord,
          b: ClockInRecord,
          direction: "asc" | "desc",
        ) => {
          const aName = a.user ? a.user.first_name || a.user.name || "" : "";
          const bName = b.user ? b.user.first_name || b.user.name || "" : "";

          if (aName < bName) return direction === "asc" ? -1 : 1;
          if (aName > bName) return direction === "asc" ? 1 : -1;
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
  } = useSort(history, sortOptions);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(Math.max(currentPage || 1, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedHistory = sorted.slice(startIndex, startIndex + pageSize);

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-100 items-center justify-center rounded-md border p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("user")}
              >
                <div className="flex items-center">
                  Staff Member{" "}
                  <SortIcon columnKey="user" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("clock_in_at")}
              >
                <div className="flex items-center">
                  Date{" "}
                  <SortIcon columnKey="clock_in_at" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("clock_out_at")}
              >
                <div className="flex items-center">
                  Clock Out{" "}
                  <SortIcon columnKey="clock_out_at" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("location_method")}
              >
                <div className="flex items-center">
                  Method{" "}
                  <SortIcon
                    columnKey="location_method"
                    sortConfig={sortConfig}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("office_name")}
              >
                <div className="flex items-center">
                  Office{" "}
                  <SortIcon columnKey="office_name" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("distance")}
              >
                <div className="flex items-center">
                  Distance{" "}
                  <SortIcon columnKey="distance" sortConfig={sortConfig} />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-foreground"
                onClick={() => handleSort("duration_minutes")}
              >
                <div className="flex items-center">
                  Duration{" "}
                  <SortIcon
                    columnKey="duration_minutes"
                    sortConfig={sortConfig}
                  />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              {canMarkLate && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canMarkLate ? 10 : 9} className="h-24 text-center">
                  No attendance records found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              pagedHistory.map((record) => {
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
                            {user
                              ? user.first_name || user.last_name
                                ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                                : user.name || "Unknown Staff"
                              : "Unknown Staff"}
                          </span>
                          <span className="hidden text-xs text-muted-foreground md:inline-block">
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
                          className={`h-5 w-fit px-1.5 text-[10px] font-bold uppercase tracking-wider ${
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
                        {record.device_name && (
                          <span
                            className="text-[9px] text-muted-foreground opacity-70 truncate max-w-[130px]"
                            title={record.device_name}
                          >
                            {record.device_name}
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
                                ? "font-bold text-destructive"
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
                        ? `${Math.floor(record.duration_minutes / 60)}h ${record.duration_minutes % 60}m`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            record.is_flagged_proxy || late
                              ? "destructive"
                              : "default"
                          }
                          className={
                            record.is_flagged_proxy
                              ? "bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                              : !late
                                ? "bg-green-600 text-[10px] hover:bg-green-700"
                                : "text-[10px]"
                          }
                          title={
                            record.is_flagged_proxy
                              ? record.proxy_reason ||
                                `Flagged: Shared device with ${record.proxy_matched_user?.name || "a colleague"}`
                              : undefined
                          }
                        >
                          {record.is_flagged_proxy
                            ? "Flagged"
                            : late
                              ? "Late Arrival"
                              : "On Time"}
                        </Badge>
                        {record.is_flagged_proxy && record.proxy_matched_user?.name && (
                          <span className="text-[9px] italic text-red-700 dark:text-red-400 font-medium">
                            Shared with {record.proxy_matched_user.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {canMarkLate && (
                      <TableCell className="text-right">
                        <AttendanceActions
                          record={record}
                          onRefresh={() => router.refresh()}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > 0 && totalPages > 1 && (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs italic text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + pageSize, sorted.length)} of {sorted.length}{" "}
            records
          </p>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={createPageUrl(Math.max(1, safePage - 1))}
                  aria-disabled={safePage <= 1}
                  className={
                    safePage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <PaginationItem
                    key={pageNumber}
                    className="hidden sm:inline-block"
                  >
                    <PaginationLink
                      href={createPageUrl(pageNumber)}
                      isActive={safePage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href={createPageUrl(Math.min(totalPages, safePage + 1))}
                  aria-disabled={safePage >= totalPages}
                  className={
                    safePage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}


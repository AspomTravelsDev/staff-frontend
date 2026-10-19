"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Check,
  X,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/lib/api/leave";
import { LeaveDetailsSheet } from "../../../my/leave/components/leave-details-sheet";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterLeaveRequests,
  paginateLeaveRequests,
  type LeaveSort,
} from "@/lib/utils/leave-list";

interface LeaveTableProps {
  requests: LeaveRequest[];
}

export function LeaveTable({ requests }: LeaveTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<LeaveSort>("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const departments = useMemo(
    () =>
      [
        ...new Set(requests.map((row) => row.department).filter(Boolean)),
      ].sort(),
    [requests],
  );
  const types = useMemo(
    () => [...new Set(requests.map((row) => row.type).filter(Boolean))].sort(),
    [requests],
  );
  const filtered = useMemo(
    () =>
      filterLeaveRequests(requests, { search, status, department, type, sort }),
    [requests, search, status, department, type, sort],
  );
  const result = paginateLeaveRequests(filtered, page, pageSize);
  const hasFilters =
    !!search || status !== "all" || department !== "all" || type !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setDepartment("all");
    setType("all");
    setPage(1);
  };

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const formatDateString = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await approveLeaveRequest(id);
      if (!res.success) {
        toast.error(res.error || "Failed to approve request.");
        return;
      }
      toast.success("Leave request approved successfully.");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : "") ||
          "Failed to approve request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setLoadingId(rejectId);
    try {
      const res = await rejectLeaveRequest(rejectId, rejectionReason);
      if (!res.success) {
        toast.error(res.error || "Failed to reject request.");
        return;
      }
      toast.success("Leave request rejected successfully.");
      setRejectOpen(false);
      setRejectionReason("");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : "") ||
          "Failed to reject request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectId(id);
    setRejectionReason("");
    setRejectOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"; // green usually via className override/custom variant if configured
      case "Pending":
        return "secondary"; // or warning
      case "Rejected":
        return "destructive";
      case "Cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <section className="min-w-0 space-y-3" aria-label="Employee leave requests">
      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center">
        <div className="relative col-span-2 min-w-0 lg:min-w-56 lg:flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search leave requests"
            placeholder="Search employee, department or leave type…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 size-9"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="h-9 w-full lg:w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["Pending", "Approved", "Rejected", "Cancelled"].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={department}
          onValueChange={(value) => {
            setDepartment(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by department"
            className="h-9 w-full lg:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter by leave type"
            className="h-9 w-full lg:w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All leave types</SelectItem>
            {types.map((value) => (
              <SelectItem key={value} value={value}>
                <span className="capitalize">{value}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as LeaveSort);
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Sort leave requests"
            className="h-9 w-full lg:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending first</SelectItem>
            <SelectItem value="start_desc">Start date: latest</SelectItem>
            <SelectItem value="start_asc">Start date: earliest</SelectItem>
            <SelectItem value="name">Employee: A–Z</SelectItem>
            <SelectItem value="days">Duration: longest</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Resumption date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {requests.length === 0
                    ? "No leave requests yet."
                    : "No requests match your filters. Try another search or clear the filters."}
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{req.employeeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {req.department}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{req.type}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateString(req.startDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateString(req.endDate)}
                  </TableCell>
                  <TableCell className="tabular-nums">{req.days}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="max-w-[150px] truncate" title={req.reason}>
                      {req.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            Actions for {req.employeeName}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedLeave(req);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {req.status === "Pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-green-600 cursor-pointer"
                              disabled={
                                loadingId !== null || req.status !== "Pending"
                              }
                              onClick={() => handleApprove(req.id)}
                            >
                              <Check className="mr-2 h-4 w-4" />{" "}
                              {loadingId === req.id
                                ? "Processing..."
                                : "Approve"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              disabled={
                                loadingId !== null || req.status !== "Pending"
                              }
                              onClick={() => openRejectDialog(req.id)}
                            >
                              <X className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {result.from}–{result.to} of {filtered.length} requests
          {hasFilters ? ` (of ${requests.length} total)` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Rows per page" className="h-8 w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="px-1 text-xs tabular-nums">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={result.page <= 1}
            onClick={() => setPage(result.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={result.page >= result.totalPages}
            onClick={() => setPage(result.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. This
              will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter rejection details..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(false)}
                disabled={loadingId !== null}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loadingId !== null}
              >
                {loadingId !== null && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reject Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LeaveDetailsSheet
        leave={
          selectedLeave
            ? {
                id: selectedLeave.id,
                type: selectedLeave.type,
                days: selectedLeave.days,
                startDate: selectedLeave.startDate,
                endDate: selectedLeave.endDate,
                reason: selectedLeave.reason,
                status: selectedLeave.status,
                employeeName: selectedLeave.employeeName,
                department: selectedLeave.department,
                attachmentUrl: selectedLeave.attachmentUrl,
                handoverNoteUrl: selectedLeave.handoverNoteUrl,
                rejectionReason: selectedLeave.rejectionReason,
                approvedByName: selectedLeave.approvedByName,
                approvedAt: selectedLeave.approvedAt,
              }
            : null
        }
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </section>
  );
}

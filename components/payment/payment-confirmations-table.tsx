"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  UserRound,
  AlertCircle,
  ExternalLink,
  Download,
  Search,
  X,
  Pencil,
  Ban,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableFilter } from "./table-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { PaymentConfirmation } from "@/lib/api/payment-confirmations";
import { STATUS_COLORS, STATUS_LABELS } from "./payment-confirmation-constants";

import { useTransition } from "react";
import {
  approvePaymentConfirmationAction,
  rejectPaymentConfirmationAction,
  assignPaymentConfirmationAction,
  cancelPaymentConfirmationAction,
} from "@/lib/actions/payment-confirmations";
import {
  PaymentConfirmationDialog,
  type StaffOption,
} from "./payment-confirmation-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";

interface PaymentConfirmationsTableProps {
  confirmations: PaymentConfirmation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  mode: "staff" | "accounts";
  staffList?: StaffOption[];
  currentUserId?: string;
  currentStatus?: string;
  showSubmittedBy?: boolean;
  allowEditActions?: boolean;
}

interface DealRow {
  id: string;
  dealKey: string;
  paymentCount: number;
  hasPending: boolean;
  latestConfirmation: PaymentConfirmation;
  actionConfirmation: PaymentConfirmation;
  submittedByName: string;
  clientName: string;
  payerName: string;
  product: string;
  currency: string;
  amountBilled: number;
  totalAmountPaid: number;
  paymentDate: string;
  status: PaymentConfirmation["status"];
  confirmations: PaymentConfirmation[];
}

function formatCurrency(amount: number | string, currency = "NGN") {
  const symbol = currency === "USD" ? "$" : "₦";
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

function getUserDisplay(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const maybeUser = value as {
      name?: unknown;
      email?: unknown;
      id?: unknown;
    };
    if (typeof maybeUser.name === "string" && maybeUser.name.trim())
      return maybeUser.name;
    if (typeof maybeUser.email === "string" && maybeUser.email.trim())
      return maybeUser.email;
    if (typeof maybeUser.id === "string" && maybeUser.id.trim())
      return maybeUser.id;
  }
  return "—";
}

function getUserId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const maybeUser = value as { id?: unknown };
    if (typeof maybeUser.id === "string" && maybeUser.id.trim()) {
      return maybeUser.id;
    }
  }
  return "";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

function StatusBadge({ status }: { status: PaymentConfirmation["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentConfirmationsTable({
  confirmations,
  pagination,
  mode,
  staffList = [],
  currentUserId = "",
  currentStatus,
  showSubmittedBy = mode === "accounts",
  allowEditActions = false,
}: PaymentConfirmationsTableProps) {
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);
  const [editingConfirmation, setEditingConfirmation] =
    useState<PaymentConfirmation | null>(null);
  const [cancelDialog, setCancelDialog] =
    useState<PaymentConfirmation | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PaymentConfirmation | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignDialog, setAssignDialog] = useState<PaymentConfirmation | null>(
    null,
  );
  const [assignedTo, setAssignedTo] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract unique departments dynamically from staffList
  const departments = useMemo(() => {
    const depts = new Set<string>();
    for (const staff of staffList) {
      if (staff.department) {
        depts.add(staff.department);
      }
    }
    return Array.from(depts).sort();
  }, [staffList]);

  // Date Presets Checker
  const matchesDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (paymentDateStr: string) => {
      if (datePreset === "all") return true;

      const pDate = new Date(paymentDateStr);
      pDate.setHours(0, 0, 0, 0);

      if (datePreset === "7days") {
        const boundary = new Date(today);
        boundary.setDate(today.getDate() - 7);
        return pDate >= boundary;
      }
      if (datePreset === "30days") {
        const boundary = new Date(today);
        boundary.setDate(today.getDate() - 30);
        return pDate >= boundary;
      }
      if (datePreset === "thisMonth") {
        return (
          pDate.getMonth() === today.getMonth() &&
          pDate.getFullYear() === today.getFullYear()
        );
      }
      if (datePreset === "lastMonth") {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return (
          pDate.getMonth() === lastMonth.getMonth() &&
          pDate.getFullYear() === lastMonth.getFullYear()
        );
      }
      if (datePreset === "custom") {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (pDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (pDate > end) return false;
        }
        return true;
      }
      return true;
    };
  }, [datePreset, startDate, endDate]);

  const allFiles = useMemo(() => {
    if (!selectedDeal) return [];
    return selectedDeal.confirmations.flatMap((c) =>
      (c.files || []).map((f) => ({
        ...f,
        confirmationAmount: c.amount_paid,
        confirmationCurrency: c.currency || "NGN",
        confirmationDate: c.payment_date,
      }))
    );
  }, [selectedDeal]);

  const dealRows = useMemo<DealRow[]>(() => {
    const grouped = new Map<string, PaymentConfirmation[]>();

    for (const confirmation of confirmations) {
      const key = confirmation.outstanding_payment_id || confirmation.id;
      const existing = grouped.get(key);
      if (existing) {
        existing.push(confirmation);
      } else {
        grouped.set(key, [confirmation]);
      }
    }

    const parseTime = (value: string | null | undefined) =>
      value ? new Date(value).getTime() : 0;

    const rows = Array.from(grouped.entries()).map(([dealKey, items]) => {
      const byNewest = [...items].sort(
        (a, b) => parseTime(b.created_at) - parseTime(a.created_at),
      );
      const byOldest = [...items].sort(
        (a, b) => parseTime(a.created_at) - parseTime(b.created_at),
      );

      const latest = byNewest[0];
      const origin = byOldest[0];
      const pending =
        byNewest.find((item) => item.status === "pending") || null;
      const rejected =
        byNewest.find((item) => item.status === "rejected") || null;
      const actionItem = pending ?? rejected ?? latest;
      const activeItems = items.filter(
        (item) => item.status !== "rejected" && item.status !== "cancelled",
      );

      return {
        id: dealKey,
        dealKey,
        paymentCount: activeItems.length || items.length,
        hasPending: items.some((item) => item.status === "pending"),
        latestConfirmation: latest,
        actionConfirmation: actionItem,
        submittedByName: origin.user?.name || "—",
        clientName: origin.client?.name || "—",
        payerName: origin.payer_name,
        product: origin.product,
        currency: origin.currency || "NGN",
        amountBilled: Number(origin.amount_expected || 0),
        totalAmountPaid: activeItems.reduce(
          (sum, item) => sum + Number(item.amount_paid || 0),
          0,
        ),
        paymentDate: latest.payment_date,
        status: latest.status,
        confirmations: byNewest,
      };
    });

    return rows.sort(
      (a, b) =>
        parseTime(b.latestConfirmation.created_at) -
        parseTime(a.latestConfirmation.created_at),
    );
  }, [confirmations]);

  const filteredDeals = useMemo(() => {
    // If not in accounts mode, don't apply these filters
    if (mode !== "accounts") return dealRows;

    return dealRows.filter((deal) => {
      const matchesSearch =
        !search ||
        deal.clientName.toLowerCase().includes(search.toLowerCase()) ||
        deal.payerName.toLowerCase().includes(search.toLowerCase()) ||
        deal.product.toLowerCase().includes(search.toLowerCase()) ||
        deal.submittedByName.toLowerCase().includes(search.toLowerCase());

      const submitterId =
        deal.actionConfirmation.user_id ||
        getUserId(deal.actionConfirmation.user);
      const matchesSubmitter =
        submitterFilter === "all" || submitterId === submitterFilter;

      const employee = staffList.find((e) => e.id === submitterId);
      const submitterDept = employee?.department || "Other";
      const matchesDept =
        deptFilter === "all" ||
        submitterDept.toLowerCase() === deptFilter.toLowerCase();

      const matchesDateRange = matchesDate(deal.paymentDate);

      return matchesSearch && matchesSubmitter && matchesDept && matchesDateRange;
    });
  }, [dealRows, mode, search, submitterFilter, deptFilter, staffList, matchesDate]);

  const dynamicStats = useMemo(() => {
    const totalDeals = filteredDeals.length;

    let totalClosedValue = 0;
    let biggestDealClosed = 0;
    let closedDealsCount = 0;

    for (const deal of filteredDeals) {
      const approvedVal = deal.confirmations
        .filter((c) => c.status === "approved")
        .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      
      if (approvedVal > 0) {
        closedDealsCount++;
        totalClosedValue += approvedVal;
      }
      if (approvedVal > biggestDealClosed) {
        biggestDealClosed = approvedVal;
      }
    }

    const approvalRate =
      totalDeals > 0 ? Math.round((closedDealsCount / totalDeals) * 100) : 0;

    return [
      {
        title: "Total Deals",
        value: String(totalDeals),
        description: "Unique deal records",
      },
      {
        title: "Total Closed Value",
        value: formatCurrency(totalClosedValue),
        description: "Approved amount paid",
      },
      {
        title: "Biggest Deal Closed",
        value: formatCurrency(biggestDealClosed),
        description: "Highest approved payment",
      },
      {
        title: "Approval Rate",
        value: `${approvalRate}%`,
        description: `${closedDealsCount} approved deals`,
      },
    ];
  }, [filteredDeals]);

  async function handleApprove(id: string) {
    startTransition(async () => {
      try {
        const result = await approvePaymentConfirmationAction(id);
        if (result.success) {
          toast.success("Payment confirmation approved.");
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else {
          toast.error(result.error || "Failed to approve.");
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    });
  }

  async function handleReject() {
    if (!rejectDialog || !rejectionReason.trim()) {
      toast.error("Please provide a decline reason.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await rejectPaymentConfirmationAction(
          rejectDialog.id,
          rejectionReason,
        );
        if (result.success) {
          toast.success("Payment confirmation declined.");
          setRejectDialog(null);
          setRejectionReason("");
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else {
          toast.error(result.error || "Failed to decline.");
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    });
  }

  async function handleCancelConfirmation() {
    if (!cancelDialog) return;
    startTransition(async () => {
      try {
        const result = await cancelPaymentConfirmationAction(cancelDialog.id);
        if (result.success) {
          toast.success("Payment confirmation cancelled.");
          setCancelDialog(null);
          setSelectedDeal(null);
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else {
          toast.error(result.error || "Failed to cancel.");
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    });
  }

  async function handleAssign() {
    if (!assignDialog || !assignedTo) {
      toast.error("Please select a staff member.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await assignPaymentConfirmationAction(
          assignDialog.id,
          assignedTo,
        );
        if (result.success) {
          toast.success("Confirmation assigned.");
          setAssignDialog(null);
          setAssignedTo("");
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else {
          toast.error(result.error || "Failed to assign.");
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    });
  }

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const showActionsColumn = mode === "accounts" || (mode === "staff" && allowEditActions);
  const colCount = (showSubmittedBy ? 1 : 0) + 7 + (showActionsColumn ? 1 : 0);

  if (!dealRows.length) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No payment confirmations found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "accounts" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dynamicStats.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mode === "accounts" && (
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client, payer, product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <Select value={submitterFilter} onValueChange={setSubmitterFilter}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Closers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Closers</SelectItem>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept.toLowerCase()}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === "custom" && (
              <div className="flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-150">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs w-32"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs w-32"
                />
              </div>
            )}

            {(search ||
              submitterFilter !== "all" ||
              deptFilter !== "all" ||
              datePreset !== "all" ||
              startDate ||
              endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSubmitterFilter("all");
                  setDeptFilter("all");
                  setDatePreset("all");
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-9 gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex-shrink-0">
            <TableFilter currentStatus={currentStatus || "all"} />
          </div>
        </div>
      )}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showSubmittedBy && <TableHead>Submitted By</TableHead>}
              <TableHead>Client</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount Billed</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {showActionsColumn && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No payment confirmations match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedDeal(deal)}
              >
                {showSubmittedBy && (
                  <TableCell className="text-sm font-medium whitespace-nowrap">
                    {deal.submittedByName}
                  </TableCell>
                )}
                <TableCell className="font-medium">{deal.clientName}</TableCell>
                <TableCell>{deal.payerName}</TableCell>
                <TableCell>{deal.product}</TableCell>
                <TableCell>{formatCurrency(deal.amountBilled, deal.currency)}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p>{formatCurrency(deal.totalAmountPaid, deal.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.paymentCount} payment
                      {deal.paymentCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(deal.paymentDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={deal.status} />
                </TableCell>
                {mode === "accounts" && (
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-1.5 justify-end">
                        {deal.hasPending && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              disabled={isPending}
                              onClick={() =>
                                handleApprove(deal.actionConfirmation.id)
                              }
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={isPending}
                              onClick={() => {
                                setRejectDialog(deal.actionConfirmation);
                                setRejectionReason("");
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        {!deal.hasPending && deal.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() => {
                              setAssignDialog(deal.actionConfirmation);
                              setAssignedTo(
                                getUserId(deal.actionConfirmation.assigned_to),
                              );
                            }}
                          >
                            <UserRound className="h-3.5 w-3.5 mr-1" />
                            {deal.actionConfirmation.assigned_to
                              ? "Reassign"
                              : "Assign"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                )}
                {mode === "staff" && allowEditActions && (
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-1.5 justify-end">
                      {(deal.actionConfirmation.status === "rejected" ||
                        deal.actionConfirmation.status === "pending") && (
                        <>
                          <Button
                            size="sm"
                            variant={
                              deal.actionConfirmation.status === "rejected"
                                ? "default"
                                : "outline"
                            }
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              setEditingConfirmation(deal.actionConfirmation)
                            }
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            {deal.actionConfirmation.status === "rejected"
                              ? "Edit & Resubmit"
                              : "Edit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={isPending}
                            onClick={() =>
                              setCancelDialog(deal.actionConfirmation)
                            }
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-xs text-muted-foreground italic">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} records
          </p>
          <Pagination className="justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={createPageUrl(Math.max(1, pagination.page - 1))}
                  aria-disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: pagination.total_pages },
                (_, i) => i + 1,
              ).map((p) => (
                <PaginationItem key={p} className="hidden sm:inline-block">
                  <PaginationLink
                    href={createPageUrl(p)}
                    isActive={pagination.page === p}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href={createPageUrl(
                    Math.min(pagination.total_pages, pagination.page + 1),
                  )}
                  aria-disabled={pagination.page >= pagination.total_pages}
                  className={
                    pagination.page >= pagination.total_pages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Details Sheet */}
      <Sheet
        open={!!selectedDeal}
        onOpenChange={(o) => !o && setSelectedDeal(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto p-4 px-6">
          <SheetHeader>
            <SheetTitle>Payment Confirmation Details</SheetTitle>
            <SheetDescription>
              Full details of this payment confirmation.
            </SheetDescription>
          </SheetHeader>
          {selectedDeal && (
            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Deal Summary</p>
                <p className="font-medium">
                  {selectedDeal.paymentCount} payment
                  {selectedDeal.paymentCount > 1 ? "s" : ""} recorded
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total paid: {formatCurrency(selectedDeal.totalAmountPaid, selectedDeal.currency)}
                </p>
              </div>

              {selectedDeal.confirmations.length > 1 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">
                    Payments in this deal
                  </p>
                  <div className="space-y-2">
                    {selectedDeal.confirmations.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(entry.amount_paid, entry.currency || "NGN")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(entry.payment_date),
                              "dd MMM yyyy",
                            )} · {entry.payment_method}
                          </p>
                          {entry.status === "rejected" && entry.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">
                              Decline reason: {entry.rejection_reason}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={entry.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <StatusBadge
                    status={selectedDeal.latestConfirmation.status}
                  />
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Submitted</p>
                  <p>
                    {format(
                      new Date(selectedDeal.latestConfirmation.created_at),
                      "dd MMM yyyy, HH:mm",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Client</p>
                  <p className="font-medium">
                    {selectedDeal.latestConfirmation.client?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payer Name</p>
                  <p className="font-medium">
                    {selectedDeal.latestConfirmation.payer_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Product</p>
                  <p>{selectedDeal.latestConfirmation.product}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Mode</p>
                  <p>{selectedDeal.latestConfirmation.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Billed</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedDeal.amountBilled, selectedDeal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Discount</p>
                  <p>
                    {formatCurrency(selectedDeal.latestConfirmation.discount, selectedDeal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Paid</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(selectedDeal.totalAmountPaid, selectedDeal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Date</p>
                  <p>
                    {format(
                      new Date(selectedDeal.latestConfirmation.payment_date),
                      "dd MMM yyyy",
                    )}
                  </p>
                </div>
                {selectedDeal.latestConfirmation.number_of_persons && (
                  <div>
                    <p className="text-muted-foreground text-xs">Number of Persons</p>
                    <p>{selectedDeal.latestConfirmation.number_of_persons}</p>
                  </div>
                )}
                {selectedDeal.latestConfirmation.dollar_rate && (
                  <div>
                    <p className="text-muted-foreground text-xs">Dollar Billing Rate</p>
                    <p>₦{Number(selectedDeal.latestConfirmation.dollar_rate).toLocaleString()}</p>
                  </div>
                )}
                {(selectedDeal.latestConfirmation.deal_closer?.name ||
                  selectedDeal.latestConfirmation.deal) && (
                  <div>
                    <p className="text-muted-foreground text-xs">Deal Closer</p>
                    <p>
                      {selectedDeal.latestConfirmation.deal_closer?.name ||
                        selectedDeal.latestConfirmation.deal}
                    </p>
                  </div>
                )}
              </div>

              {allFiles.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">
                    Attachments (All Installments)
                  </p>
                  <div className="space-y-2">
                    {allFiles.map((file) => {
                      const fileName =
                        file.original_name ||
                        file.filename ||
                        "Attached file";
                      const fileUrl = `/api/proxy/image/api/files/download/${file.id}`;

                      // Identify type and add detail context
                      const isDataPage = file.filename?.startsWith("datapage/");
                      const isExtra = file.filename?.startsWith("extra/");
                      const label = isDataPage
                        ? "Client DataPage"
                        : isExtra
                          ? "Additional Attachment"
                          : `Receipt (${formatCurrency(file.confirmationAmount, file.confirmationCurrency)} · ${format(
                              new Date(file.confirmationDate),
                              "dd MMM yyyy",
                            )})`;

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate text-sm font-medium">
                              {fileName}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {label}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                Open
                              </a>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <a href={fileUrl} download={fileName}>
                                <Download className="mr-1 h-3.5 w-3.5" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDeal.latestConfirmation.service_description && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">
                    Description of Service
                  </p>
                  <p className="text-sm leading-relaxed">
                    {selectedDeal.latestConfirmation.service_description}
                  </p>
                </div>
              )}

              {selectedDeal.latestConfirmation.status === "rejected" &&
                selectedDeal.latestConfirmation.rejection_reason && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-destructive text-xs font-medium mb-1">
                      Decline Reason
                    </p>
                    <p className="text-sm">
                      {selectedDeal.latestConfirmation.rejection_reason}
                    </p>
                  </div>
                )}

              {(selectedDeal.latestConfirmation.outstanding_payment ??
                selectedDeal.latestConfirmation.outstandingPayment) && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    Linked to Outstanding Payment
                  </p>
                  <p className="text-sm">
                    Balance remaining:{" "}
                    <strong>
                      {formatCurrency(
                        (
                          selectedDeal.latestConfirmation.outstanding_payment ??
                          selectedDeal.latestConfirmation.outstandingPayment
                        )!.balance,
                        selectedDeal.currency,
                      )}
                    </strong>
                  </p>
                </div>
              )}

              {selectedDeal.latestConfirmation.processed_at &&
                selectedDeal.latestConfirmation.processed_by_id && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Processed By
                    </p>
                    <p>
                      {getUserDisplay(
                        selectedDeal.latestConfirmation.processed_by ??
                          selectedDeal.latestConfirmation.processedBy,
                      ) !== "—"
                        ? getUserDisplay(
                            selectedDeal.latestConfirmation.processed_by ??
                              selectedDeal.latestConfirmation.processedBy,
                          )
                        : getUserDisplay(
                            selectedDeal.latestConfirmation.processed_by_id,
                          )}{" "}
                      ·{" "}
                      {format(
                        new Date(selectedDeal.latestConfirmation.processed_at),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </p>
                  </div>
                )}

              {selectedDeal.latestConfirmation.assigned_to && (
                <div>
                  <p className="text-muted-foreground text-xs">Assigned To</p>
                  <p>
                    {getUserDisplay(
                      selectedDeal.latestConfirmation.assignedTo,
                    ) !== "—"
                      ? getUserDisplay(
                          selectedDeal.latestConfirmation.assignedTo,
                        )
                      : getUserDisplay(
                          selectedDeal.latestConfirmation.assigned_to,
                        )}
                  </p>
                </div>
              )}

              {mode === "staff" &&
                allowEditActions &&
                (selectedDeal.actionConfirmation.status === "rejected" ||
                  selectedDeal.actionConfirmation.status === "pending") && (
                  <div className="flex gap-2 border-t pt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDeal(null);
                        setEditingConfirmation(selectedDeal.actionConfirmation);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {selectedDeal.actionConfirmation.status === "rejected"
                        ? "Edit & Resubmit"
                        : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancelDialog(selectedDeal.actionConfirmation)}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1.5" />
                      Cancel Confirmation
                    </Button>
                  </div>
                )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={(o) => !o && setRejectDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Payment Confirmation</DialogTitle>
            <DialogDescription>
              Provide a reason for declining this payment confirmation for{" "}
              {rejectDialog?.payer_name}. The submitting staff member can then edit and resubmit or cancel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Decline Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this payment confirmation is being declined..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !rejectionReason.trim()}
              onClick={handleReject}
            >
              {isPending ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog
        open={!!assignDialog}
        onOpenChange={(o) => !o && setAssignDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignDialog?.assigned_to
                ? "Reassign for Follow-up"
                : "Assign for Follow-up"}
            </DialogTitle>
            <DialogDescription>
              Select a staff member to follow up on this payment confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="assign-staff">Staff Member *</Label>
            <Select
              value={assignedTo}
              onValueChange={setAssignedTo}
              disabled={isPending}
            >
              <SelectTrigger id="assign-staff">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialog(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button disabled={isPending || !assignedTo} onClick={handleAssign}>
              {isPending
                ? assignDialog?.assigned_to
                  ? "Reassigning..."
                  : "Assigning..."
                : assignDialog?.assigned_to
                  ? "Reassign"
                  : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingConfirmation && (
        <PaymentConfirmationDialog
          editingConfirmation={editingConfirmation}
          open={Boolean(editingConfirmation)}
          onOpenChange={(o) => {
            if (!o) setEditingConfirmation(null);
          }}
          staffList={staffList}
          currentUserId={currentUserId}
          hideTrigger
        />
      )}

      <AlertDialog
        open={Boolean(cancelDialog)}
        onOpenChange={(o) => {
          if (!o) setCancelDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this payment confirmation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the submission for {cancelDialog?.payer_name} as
              cancelled so Accounts no longer reviews it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => void handleCancelConfirmation()}
            >
              {isPending ? "Cancelling..." : "Cancel confirmation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

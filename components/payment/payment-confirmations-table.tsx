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
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
} from "@/lib/actions/payment-confirmations";
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
  staffList?: { id: string; name: string }[];
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
  amountBilled: number;
  totalAmountPaid: number;
  paymentDate: string;
  status: PaymentConfirmation["status"];
  confirmations: PaymentConfirmation[];
}

function formatCurrency(amount: number | string) {
  return `₦${Number(amount).toLocaleString()}`;
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
}: PaymentConfirmationsTableProps) {
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PaymentConfirmation | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignDialog, setAssignDialog] = useState<PaymentConfirmation | null>(
    null,
  );
  const [assignedTo, setAssignedTo] = useState("");

  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      const actionItem = pending ?? latest;

      return {
        id: dealKey,
        dealKey,
        paymentCount: items.length,
        hasPending: items.some((item) => item.status === "pending"),
        latestConfirmation: latest,
        actionConfirmation: actionItem,
        submittedByName: origin.user?.name || "—",
        clientName: origin.client?.name || "—",
        payerName: origin.payer_name,
        product: origin.product,
        amountBilled: Number(origin.amount_expected || 0),
        totalAmountPaid: items.reduce(
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

  async function handleApprove(id: string) {
    startTransition(async () => {
      try {
        const result = await approvePaymentConfirmationAction(id);
        if (result.success) {
          toast.success("Payment confirmation approved.");
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
      toast.error("Please provide a rejection reason.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await rejectPaymentConfirmationAction(
          rejectDialog.id,
          rejectionReason,
        );
        if (result.success) {
          toast.success("Payment confirmation rejected.");
          setRejectDialog(null);
          setRejectionReason("");
        } else {
          toast.error(result.error || "Failed to reject.");
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
    <>
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {mode === "accounts" && <TableHead>Submitted By</TableHead>}
              <TableHead>Client</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount Billed</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {mode === "accounts" && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dealRows.map((deal) => (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedDeal(deal)}
              >
                {mode === "accounts" && (
                  <TableCell className="text-sm font-medium whitespace-nowrap">
                    {deal.submittedByName}
                  </TableCell>
                )}
                <TableCell className="font-medium">{deal.clientName}</TableCell>
                <TableCell>{deal.payerName}</TableCell>
                <TableCell>{deal.product}</TableCell>
                <TableCell>{formatCurrency(deal.amountBilled)}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p>{formatCurrency(deal.totalAmountPaid)}</p>
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
                              Reject
                            </Button>
                          </>
                        )}
                        {deal.status !== "rejected" && (
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
              </TableRow>
            ))}
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
        <SheetContent className="sm:max-w-lg overflow-y-auto">
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
                  Total paid: {formatCurrency(selectedDeal.totalAmountPaid)}
                </p>
              </div>

              {selectedDeal.paymentCount > 1 && (
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
                            {formatCurrency(entry.amount_paid)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(entry.payment_date),
                              "dd MMM yyyy",
                            )}
                          </p>
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
                    {formatCurrency(selectedDeal.amountBilled)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Discount</p>
                  <p>
                    {formatCurrency(selectedDeal.latestConfirmation.discount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Paid</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(selectedDeal.totalAmountPaid)}
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
                {selectedDeal.latestConfirmation.deal && (
                  <div>
                    <p className="text-muted-foreground text-xs">Deal Closer</p>
                    <p>{selectedDeal.latestConfirmation.deal}</p>
                  </div>
                )}
              </div>

              {Array.isArray(selectedDeal.latestConfirmation.files) &&
                selectedDeal.latestConfirmation.files.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">
                      Attachments
                    </p>
                    <div className="space-y-2">
                      {selectedDeal.latestConfirmation.files.map((file) => {
                        const fileName =
                          file.original_name ||
                          file.filename ||
                          "Attached file";
                        const fileUrl = `/api/proxy/image/api/files/download/${file.id}`;

                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {fileName}
                              </p>
                              {file.file_type && (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {file.file_type.replace(/_/g, " ")}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
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
                      Rejection Reason
                    </p>
                    <p className="text-sm">
                      {selectedDeal.latestConfirmation.rejection_reason}
                    </p>
                  </div>
                )}

              {selectedDeal.latestConfirmation.outstandingPayment && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    Linked to Outstanding Payment
                  </p>
                  <p className="text-sm">
                    Balance remaining:{" "}
                    <strong>
                      {formatCurrency(
                        selectedDeal.latestConfirmation.outstandingPayment
                          .balance,
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
                        selectedDeal.latestConfirmation.processedBy,
                      ) !== "—"
                        ? getUserDisplay(
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
            <DialogTitle>Reject Payment Confirmation</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment confirmation for{" "}
              {rejectDialog?.payer_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this payment confirmation is being rejected..."
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
              {isPending ? "Rejecting..." : "Reject"}
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
    </>
  );
}

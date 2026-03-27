"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  decideSalaryAdvanceRequestByAccounts,
  decideSalaryAdvanceRequestByHr,
  markSalaryAdvanceRequestPaid,
  reopenSalaryAdvanceRequest,
  SalaryAdvanceRequestRecord,
} from "@/lib/api/salary-advance-requests";
import { SalaryAdvanceRequestDetailsSheet } from "@/components/payroll/salary-advance-request-details-sheet";

type ViewMode = "my" | "hr" | "accounts";

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "paid" || status === "approved_accounts") return "default";
  if (status.includes("rejected")) return "destructive";
  return "secondary";
}

function safeFormatDate(value: string | null | undefined, pattern: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, pattern);
}

function getDeductionRuleLabel(request: SalaryAdvanceRequestRecord) {
  const months = request.repayment_months ?? 1;
  const monthlyAmount =
    request.recommended_deduction_amount !== null &&
    request.recommended_deduction_amount !== undefined
      ? Number(request.recommended_deduction_amount)
      : null;

  if (months > 1) {
    if (monthlyAmount !== null) {
      return `${months} months @ ₦${monthlyAmount.toLocaleString()}/month`;
    }

    return `${months} months installment`;
  }

  return "Single-payment deduction";
}

export function SalaryAdvanceRequestsTable({
  requests,
  mode,
}: {
  requests: SalaryAdvanceRequestRecord[];
  mode: ViewMode;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<SalaryAdvanceRequestRecord | null>(null);

  async function handleHrDecision(
    id: string,
    decision: "approved" | "rejected",
  ) {
    try {
      setLoadingId(id);
      await decideSalaryAdvanceRequestByHr(id, decision);
      toast.success(`HR ${decision} salary advance request.`);
      router.refresh();
    } catch {
      toast.error("Failed to update HR decision.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleAccountsDecision(
    id: string,
    decision: "approved" | "rejected",
  ) {
    try {
      setLoadingId(id);
      await decideSalaryAdvanceRequestByAccounts(id, decision);
      toast.success(`Accounts ${decision} salary advance request.`);
      router.refresh();
    } catch {
      toast.error("Failed to update Accounts decision.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      setLoadingId(id);
      await markSalaryAdvanceRequestPaid(id);
      toast.success("Salary advance request marked as paid.");
      router.refresh();
    } catch {
      toast.error("Failed to mark as paid.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReopen(request: SalaryAdvanceRequestRecord) {
    const currentAmount = Number(request.amount);
    const currentReason = request.reason;
    const currentMonths = request.repayment_months ?? 1;

    const amountInput = window.prompt("Update amount", String(currentAmount));
    if (amountInput === null) return;
    const reasonInput = window.prompt("Update reason", currentReason);
    if (reasonInput === null) return;
    const monthsInput = window.prompt(
      "Update repayment months",
      String(currentMonths),
    );
    if (monthsInput === null) return;

    const nextAmount = Number(amountInput);
    const nextMonths = Number(monthsInput);
    const nextReason = reasonInput.trim();

    if (
      !Number.isFinite(nextAmount) ||
      nextAmount <= 0 ||
      !Number.isFinite(nextMonths) ||
      nextMonths < 1 ||
      nextMonths > 60 ||
      nextReason.length < 5
    ) {
      toast.error("Please provide valid edits before reopening.");
      return;
    }

    const payload: {
      amount?: number;
      reason?: string;
      repayment_months?: number;
    } = {};
    if (nextAmount !== currentAmount) payload.amount = nextAmount;
    if (nextReason !== currentReason) payload.reason = nextReason;
    if (nextMonths !== currentMonths) payload.repayment_months = nextMonths;

    if (Object.keys(payload).length === 0) {
      toast.error("Please make at least one edit before reopening.");
      return;
    }

    try {
      setLoadingId(request.id);
      await reopenSalaryAdvanceRequest(request.id, payload);
      toast.success("Salary advance request reopened and sent back to HR.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to reopen salary advance request.";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  }

  if (!requests.length) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center text-muted-foreground">
        No salary advance requests found.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {mode !== "my" ? <TableHead>Requester</TableHead> : null}
            <TableHead>Amount</TableHead>
            <TableHead>Deduction Rule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedRequest(request)}
            >
              {mode !== "my" ? (
                <TableCell className="font-medium whitespace-nowrap">
                  {request.requester?.name ?? request.requester_id}
                </TableCell>
              ) : null}
              <TableCell>₦{Number(request.amount).toLocaleString()}</TableCell>
              <TableCell>{getDeductionRuleLabel(request)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {safeFormatDate(request.created_at, "MMM d, yyyy")}
              </TableCell>
              <TableCell className="max-w-65 truncate" title={request.reason}>
                {request.reason}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(event) => event.stopPropagation()}
              >
                {mode === "my" &&
                ["rejected_hr", "rejected_accounts"].includes(
                  request.status,
                ) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === request.id}
                    onClick={() => handleReopen(request)}
                  >
                    Reopen
                  </Button>
                ) : null}

                {mode !== "my" ? (
                  <>
                    {mode === "hr" && request.status === "pending_hr" ? (
                      <Select
                        onValueChange={(value) =>
                          handleHrDecision(
                            request.id,
                            value as "approved" | "rejected",
                          )
                        }
                        disabled={loadingId === request.id}
                      >
                        <SelectTrigger className="ml-auto h-8 w-37.5 text-xs">
                          <SelectValue placeholder="HR action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}

                    {mode === "accounts" &&
                    request.status === "pending_accounts" ? (
                      <Select
                        onValueChange={(value) =>
                          handleAccountsDecision(
                            request.id,
                            value as "approved" | "rejected",
                          )
                        }
                        disabled={loadingId === request.id}
                      >
                        <SelectTrigger className="ml-auto h-8 w-42.5 text-xs">
                          <SelectValue placeholder="Accounts action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}

                    {mode === "accounts" &&
                    request.status === "approved_accounts" ? (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={loadingId === request.id}
                        onClick={() => handleMarkPaid(request.id)}
                      >
                        Mark Paid
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SalaryAdvanceRequestDetailsSheet
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      />
    </div>
  );
}

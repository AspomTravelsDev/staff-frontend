import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SalaryAdvanceRequestRecord } from "@/lib/api/salary-advance-requests";

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

function getRelationName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (!("name" in value)) return undefined;

  const relation = value as { name?: unknown };
  return typeof relation.name === "string" ? relation.name : undefined;
}

export function SalaryAdvanceRequestDetailsSheet({
  request,
  open,
  onOpenChange,
}: {
  request: SalaryAdvanceRequestRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!request) return null;

  const hrOfficer =
    request.hr_decider?.name ?? request.hrDecider?.name ?? "Pending";
  const accountsOfficer =
    request.accounts_decider?.name ??
    request.accountsDecider?.name ??
    "Pending";
  const paidByRelation = getRelationName(request.paid_by);
  const paidOfficer =
    request.paid_by_user?.name ??
    request.paidBy?.name ??
    paidByRelation ??
    "Not paid";
  const repaymentMonths = request.repayment_months ?? 1;
  const monthlyDeduction =
    request.recommended_deduction_amount !== null &&
    request.recommended_deduction_amount !== undefined
      ? Number(request.recommended_deduction_amount)
      : null;
  const deductionSummary =
    repaymentMonths > 1
      ? `${repaymentMonths} months installment`
      : "Single-payment deduction";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Salary Advance Details</SheetTitle>
          <SheetDescription>{deductionSummary}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(request.status)}>
                {request.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested</p>
              <p className="font-medium">
                {safeFormatDate(request.created_at, "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Requester</p>
            <p className="font-medium">
              {request.requester?.name ?? request.requester_id}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-semibold">
                ₦{Number(request.amount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deduction Mode</p>
              <p className="font-medium">
                {request.deduction_mode ?? "single_payment"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Repayment Duration
              </p>
              <p className="font-medium">
                {repaymentMonths} month{repaymentMonths > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Deduction</p>
              <p className="font-medium">
                {monthlyDeduction !== null
                  ? `₦${monthlyDeduction.toLocaleString()}`
                  : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              {request.reason}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Decision Timeline</p>
            <ul className="space-y-2 text-sm">
              <li>
                HR decision by: {hrOfficer} {"|"}{" "}
                {safeFormatDate(request.hr_decided_at, "PPpp") === "-"
                  ? "Pending"
                  : safeFormatDate(request.hr_decided_at, "PPpp")}
              </li>
              <li>
                Accounts decision by: {accountsOfficer} {"|"}{" "}
                {safeFormatDate(request.accounts_decided_at, "PPpp") === "-"
                  ? "Pending"
                  : safeFormatDate(request.accounts_decided_at, "PPpp")}
              </li>
              <li>
                Paid by: {paidOfficer} {"|"}{" "}
                {safeFormatDate(request.paid_at, "PPpp") === "-"
                  ? "Not paid"
                  : safeFormatDate(request.paid_at, "PPpp")}
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

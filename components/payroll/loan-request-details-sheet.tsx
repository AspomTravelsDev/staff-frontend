import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoanRequestRecord } from "@/lib/api/loan-requests";

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "paid" || status === "approved_accounts") return "default";
  if (status.includes("rejected")) return "destructive";
  return "secondary";
}

function getRelationName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (!("name" in value)) return undefined;

  const relation = value as { name?: unknown };
  return typeof relation.name === "string" ? relation.name : undefined;
}

export function LoanRequestDetailsSheet({
  request,
  open,
  onOpenChange,
}: {
  request: LoanRequestRecord | null;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Loan Request Details</SheetTitle>
          <SheetDescription>
            Detailed timeline and deduction info for this loan request.
          </SheetDescription>
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
                {format(new Date(request.created_at), "MMM d, yyyy")}
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
              <p className="text-sm text-muted-foreground">Repayment Months</p>
              <p className="font-medium">{request.repayment_months ?? "-"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Monthly Deduction (Auto)
            </p>
            <p className="font-medium">
              {request.computed_monthly_deduction
                ? `₦${Number(request.computed_monthly_deduction).toLocaleString()}`
                : "-"}
            </p>
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
                {request.hr_decided_at
                  ? format(new Date(request.hr_decided_at), "PPpp")
                  : "Pending"}
              </li>
              <li>
                Accounts decision by: {accountsOfficer} {"|"}{" "}
                {request.accounts_decided_at
                  ? format(new Date(request.accounts_decided_at), "PPpp")
                  : "Pending"}
              </li>
              <li>
                Paid by: {paidOfficer} {"|"}{" "}
                {request.paid_at
                  ? format(new Date(request.paid_at), "PPpp")
                  : "Not paid"}
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

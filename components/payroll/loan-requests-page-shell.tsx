import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanRequestDialog } from "@/components/payroll/loan-request-dialog";
import { LoanRequestsTable } from "@/components/payroll/loan-requests-table";
import { RequestFilters } from "@/components/payroll/request-filters";
import {
  RequestSummary,
  RequestSummaryCards,
} from "@/components/payroll/request-summary-cards";
import {
  getAllLoanRequests,
  getMyLoanRequests,
  LoanRequestRecord,
  LoanRequestStatus,
  markLoanRequestNotificationsViewed,
} from "@/lib/api/loan-requests";

type LoanRequestsShellMode = "my" | "hr" | "accounts";

const LOAN_STATUS_OPTIONS: LoanRequestStatus[] = [
  "pending_hr",
  "pending_accounts",
  "approved_accounts",
  "rejected_hr",
  "rejected_accounts",
  "paid",
];

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { from, to };
}

export async function LoanRequestsPageShell({
  mode,
  title,
  description,
  cardTitle,
  showCreateDialog,
  searchParams,
}: {
  mode: LoanRequestsShellMode;
  title: string;
  description: string;
  cardTitle: string;
  showCreateDialog?: boolean;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let requests: LoanRequestRecord[] = [];
  let summary: RequestSummary = {
    total_requested_amount: 0,
    pending_balance: 0,
    open_active_count: 0,
    paid_count: 0,
  };

  const month = getCurrentMonthRange();

  if (mode === "my") {
    try {
      await markLoanRequestNotificationsViewed();
    } catch (error) {
      console.error(
        "[Loan Requests] Failed to mark notifications viewed:",
        error,
      );
    }

    try {
      const response = await getMyLoanRequests({
        from_date: month.from,
        to_date: month.to,
      });
      requests = response.data ?? [];
      summary = response.summary ?? summary;
    } catch (error) {
      console.error(
        "[Loan Requests] Failed to fetch personal requests:",
        error,
      );
    }
  } else {
    const status =
      typeof searchParams?.status === "string"
        ? (searchParams.status as LoanRequestStatus)
        : undefined;
    const fromDate =
      typeof searchParams?.from_date === "string"
        ? searchParams.from_date
        : month.from;
    const toDate =
      typeof searchParams?.to_date === "string"
        ? searchParams.to_date
        : month.to;

    try {
      const response = await getAllLoanRequests({
        status,
        from_date: fromDate,
        to_date: toDate,
      });
      requests = response.data ?? [];
      summary = response.summary ?? summary;
    } catch (error) {
      console.error("[Loan Requests] Failed to fetch role queue:", error);
    }
  }

  return (
    <div className="space-y-6">
      {mode === "my" ? (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {showCreateDialog ? <LoanRequestDialog /> : null}
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      <RequestSummaryCards summary={summary} />

      {mode !== "my" ? (
        <RequestFilters statusOptions={LOAN_STATUS_OPTIONS} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoanRequestsTable requests={requests} mode={mode} />
        </CardContent>
      </Card>
    </div>
  );
}

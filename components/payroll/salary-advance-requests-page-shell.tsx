import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestFilters } from "@/components/payroll/request-filters";
import {
  RequestSummary,
  RequestSummaryCards,
} from "@/components/payroll/request-summary-cards";
import { SalaryAdvanceRequestDialog } from "@/components/payroll/salary-advance-request-dialog";
import { SalaryAdvanceRequestsTable } from "@/components/payroll/salary-advance-requests-table";
import {
  getAllSalaryAdvanceRequests,
  getMySalaryAdvanceRequests,
  markSalaryAdvanceNotificationsViewed,
  SalaryAdvanceRequestRecord,
  SalaryAdvanceRequestStatus,
} from "@/lib/api/salary-advance-requests";

type SalaryAdvanceShellMode = "my" | "hr" | "accounts";

const SALARY_ADVANCE_STATUS_OPTIONS: SalaryAdvanceRequestStatus[] = [
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

export async function SalaryAdvanceRequestsPageShell({
  mode,
  title,
  description,
  cardTitle,
  showCreateDialog,
  searchParams,
}: {
  mode: SalaryAdvanceShellMode;
  title: string;
  description: string;
  cardTitle: string;
  showCreateDialog?: boolean;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let requests: SalaryAdvanceRequestRecord[] = [];
  let summary: RequestSummary = {
    total_requested_amount: 0,
    pending_balance: 0,
    open_active_count: 0,
    paid_count: 0,
  };

  const month = getCurrentMonthRange();

  if (mode === "my") {
    try {
      await markSalaryAdvanceNotificationsViewed();
    } catch (error) {
      console.error(
        "[Salary Advance Requests] Failed to mark notifications viewed:",
        error,
      );
    }

    try {
      const response = await getMySalaryAdvanceRequests({
        from_date: month.from,
        to_date: month.to,
      });
      requests = response.data ?? [];
      summary = response.summary ?? summary;
    } catch (error) {
      console.error(
        "[Salary Advance Requests] Failed to fetch personal requests:",
        error,
      );
    }
  } else {
    const status =
      typeof searchParams?.status === "string"
        ? (searchParams.status as SalaryAdvanceRequestStatus)
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
      const response = await getAllSalaryAdvanceRequests({
        status,
        from_date: fromDate,
        to_date: toDate,
      });
      requests = response.data ?? [];
      summary = response.summary ?? summary;
    } catch (error) {
      console.error(
        "[Salary Advance Requests] Failed to fetch role queue:",
        error,
      );
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
          {showCreateDialog ? <SalaryAdvanceRequestDialog /> : null}
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      )}

      <RequestSummaryCards summary={summary} />

      {mode !== "my" ? (
        <RequestFilters statusOptions={SALARY_ADVANCE_STATUS_OPTIONS} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryAdvanceRequestsTable requests={requests} mode={mode} />
        </CardContent>
      </Card>
    </div>
  );
}

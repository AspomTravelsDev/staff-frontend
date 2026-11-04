import { PayrollManager } from "./components/payroll-manager";
import { SalarySettings } from "./components/salary-settings";
import { getEmployees } from "@/lib/api/employees";
import { getPayrollRun, listPayrollRuns } from "@/lib/api/payroll";
import { currentPayrollMonth } from "@/lib/payroll/months";

export const dynamic = "force-dynamic";

export default async function HRPayrollPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? params.month : "";
  const [employeesResult, runsResult] = await Promise.allSettled([
    getEmployees({ status: "Active", limit: 1000 }),
    listPayrollRuns(),
  ]);
  if (employeesResult.status === "rejected") throw new Error("Unable to load salary settings staff.");
  if (runsResult.status === "rejected" || !runsResult.value.success) throw new Error("Unable to load payroll periods.");
  const runs = runsResult.value.data.data;
  const latestMonth = runs[0]?.payroll_month || "";
  const maxMonth = latestMonth || currentPayrollMonth();
  const month = requestedMonth && requestedMonth <= maxMonth ? requestedMonth : maxMonth;
  let selectedRun = runs.find(run => run.payroll_month === month);
  if (!selectedRun && requestedMonth && requestedMonth <= maxMonth) {
    const result = await listPayrollRuns(month);
    if (!result.success) throw new Error("Unable to load the selected payroll period.");
    selectedRun = result.data.data[0];
  }
  let initialRun = null;
  if (selectedRun) {
    const result = await getPayrollRun(selectedRun.id);
    if (!result.success) throw new Error("Unable to load payroll details.");
    initialRun = result.data.data;
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">Manage payroll runs and staff salary settings.</p>
      </header>
      <PayrollManager key={`${month}-${params.comments === "1"}`} initialMonth={month}
        initialRun={initialRun} initialLatestMonth={latestMonth} commentsOpen={params.comments === "1"}
        salarySettings={<SalarySettings initialEmployees={employeesResult.value.items} />} />
    </div>
  );
}

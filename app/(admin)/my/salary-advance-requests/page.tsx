import { SalaryAdvanceRequestsPageShell } from "@/components/payroll/salary-advance-requests-page-shell";

export default async function MySalaryAdvanceRequestsPage() {
  return SalaryAdvanceRequestsPageShell({
    mode: "my",
    title: "Salary Advance Requests",
    description: "Create and track your salary advance requests.",
    cardTitle: "My Salary Advance Requests",
    showCreateDialog: true,
  });
}

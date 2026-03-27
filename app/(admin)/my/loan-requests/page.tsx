import { LoanRequestsPageShell } from "@/components/payroll/loan-requests-page-shell";

export default async function MyLoanRequestsPage() {
  return LoanRequestsPageShell({
    mode: "my",
    title: "Loan Requests",
    description: "Create and track your loan requests.",
    cardTitle: "My Loan Requests",
    showCreateDialog: true,
  });
}

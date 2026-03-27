import { LoanRequestsPageShell } from "@/components/payroll/loan-requests-page-shell";

export default async function AccountsLoanRequestsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return LoanRequestsPageShell({
    mode: "accounts",
    title: "Loan Disbursement",
    description:
      "Review all loan requests, filter by period/status, and process disbursement.",
    cardTitle: "Loan Requests",
    searchParams,
  });
}

import { LoanRequestsPageShell } from "@/components/payroll/loan-requests-page-shell";

export default async function HrLoanRequestsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return LoanRequestsPageShell({
    mode: "hr",
    title: "Loan Requests",
    description:
      "Review all loan requests, filter by period/status, and process decisions.",
    cardTitle: "Loan Requests",
    searchParams,
  });
}

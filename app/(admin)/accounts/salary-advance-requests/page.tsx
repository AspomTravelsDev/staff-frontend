import { SalaryAdvanceRequestsPageShell } from "@/components/payroll/salary-advance-requests-page-shell";

export default async function AccountsSalaryAdvanceRequestsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return SalaryAdvanceRequestsPageShell({
    mode: "accounts",
    title: "Salary Advance Disbursement",
    description:
      "Review all salary advance requests, filter by period/status, and process disbursement.",
    cardTitle: "Salary Advance Requests",
    searchParams,
  });
}

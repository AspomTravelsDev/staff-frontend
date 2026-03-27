import { SalaryAdvanceRequestsPageShell } from "@/components/payroll/salary-advance-requests-page-shell";

export default async function HrSalaryAdvanceRequestsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return SalaryAdvanceRequestsPageShell({
    mode: "hr",
    title: "Salary Advance Requests",
    description:
      "Review all salary advance requests, filter by period/status, and process decisions.",
    cardTitle: "Salary Advance Requests",
    searchParams,
  });
}

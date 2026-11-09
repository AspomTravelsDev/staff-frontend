import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { getCompletedResults } from "@/lib/api/performance";
import { renderDataPage } from "@/lib/api/render-data-page";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";
import { PerformanceWorkspace } from "./components/performance-workspace";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !["hr", "compliance", "mp", "md", "super"].some((role) => userHasRole(user, role as Parameters<typeof userHasRole>[1]))) redirect("/dashboard");
    const params = await searchParams;
    const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
    const requestedPage = Number(value("page"));
    const filters = {
      search: value("search").trim().slice(0, 180),
      department: value("department"),
      month: value("month"),
      type: value("type") === "monthly_kpi" || value("type") === "appraisal" ? value("type") as "monthly_kpi" | "appraisal" : undefined,
      page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    };
    const initialData = await getCompletedResults(filters);
    return <div className="space-y-6"><PerformancePageHeader eyebrow="HR results" title="Completed Appraisals" description="View completed appraisal results and comments. Unfinished assessments remain private." icon={ClipboardCheck} actions={<Button variant="outline" asChild><Link href="/compliance/kpis">Manage KPI bank</Link></Button>} /><PerformanceWorkspace initialData={initialData} filters={filters} /></div>;
  }, "Unable to load completed appraisal results");
}

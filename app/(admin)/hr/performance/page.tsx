import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { getCompletedResults } from "@/lib/api/performance";
import { renderDataPage } from "@/lib/api/render-data-page";
import { Button } from "@/components/ui/button";
import { PerformanceWorkspace } from "./components/performance-workspace";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !userHasRole(user, "hr")) redirect("/dashboard");
    const params = await searchParams;
    const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
    const requestedPage = Number(value("page"));
    const filters = {
      search: value("search").trim().slice(0, 180),
      department: value("department"),
      month: value("month"),
      page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    };
    const initialData = await getCompletedResults(filters);
    return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-1"><h1 className="text-2xl font-bold">Completed Appraisal Results</h1><p className="max-w-2xl text-sm text-muted-foreground">View completed monthly appraisals, each assessor’s submitted ratings and MP’s final result. Unfinished assessments remain private.</p></div><Button variant="outline" asChild><Link href="/hr/performance/periods">Monthly appraisal setup</Link></Button></header><PerformanceWorkspace initialData={initialData} filters={filters} /></div>;
  }, "Unable to load completed appraisal results");
}

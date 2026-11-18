import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listPerformancePeriods } from "@/lib/api/performance-period.actions";
import { listAvailableReviews } from "@/lib/api/performance-review.actions";
import type { ReviewQueueFilters } from "@/lib/types/performance-review";
import { ReviewQueue } from "./review-queue";

const allowedRoles = ["hr", "compliance", "mp", "md", "super"] as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || (!user.is_supervisor && !allowedRoles.some((role) => userHasRole(user, role)))) redirect("/dashboard");
    const params = await searchParams;
    const search = typeof params.search === "string" ? params.search.slice(0, 120) : "";
    const status = params.status === "in_progress" || params.status === "awaiting_reviewer" || params.status === "awaiting_mp" || params.status === "completed" ? params.status : "all";
    const type = params.type === "monthly_kpi" || params.type === "appraisal" ? params.type : "all";
    const rawMonth = typeof params.month === "string" ? params.month : "";
    const month = rawMonth === "all" || /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : "";
    const department = typeof params.department === "string" ? params.department.slice(0, 120) : "all";
    const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
    const filters: ReviewQueueFilters = { search, status, type, month, department, page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1 };
    const canManagePeriods = userHasRole(user, "hr") || userHasRole(user, "super");
    const canManageKpis = userHasRole(user, "compliance") || userHasRole(user, "super") || userHasRole(user, "hr");
    const [data, periodsResult] = await Promise.all([
      callAction(() => listAvailableReviews(filters)),
      canManagePeriods ? listPerformancePeriods() : Promise.resolve(null),
    ]);
    const periods = periodsResult?.success ? periodsResult.data.items : [];
    return <ReviewQueue key={`${data.filters.search}-${data.filters.status}-${data.filters.type}-${data.filters.month}-${data.filters.department}-${data.pagination.page}`} initialData={data} filters={{ ...data.filters, page: data.pagination.page }} periods={canManagePeriods ? periods : undefined} canManageKpis={canManageKpis} />;
  }, "Unable to load available appraisals");
}

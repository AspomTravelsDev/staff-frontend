import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listPerformancePeriods } from "@/lib/api/performance-period.actions";
import { listReviewPeriods } from "@/lib/api/performance-review.actions";
import type { ReviewPeriodQueueFilters } from "@/lib/types/performance-review";
import { ReviewQueue } from "./review-queue";

const allowedRoles = ["hr", "compliance", "mp", "md", "super"] as const;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (
      !user.is_active ||
      user.is_department_account ||
      (!user.is_supervisor && !allowedRoles.some((role) => userHasRole(user, role)))
    ) {
      redirect("/dashboard");
    }

    const params = await searchParams;
    const explicitType =
      params.type === "monthly_kpi"
        ? "monthly_kpi"
        : params.type === "appraisal"
          ? "appraisal"
          : null;
    const initialType = explicitType ?? "appraisal";
    const status =
      params.status === "open" || params.status === "closed" || params.status === "draft"
        ? params.status
        : "all";
    const search = typeof params.search === "string" ? params.search.slice(0, 120) : "";

    const filters: ReviewPeriodQueueFilters = { type: initialType, status, search };
    const canManagePeriods = userHasRole(user, "hr") || userHasRole(user, "super");
    const [initialData, periodsResult] = await Promise.all([
      callAction(() => listReviewPeriods(filters)),
      canManagePeriods ? listPerformancePeriods() : Promise.resolve(null),
    ]);

    // If no tab was explicitly requested in the URL and only Monthly KPI has actionable reviews,
    // automatically land on the Monthly KPI Reviews tab instead of the default Appraisals tab.
    const shouldAutoSwitchToMonthlyKpi =
      explicitType === null &&
      (initialData.tab_counts?.appraisal ?? 0) === 0 &&
      (initialData.tab_counts?.monthly_kpi ?? 0) > 0;

    const data = shouldAutoSwitchToMonthlyKpi
      ? await callAction(() =>
          listReviewPeriods({ type: "monthly_kpi", status, search }),
        )
      : initialData;
    const periods = periodsResult?.success ? periodsResult.data.items : [];

    return (
      <ReviewQueue
        key={`${data.filters.type}-${data.filters.status}-${data.filters.search}`}
        initialData={data}
        filters={data.filters}
        periods={canManagePeriods ? periods : undefined}
      />
    );
  }, "Unable to load appraisal periods");
}

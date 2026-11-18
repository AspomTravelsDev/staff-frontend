import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listAvailableReviews } from "@/lib/api/performance-review.actions";
import type { ReviewQueueFilters } from "@/lib/types/performance-review";
import { PeriodReviewsView } from "./period-reviews-view";

const allowedRoles = ["hr", "compliance", "mp", "md", "super"] as const;

export default async function PeriodReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ periodId: string }>;
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

    const { periodId } = await params;
    const query = await searchParams;
    const search = typeof query.search === "string" ? query.search.slice(0, 120) : "";
    const status =
      query.status === "in_progress" ||
      query.status === "awaiting_reviewer" ||
      query.status === "awaiting_mp" ||
      query.status === "completed"
        ? query.status
        : "all";
    const department = typeof query.department === "string" ? query.department.slice(0, 120) : "all";
    const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;

    const filters: ReviewQueueFilters = {
      search,
      status,
      type: "all",
      period_id: periodId,
      month: "all",
      department,
      page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    };

    const data = await callAction(() => listAvailableReviews(filters));
    if (!data.period) notFound();

    return (
      <PeriodReviewsView
        key={`${periodId}-${data.filters.search}-${data.filters.status}-${data.filters.department}-${data.pagination.page}`}
        initialData={data}
        period={data.period}
        filters={{ ...data.filters, period_id: periodId, page: data.pagination.page }}
      />
    );
  }, "Unable to load period reviews");
}

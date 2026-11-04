import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listAssignedReviews } from "@/lib/api/performance-review.actions";
import { ReviewQueue } from "./review-queue";

export default async function ReviewsPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || (!user.is_supervisor && !userHasRole(user, "compliance") && !userHasRole(user, "mp"))) redirect("/dashboard");
    return <ReviewQueue initialData={await callAction(listAssignedReviews)} />;
  }, "Unable to load your assigned reviews");
}

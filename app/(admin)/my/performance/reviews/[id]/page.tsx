import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { getAssignedReview } from "@/lib/api/performance-review.actions";
import { ReviewEditor } from "../review-editor";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || (!user.is_supervisor && !userHasRole(user, "compliance") && !userHasRole(user, "mp"))) redirect("/dashboard");
    const { id } = await params;
    const result = await getAssignedReview(id);
    if (!result.success && result.error.code === "HTTP_404") notFound();
    return <ReviewEditor key={id} initialReview={await callAction(async () => result)} />;
  }, "Unable to load this assigned review");
}

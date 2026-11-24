import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listAdminTrainingVideos } from "@/lib/api/training-video.actions";
import { userHasRole } from "@/types/user-types";
import { TrainingVideosAdmin } from "./components/training-videos-admin";

const MANAGER_ROLES = ["hr", "it", "compliance", "super"] as const;

export default async function AdminTrainingVideosPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (
      !user.is_active ||
      user.is_department_account ||
      !MANAGER_ROLES.some((role) => userHasRole(user, role))
    ) {
      redirect("/dashboard");
    }

    const initialData = await callAction(listAdminTrainingVideos);
    return <TrainingVideosAdmin initialData={initialData} />;
  }, "Unable to load training video manager");
}

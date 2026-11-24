import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { getMyTrainingVideos } from "@/lib/api/training-video.actions";
import { userHasRole } from "@/types/user-types";
import { TrainingHub } from "./components/training-hub";

export default async function MyTrainingPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account) redirect("/dashboard");

    const initialData = await callAction(getMyTrainingVideos);
    const canManage = ["hr", "it", "compliance", "super"].some((role) =>
      userHasRole(user, role as "hr" | "it" | "compliance" | "super"),
    );

    return <TrainingHub initialData={initialData} canManage={canManage} />;
  }, "Unable to load your training & onboarding videos");
}

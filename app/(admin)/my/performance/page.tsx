import { renderDataPage } from "@/lib/api/render-data-page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MyPerformanceWorkspace } from "./components/my-performance-workspace";
import { getPerformanceData } from "./queries";

export default async function Page() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account) redirect("/dashboard");
    const { appraisals, stats, availability } = await getPerformanceData();
    return <MyPerformanceWorkspace initialAppraisals={appraisals} initialStats={stats} initialAvailability={availability} allowDevelopmentStart={process.env.NODE_ENV === "development"} />;
  }, "Unable to load your appraisals");
}

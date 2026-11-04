import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { getPerformancePeriodOptions, listPerformancePeriods } from "@/lib/api/performance-period.actions";
import { PeriodManager } from "./period-manager";

export default async function PerformancePeriodsPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !userHasRole(user, "hr")) redirect("/dashboard");
    const [periods, options] = await Promise.all([
      callAction(listPerformancePeriods), callAction(getPerformancePeriodOptions),
    ]);
    return <PeriodManager initialPeriods={periods} initialOptions={options} />;
  }, "Unable to load monthly appraisals");
}

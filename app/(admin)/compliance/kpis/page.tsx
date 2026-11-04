import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listDepartmentKpis } from "@/lib/api/department-kpi.actions";
import { DepartmentKpiManager } from "./kpi-manager";

export default async function DepartmentKpisPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !userHasRole(user, "compliance")) redirect("/dashboard");
    const initialData = await callAction(listDepartmentKpis);
    return <DepartmentKpiManager initialData={initialData} />;
  }, "Unable to load department KPIs");
}

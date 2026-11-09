import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { listDepartmentSupervisors } from "@/lib/api/department-supervisors.actions";
import { DepartmentSupervisorManager } from "./supervisor-manager";

export default async function DepartmentSupervisorsPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || (!userHasRole(user, "hr") && !userHasRole(user, "super"))) redirect("/dashboard");
    const data = await callAction(listDepartmentSupervisors);
    return <DepartmentSupervisorManager initialDepartments={data.departments} />;
  }, "Unable to load department supervisors");
}

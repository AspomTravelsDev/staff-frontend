import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";
import { renderDataPage } from "@/lib/api/render-data-page";
import { userHasAnyRole } from "@/types/user-types";
import { lagosDateKey } from "@/lib/utils/employee-headcount";
import { EmployeeListContent } from "../employees/components/employee-list-content";
import { getEmployees } from "@/lib/api/employees";

export default async function BlacklistPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !userHasAnyRole(user, ["hr", "it", "super", "mp", "md"])) redirect("/dashboard");
    const [result, metadata] = await Promise.all([getEmployees({ is_blacklisted: true, limit: Number.MAX_SAFE_INTEGER }), getRolesMetadataContract()]);
    const employees = result.items;
    return <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">Employee Black List</h1>
        <p className="text-sm text-muted-foreground">Staff recorded by HR for absconding or leaving without proper notice. Add staff through the employee deactivation dialog.</p>
        <p className="mt-2 text-sm">{employees.length} blacklisted staff</p>
      </div>
      <EmployeeListContent blacklist employees={employees}
        stats={{ totalActive: 0, totalInactive: 0, turnoverRate: "0%", newJoiners: 0 }}
        headcountAsOf={lagosDateKey(new Date())}
        roleOptions={metadata.roles.map(role => ({ label: role.label, value: role.value }))}
        departmentsForEditor={metadata.departments} roleToDepartment={metadata.role_to_department} />
    </div>;
  }, "Unable to load staff blacklist");
}

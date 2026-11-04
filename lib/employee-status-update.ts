import type { Employee, UpdateUserRequest } from "@/lib/api/employees";
import type { UserExitType } from "@/types/user-types";

export interface EmployeeStatusEdit {
  is_active: boolean;
  exit_type: UserExitType;
  exit_date: string;
  exit_reason: string;
  is_blacklisted: boolean;
  blacklist_reason: string;
}

export function buildEmployeeStatusUpdate(employee: Employee, data: EmployeeStatusEdit): UpdateUserRequest {
  const changedStatus = data.is_active !== (employee.status === "Active");
  const result: UpdateUserRequest = {};
  if (changedStatus) result.is_active = data.is_active;

  if (!data.is_active) {
    if (changedStatus || data.exit_type !== (employee.exit_type || "resignation")) result.exit_type = data.exit_type;
    if (changedStatus || (data.exit_date || null) !== (employee.exit_date || employee.exitDate || null)) result.exit_date = data.exit_date || null;
    if (changedStatus || (data.exit_reason || null) !== (employee.exit_reason || null)) result.exit_reason = data.exit_reason || null;
    result.is_blacklisted = data.is_blacklisted;
    if (data.is_blacklisted) result.blacklist_reason = data.blacklist_reason.trim();
  } else if (changedStatus) {
    result.exit_type = null;
    result.exit_date = null;
    result.exit_reason = null;
  }
  return result;
}

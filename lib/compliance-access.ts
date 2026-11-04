import { userHasAnyRole } from "@/types/user-types";

export function canManageCompliance(user: { role?: string; roles?: string[]; secondary_roles?: string[] | null; is_supervisor?: boolean; is_active?: boolean; is_department_account?: boolean } | null | undefined): boolean {
  return Boolean(user && user.is_active !== false && !user.is_department_account && (user.is_supervisor || userHasAnyRole(user, ["super", "mp", "md", "admin", "hr", "compliance", "office-operations"])));
}

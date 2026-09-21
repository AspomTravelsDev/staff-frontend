import { ROLE_TO_DEPARTMENT_FALLBACK } from "@/types/user-types";

/**
 * Maps a user role slug to its canonical department name.
 * Used as a fallback when `department` is not explicitly set on the user.
 */
export const ROLE_TO_DEPARTMENT: Record<string, string> =
  ROLE_TO_DEPARTMENT_FALLBACK;

export const PLATFORM_DEPARTMENTS: string[] = Array.from(
  new Set(Object.values(ROLE_TO_DEPARTMENT_FALLBACK))
);

/**
 * Returns the department for a given role, falling back to the provided
 * `department` value (or undefined if neither is available).
 */
export function getDepartmentFromRoleOrField(
  department: string | null | undefined,
  role: string | null | undefined,
  roleToDepartment: Record<string, string> = ROLE_TO_DEPARTMENT
): string | undefined {
  if (department) return department;
  if (role) return roleToDepartment[role];
  return undefined;
}

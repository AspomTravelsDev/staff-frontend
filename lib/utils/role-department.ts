/**
 * Maps a user role slug to its canonical department name.
 * Used as a fallback when `department` is not explicitly set on the user.
 */
export const ROLE_TO_DEPARTMENT: Record<string, string> = {
  super: "Management",
  admin: "Administration",
  it: "IT",
  account: "Accounts",
  visa: "Visa",
  hr: "HR",
  "social-media": "Social Media",
  compliance: "Compliance",
  "birth-services": "Birth Services",
  holidays: "Holidays",
};

/**
 * Returns the department for a given role, falling back to the provided
 * `department` value (or undefined if neither is available).
 */
export function getDepartmentFromRoleOrField(
  department: string | null | undefined,
  role: string | null | undefined
): string | undefined {
  if (department) return department;
  if (role) return ROLE_TO_DEPARTMENT[role];
  return undefined;
}

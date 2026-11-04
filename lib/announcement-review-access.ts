import { userHasAnyRole, type UserRole } from "@/types/user-types";

/** Mirrors the backend's view-announcements-admin permission. */
export const ANNOUNCEMENT_REVIEW_ROLES: UserRole[] = ["super", "mp", "md", "it", "compliance", "office-operations"];

export function canReviewAnnouncements(user: {
  role?: string;
  secondary_roles?: string[] | null;
  roles?: string[];
  is_active?: boolean;
  is_department_account?: boolean;
} | null | undefined): boolean {
  return !!user && user.is_active !== false && !user.is_department_account && userHasAnyRole(user, ANNOUNCEMENT_REVIEW_ROLES);
}

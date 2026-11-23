import {
  USER_ROLES,
  userHasAnyRole,
  userHasRole,
  type UserRole,
} from "@/types/user-types";
import type { SocialMediaGraphic } from "@/types/social-media-graphics";

export const SOCIAL_MEDIA_GRAPHICS_ROLES: UserRole[] = [
  USER_ROLES.SOCIAL_MEDIA_OFFICER,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.MP,
  USER_ROLES.MD,
];

export const SOCIAL_MEDIA_GRAPHICS_MANAGEMENT_ROLES: UserRole[] = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.MP,
  USER_ROLES.MD,
];

export interface GraphicsAccessUser {
  id?: string;
  role?: string;
  secondary_roles?: string[] | null;
  roles?: string[];
  is_active?: boolean;
  is_supervisor?: boolean;
  is_department_account?: boolean;
}

export function canAccessSocialMediaGraphics(
  user: GraphicsAccessUser | null | undefined
): boolean {
  return Boolean(
    user &&
      user.is_active !== false &&
      userHasAnyRole(user, SOCIAL_MEDIA_GRAPHICS_ROLES)
  );
}

export function canDeleteSocialMediaGraphic(
  user: GraphicsAccessUser | null | undefined,
  graphic: Pick<SocialMediaGraphic, "uploaded_by_id" | "can_delete">
): boolean {
  if (!canAccessSocialMediaGraphics(user)) {
    return false;
  }

  if (typeof graphic.can_delete === "boolean") {
    return graphic.can_delete;
  }

  if (userHasAnyRole(user, SOCIAL_MEDIA_GRAPHICS_MANAGEMENT_ROLES)) {
    return true;
  }

  if (user?.id && graphic.uploaded_by_id && graphic.uploaded_by_id === user.id) {
    return true;
  }

  return Boolean(
    user?.is_supervisor &&
      !user?.is_department_account &&
      userHasRole(user, USER_ROLES.SOCIAL_MEDIA_OFFICER)
  );
}

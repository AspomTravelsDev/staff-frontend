"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/providers/user-provider";
import {
  dashboardNav,
  getNavigationForUser,
  type NavItem,
} from "@/lib/navigation";
import { USER_ROLE_DETAILS, type UserRole } from "@/types/user-types";
import Image from "next/image";
import Link from "next/link";
import { TreePalm } from "lucide-react";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { state } = useSidebar();
  const { data: notifications } = useRoleNotifications();

  const activeRoles: UserRole[] = user
    ? user.roles && user.roles.length > 0
      ? (user.roles as UserRole[])
      : [user.role as UserRole, ...((user.secondary_roles || []) as UserRole[])]
    : [];

  const navigation = user
    ? getNavigationForUser(user as Parameters<typeof getNavigationForUser>[0])
    : { dashboard: dashboardNav, department: [], personal: [] };

  // Group tools by department for super admins or multi-role users
  const getGroupedNav = (items: NavItem[]) => {
    const isMultiRole = activeRoles.length > 1 || activeRoles.includes("super");

    if (!isMultiRole) {
      const primaryRoleLabel =
        (user?.role && USER_ROLE_DETAILS[user.role as UserRole]?.label) ||
        user?.role?.toUpperCase() ||
        "Department";
      return [
        {
          label: `${primaryRoleLabel} Tools`,
          items: items.sort((a, b) => a.title.localeCompare(b.title)),
        },
      ];
    }

    const groups: Record<string, NavItem[]> = {
      "HR Tools": [],
      "Social Media Tools": [],
      "Account Tools": [],
      "Visa Tools": [],
      "IT Tools": [],
      "Admin Tools": [],
      "Compliance Tools": [],
      "Office Operations Tools": [],
      "Other Tools": [],
    };

    items.forEach((item) => {
      if (!item.allowedRoles) {
        groups["Other Tools"].push(item);
        return;
      }

      if (
        item.allowedRoles.includes("social-media") &&
        activeRoles.includes("social-media")
      ) {
        groups["Social Media Tools"].push(item);
      } else if (
        item.allowedRoles.includes("hr") &&
        activeRoles.includes("hr")
      ) {
        groups["HR Tools"].push(item);
      } else if (
        item.allowedRoles.includes("admin") &&
        activeRoles.includes("admin")
      ) {
        groups["Admin Tools"].push(item);
      } else if (
        item.allowedRoles.includes("account") &&
        activeRoles.includes("account")
      ) {
        groups["Account Tools"].push(item);
      } else if (
        item.allowedRoles.includes("visa") &&
        activeRoles.includes("visa")
      ) {
        groups["Visa Tools"].push(item);
      } else if (
        item.allowedRoles.includes("it") &&
        activeRoles.includes("it")
      ) {
        groups["IT Tools"].push(item);
      } else if (
        item.allowedRoles.includes("compliance") &&
        activeRoles.includes("compliance")
      ) {
        groups["Compliance Tools"].push(item);
      } else if (
        item.allowedRoles.includes("office-operations") &&
        activeRoles.includes("office-operations")
      ) {
        groups["Office Operations Tools"].push(item);
      } else if (item.allowedRoles.includes("social-media")) {
        groups["Social Media Tools"].push(item);
      } else if (item.allowedRoles.includes("hr")) {
        groups["HR Tools"].push(item);
      } else if (item.allowedRoles.includes("account")) {
        groups["Account Tools"].push(item);
      } else if (item.allowedRoles.includes("visa")) {
        groups["Visa Tools"].push(item);
      } else if (item.allowedRoles.includes("it")) {
        groups["IT Tools"].push(item);
      } else if (item.allowedRoles.includes("admin")) {
        groups["Admin Tools"].push(item);
      } else if (item.allowedRoles.includes("compliance")) {
        groups["Compliance Tools"].push(item);
      } else if (item.allowedRoles.includes("office-operations")) {
        groups["Office Operations Tools"].push(item);
      } else {
        groups["Other Tools"].push(item);
      }
    });

    return Object.entries(groups)
      .filter(([, groupItems]) => groupItems.length > 0)
      .map(([label, groupItems]) => ({
        label,
        items: groupItems.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  };

  const groupedDepartmentNav = getGroupedNav(navigation.department);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state === "expanded" ? (
          <Link href="/" className="flex flex-col justify-center gap-0">
            <Image src="/aspom-logo.webp" alt="Logo" width={180} height={32} />
            <span className="text-xs text-muted-foreground ml-3">
              Staff Management Portal
            </span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center p-2">
            <TreePalm className="size-8 text-primary" />
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {/* Dashboard - always visible */}
        <NavMain items={navigation.dashboard} />
        {/* Divider */}
        <SidebarSeparator className="mx-2" />

        {/* Department-specific tools */}
        {groupedDepartmentNav.map((group, index) => (
          <React.Fragment key={group.label}>
            <NavMain
              items={group.items}
              label={group.label}
              badges={notifications || {}}
            />
            {index < groupedDepartmentNav.length - 1 && (
              <SidebarSeparator className="mx-2" />
            )}
          </React.Fragment>
        ))}

        {/* General actions - visible to all, except departmental accounts */}
        {!user?.is_department_account && (
          <>
            <SidebarSeparator className="mx-2" />
            <NavMain
              items={navigation.personal}
              label="Personal Tools"
              badges={notifications || {}}
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

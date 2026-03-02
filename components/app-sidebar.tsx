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
  departmentNav,
  filterNavByRole,
  personalNav,
  type NavItem,
} from "@/lib/navigation";
import type { UserRole } from "@/types/user-types";
import Image from "next/image";
import Link from "next/link";
import { TreePalm } from "lucide-react";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { state } = useSidebar();
  const { data: notifications } = useRoleNotifications();

  // Filter department nav based on user role
  const filteredDepartmentNav = user
    ? filterNavByRole(departmentNav, user.role as UserRole)
    : [];

  // Group tools by department for super admins
  const getGroupedNav = (items: NavItem[]) => {
    if (user?.role !== "super") {
      return [
        {
          label: user?.role.toLocaleUpperCase() + " Tools",
          items: items.sort((a, b) => a.title.localeCompare(b.title)),
        },
      ];
    }

    const groups: Record<string, NavItem[]> = {
      "HR Tools": [],
      "Account Tools": [],
      "Visa Tools": [],
      "IT Tools": [],
      "Admin Tools": [],
      "Compliance Tools": [],
      "Other Tools": [],
    };

    items.forEach((item) => {
      if (!item.allowedRoles) {
        groups["Other Tools"].push(item);
        return;
      }
      if (item.allowedRoles.includes("hr")) groups["HR Tools"].push(item);
      else if (item.allowedRoles.includes("account"))
        groups["Account Tools"].push(item);
      else if (item.allowedRoles.includes("visa"))
        groups["Visa Tools"].push(item);
      else if (item.allowedRoles.includes("it")) groups["IT Tools"].push(item);
      else if (item.allowedRoles.includes("admin"))
        groups["Admin Tools"].push(item);
      else if (item.allowedRoles.includes("compliance"))
        groups["Compliance Tools"].push(item);
      else groups["Other Tools"].push(item);
    });

    return Object.entries(groups)
      .filter(([_, groupItems]) => groupItems.length > 0)
      .map(([label, groupItems]) => ({
        label,
        items: groupItems.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  };

  const groupedDepartmentNav = getGroupedNav(filteredDepartmentNav);

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
        <NavMain items={dashboardNav} />
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

        {/* Divider */}
        <SidebarSeparator className="mx-2" />

        {/* General actions - visible to all */}
        <NavMain
          items={personalNav}
          label="Personal Tools"
          badges={notifications || {}}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

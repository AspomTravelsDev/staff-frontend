"use client";

import * as React from "react";
import { AspomLogo } from "./icons/aspom-logo";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
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
} from "@/lib/navigation";
import type { UserRole } from "@/types/user-types";
import Image from "next/image";
import Link from "next/link";
import { TreePalm } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { state } = useSidebar();

  // Filter department nav based on user role
  const filteredDepartmentNav = user
    ? filterNavByRole(departmentNav, user.role as UserRole)
    : [];

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
        {filteredDepartmentNav.length > 0 && (
          <NavMain
            items={filteredDepartmentNav.sort((a, b) =>
              a.title.localeCompare(b.title),
            )}
            label={user?.role.toLocaleUpperCase() + " Tools"}
          />
        )}

        {/* Divider */}
        <SidebarSeparator className="mx-2" />

        {/* General actions - visible to all */}
        <NavMain items={personalNav} label="General Links" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

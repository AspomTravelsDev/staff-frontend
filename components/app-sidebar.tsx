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
} from "@/components/ui/sidebar";
import { useUser } from "@/providers/user-provider";
import {
  dashboardNav,
  departmentNav,
  filterNavByRole,
  personalNav,
} from "@/lib/navigation";

const teams = [
  {
    name: "Aspom Travels",
    logo: AspomLogo,
    plan: "Internal Staff Portal",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  // Filter department nav based on user role
  const filteredDepartmentNav = user
    ? filterNavByRole(departmentNav, user.role)
    : [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard - always visible */}
        <NavMain items={dashboardNav} />
        {/* Divider */}
        <SidebarSeparator className="mx-2" />

        {/* Department-specific tools */}
        {filteredDepartmentNav.length > 0 && (
          <NavMain
            items={filteredDepartmentNav}
            label={user?.role.toLocaleUpperCase() + " Department Tools"}
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

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
import { Search, TreePalm, X } from "lucide-react";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navSearch, setNavSearch] = React.useState("");
  const { user } = useUser();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: notifications } = useRoleNotifications();

  const activeRoles: UserRole[] = user
    ? user.roles && user.roles.length > 0
      ? (user.roles as UserRole[])
      : [user.role as UserRole, ...((user.secondary_roles || []) as UserRole[])]
    : [];

  const navigation = user
    ? getNavigationForUser(user as Parameters<typeof getNavigationForUser>[0])
    : { dashboard: dashboardNav, department: [], personal: [] };

  const filterNavigation = (items: NavItem[]) => {
    const query = navSearch.trim().toLocaleLowerCase();
    if (!query) return items;

    return items.flatMap((item) => {
      const matchesTitle = item.title.toLocaleLowerCase().includes(query);
      if (item.items?.length) {
        if (matchesTitle) return [item];
        const matchingChildren = item.items.filter((child) =>
          child.title.toLocaleLowerCase().includes(query),
        );
        return matchingChildren.length
          ? [{ ...item, items: matchingChildren }]
          : [];
      }
      return matchesTitle ? [item] : [];
    });
  };

  const searchActive = navSearch.trim().length > 0;
  const dashboardItems = filterNavigation(navigation.dashboard);
  const personalItems = filterNavigation(navigation.personal);

  const isManagementUser = activeRoles.some((role) => role === "mp" || role === "md");

  // Group tools by role for staff who can access more than one department.
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

  // MP and MD have broad departmental access, so group their links by the
  // department that owns each route instead of assigning them to one role.
  const getManagementGroupedNav = (items: NavItem[]) => {
    const groups: Record<string, NavItem[]> = {
      "Human Resources": [],
      Accounts: [],
      Compliance: [],
      Operations: [],
      Administration: [],
      IT: [],
      "Shared Services": [],
      "Other Tools": [],
    };

    items.forEach((item) => {
      const root = item.url.split("/").filter(Boolean)[0];
      const group = root === "hr" || root === "attendance"
        ? "Human Resources"
        : root === "accounts"
          ? "Accounts"
          : root === "compliance"
            ? "Compliance"
            : root === "operations"
              ? "Operations"
              : root === "admin"
                ? "Administration"
                : root === "crm" || root === "announcements"
                  ? "Shared Services"
                  : root === "it"
                    ? "IT"
                    : "Other Tools";

      (groups[group] ||= []).push(item);
    });

    return Object.entries(groups)
      .filter(([, groupItems]) => groupItems.length > 0)
      .map(([label, groupItems]) => ({
        label,
        items: groupItems.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  };

  const groupedDepartmentNav = isManagementUser
    ? getManagementGroupedNav(navigation.department)
    : getGroupedNav(navigation.department);
  const visibleDepartmentGroups = groupedDepartmentNav
    .map((group) => ({ ...group, items: filterNavigation(group.items) }))
    .filter((group) => group.items.length > 0);
  const collapsibleDepartmentGroups =
    isManagementUser || activeRoles.length > 1 || activeRoles.includes("super");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state === "expanded" ? (
          <Link href="/" onClick={() => { if (isMobile) setOpenMobile(false); }} className="flex flex-col justify-center gap-0">
            <Image src="/aspom-logo.webp" alt="Logo" width={180} height={32} />
            <span className="text-xs text-muted-foreground ml-3">
              Staff Management Portal
            </span>
          </Link>
        ) : (
          <Link href="/" onClick={() => { if (isMobile) setOpenMobile(false); }} className="flex items-center justify-center p-2">
            <TreePalm className="size-8 text-primary" />
          </Link>
        )}
        {state === "expanded" && (
          <div className="relative px-1 py-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={navSearch}
              onChange={(event) => setNavSearch(event.target.value)}
              placeholder="Search navigation..."
              aria-label="Search navigation"
              className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-9 pr-8 text-sm text-sidebar-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch("")}
                aria-label="Clear navigation search"
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {searchActive &&
          dashboardItems.length === 0 &&
          visibleDepartmentGroups.length === 0 &&
          (user?.is_department_account || personalItems.length === 0) && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No navigation items found.
            </p>
          )}
        {/* Dashboard - always visible */}
        <NavMain items={dashboardItems} searchTerm={navSearch} />
        {/* Divider */}
        {(!searchActive || dashboardItems.length > 0) && <SidebarSeparator className="mx-2" />}

        {/* Department-specific tools */}
        {visibleDepartmentGroups.map((group, index) => (
          <React.Fragment key={group.label}>
            <NavMain
              items={group.items}
              label={group.label}
              badges={notifications || {}}
              collapsibleGroup={collapsibleDepartmentGroups && !searchActive}
              searchTerm={navSearch}
            />
            {index < visibleDepartmentGroups.length - 1 && (
              <SidebarSeparator className="mx-2" />
            )}
          </React.Fragment>
        ))}

        {/* General actions - visible to all, except departmental accounts */}
        {!user?.is_department_account && (
          <>
            {personalItems.length > 0 && (
              <>
                {visibleDepartmentGroups.length > 0 && <SidebarSeparator className="mx-2" />}
                <NavMain
                  items={personalItems}
                  label="Personal Tools"
                  badges={notifications || {}}
                  searchTerm={navSearch}
                />
              </>
            )}
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

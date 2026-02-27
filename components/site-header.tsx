"use client";
import { ThemeSwitcher } from "./icons/theme-switcher";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { BellIcon } from "lucide-react";
import { ClockInWidget } from "./clock-in-widget";
import { useUser } from "@/providers/user-provider";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { getNavigationForUser } from "@/lib/navigation";
import type { UserRole } from "@/types/user-types";
import Link from "next/link";

export const SiteHeader = () => {
  const { user } = useUser();
  const { data: notifications } = useRoleNotifications();

  // Find badge labels from all navigation config for the user's role
  const allNav = user ? getNavigationForUser(user.role as UserRole) : null;
  const allNavItems = allNav
    ? [...allNav.dashboard, ...allNav.department, ...allNav.personal]
    : [];

  const totalNotifications = notifications
    ? Object.values(notifications).reduce((a, b) => a + b, 0)
    : 0;
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background border-b mb-4">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>

      <div className="flex items-center justify-between w-full pr-8">
        <span className="text-sm text-muted-foreground font-bold">
          Welcome back, {user?.name || "User"}!
        </span>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-5">
            {/* Clock In Widget */}
            <ClockInWidget />
            {/* Popover Notifications */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center p-1.5 rounded-md bg-primary cursor-pointer">
                <Popover>
                  <PopoverTrigger className="bg-primary cursor-pointer hover:bg-primary/80 relative">
                    <BellIcon className="h-4 w-4 text-primary-foreground" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-background text-[8px] text-white">{totalNotifications}</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[300px] p-0">
                    <div className="flex border-b px-4 py-3">
                      <span className="text-sm font-bold">Notifications</span>
                    </div>
                    <div className="flex flex-col">
                      {totalNotifications === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No new notifications
                        </div>
                      ) : (
                        Object.entries(notifications || {}).map(
                          ([key, count]) => {
                            if (count <= 0) return null;

                            const navItem = allNavItems.find(
                              (item) => item.badgeKey === key,
                            );
                            const label =
                              navItem?.badgeLabel || `${key} pending`;
                            const url = navItem?.url || "#";

                            return (
                              <Link
                                key={key}
                                href={url}
                                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors"
                              >
                                <span className="text-sm">{label}</span>
                                <span className="flex h-5 items-center justify-center rounded-full bg-red-100 px-2 text-[10px] font-medium text-red-600">
                                  {count}
                                </span>
                              </Link>
                            );
                          },
                        )
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

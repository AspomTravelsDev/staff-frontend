"use client";

import { useState, useEffect } from "react";
import { ThemeSwitcher } from "./icons/theme-switcher";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { BellIcon, Gift, Trophy } from "lucide-react";
import { ClockInWidget } from "./clock-in-widget";
import { useUser } from "@/providers/user-provider";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { getNavigationForUser } from "@/lib/navigation";
import Link from "next/link";
import { getTodayBirthdays, getTodayAnniversaries, Employee } from "@/lib/api/employees";

export const SiteHeader = () => {
  const { user } = useUser();
  const { data: notifications } = useRoleNotifications();
  const [todayBirthdays, setTodayBirthdays] = useState<Employee[]>([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<Employee[]>([]);

  useEffect(() => {
    if (user) {
      getTodayBirthdays().then(setTodayBirthdays).catch(console.error);
      getTodayAnniversaries().then(setTodayAnniversaries).catch(console.error);
    }
  }, [user]);

  // Find badge labels from all navigation config for the user's role
  const allNav = user ? getNavigationForUser(user as any) : null;
  // Flatten all navigation items to include sub-items for badge matching
  const allNavItems = allNav
    ? [...allNav.dashboard, ...allNav.department, ...allNav.personal].reduce(
        (acc, item) => {
          acc.push(item);
          if (item.items) {
            acc.push(...item.items);
          }
          return acc;
        },
        [] as any[],
      )
    : [];

  // Filter notifications to only those that have a corresponding visible navigation item
  const visibleNotifications = Object.entries(notifications || {}).reduce(
    (acc, [key, count]) => {
      const actualCount =
        typeof count === "object" && count !== null
          ? count.count
          : (count as number);
      if (actualCount <= 0) return acc;

      const navItem = allNavItems.find((item) => {
        if (!item.badgeKey) return false;
        const keys = item.badgeKey.split(",");
        return keys.some((k: string) => k.trim() === key);
      });

      if (navItem) {
        let label = navItem.badgeLabel || `${key} pending`;
        // Custom labels for specific keys if they share a nav item
        if (key === "reportReminder") {
          label = "Submit your daily report";
        } else if (key === "myTasks") {
          label = "Submit your to-do list";
        } else if (key === "weeklyQuestionnairePending") {
          label = "Complete your weekly questionnaire";
        } else if (key === "compliance") {
          label = "New compliance query issued";
        } else if (key === "complianceReplies") {
          label = "Staff reply to compliance query";
        }

        let targetUrl = navItem.url || "#";
        let displayCount = 0;

        if (typeof count === "object" && count !== null) {
          displayCount = count.count;
          // Dynamic routing for announcements
          if (key === "unreadAnnouncements") {
            if (displayCount === 1 && count.latest_id) {
              targetUrl = `/announcements/${count.latest_id}`;
            } else {
              targetUrl = "/dashboard#announcements";
            }
          }
          // Dynamic routing for IT guides
          if (key === "unreadITGuides") {
            if (displayCount === 1 && count.latest_id) {
              targetUrl = `/my/it/${count.latest_id}`;
            } else {
              targetUrl = "/my/it";
            }
          }
        } else {
          displayCount = count as number;
        }

        acc[key] = {
          count: displayCount,
          label,
          url: targetUrl,
        };
      }
      return acc;
    },
    {} as Record<string, { count: number; label: string; url: string }>,
  );

  const totalNotifications =
    Object.values(visibleNotifications).reduce(
      (sum, item) => sum + item.count,
      0,
    ) + todayBirthdays.length + todayAnniversaries.length;

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>

      <div className="flex items-center justify-end w-full pr-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-5">
            {/* Clock In Widget */}
            {!user?.is_department_account && <ClockInWidget />}
            {/* Popover Notifications */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center p-1.5 rounded-md bg-primary cursor-pointer">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="bg-primary cursor-pointer hover:bg-primary/80 relative flex items-center justify-center -m-1.5 p-1.5 rounded-md">
                      <BellIcon className="h-4 w-4 text-primary-foreground" />
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-background text-[8px] text-white font-bold">
                          {totalNotifications}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[320px] p-0">
                    <div className="flex border-b px-4 py-3 bg-muted/50">
                      <span className="text-sm font-bold">Notifications</span>
                    </div>
                    <div className="flex flex-col max-h-100 overflow-y-auto">
                      {/* Birthday Notifications */}
                      {todayBirthdays.map((bday) => (
                        <div
                          key={bday.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors bg-pink-50/30 dark:bg-pink-950/10"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400">
                            <Gift className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              It&apos;s {bday.firstName}&apos;s birthday! 🎂
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              Don&apos;t forget to wish them well today.
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Anniversary Notifications */}
                      {todayAnniversaries.map((anniv) => (
                        <div
                          key={anniv.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors bg-amber-50/30 dark:bg-amber-950/10"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              Work Anniversary: {anniv.firstName}! 🏆
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              Celebrate their career milestone today.
                            </p>
                          </div>
                        </div>
                      ))}

                      {totalNotifications === 0 ? (
                        <div className="p-10 text-sm text-muted-foreground text-center">
                          <BellIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        Object.entries(visibleNotifications).map(
                          ([key, data]) => {
                            return (
                              <Link
                                key={key}
                                href={data.url}
                                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors"
                              >
                                <span className="text-sm font-medium">
                                  {data.label}
                                </span>
                                <span className="flex h-5 items-center justify-center rounded-full bg-red-100 px-2 text-[10px] font-bold text-red-600">
                                  {data.count}
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

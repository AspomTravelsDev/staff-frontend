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
import { clearAllNotifications } from "@/lib/api/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNavigationForUser, NavItem } from "@/lib/navigation";
import Link from "next/link";
import { getTodayBirthdays, getTodayAnniversaries, Employee } from "@/lib/api/employees";
import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";


export const SiteHeader = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: notifications } = useRoleNotifications();
  const [todayBirthdays, setTodayBirthdays] = useState<Employee[]>([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<Employee[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      await clearAllNotifications();
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Clear active notifications from phone / laptop system notification center
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.getNotifications().then((notifications) => {
              notifications.forEach((n) => n.close());
            });
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                action: "clear_all_notifications",
              });
            }
          })
          .catch((err) => console.warn("Failed to clear device notifications:", err));
      }

      toast.success("All update notifications marked as read");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (user) {
      getTodayBirthdays().then(setTodayBirthdays).catch(console.error);
      getTodayAnniversaries().then(setTodayAnniversaries).catch(console.error);
    }
  }, [user]);

  // Find badge labels from all navigation config for the user's role
  const allNav = user ? getNavigationForUser(user as Parameters<typeof getNavigationForUser>[0]) : null;
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
        [] as NavItem[],
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
        let label = navItem.badgeLabel || (
          key.replace(/([A-Z])/g, " $1")
             .replace(/^./, (str) => str.toUpperCase())
        );
        // Custom labels for specific keys if they share a nav item
        if (key === "reportReminder") {
          label = "Submit your daily report";
        } else if (key === "myTasks") {
          label = "Submit your to-do list";
        } else if (key === "weeklyQuestionnairePending") {
          label = "Active staff survey to complete";
        } else if (key === "compliance") {
          label = "New compliance query issued";
        } else if (key === "complianceReplies") {
          label = "Staff reply to compliance query";
        } else if (key === "pendingLeaves") {
          label = "Pending leave requests";
        } else if (key === "myLeaveUpdates") {
          label = "Leave request updates";
        } else if (key === "inventoryAssignmentsOfficer") {
          label = "Asset assignment awaiting officer review";
        } else if (key === "inventoryAssignmentsCompliance") {
          label = "Asset assignment awaiting compliance audit";
        } else if (key === "inventoryClearanceOfficer") {
          label = "Gadget return awaiting IT inspection";
        } else if (key === "inventoryClearanceCompliance") {
          label = "Gadget return awaiting Compliance clearance";
        } else if (key === "payrollQueue") {
          label = "Payroll runs awaiting review";
        }

        let targetUrl = navItem.url || "#";
        if (
          key === "inventoryAssignmentsOfficer" ||
          key === "inventoryAssignmentsCompliance" ||
          key === "inventoryClearanceOfficer" ||
          key === "inventoryClearanceCompliance"
        ) {
          targetUrl = key.startsWith("inventoryClearance")
            ? "/admin/inventory?tab=clearance"
            : "/admin/inventory?tab=pending-approvals";
        }
        let displayCount = 0;
        let chatItems: { conversation_id: string; sender_name: string; count: number }[] | undefined = undefined;

        if (typeof count === "object" && count !== null) {
          displayCount = count.count;
          if (count.label) {
            label = count.label;
          }
          if (key === "payrollQueue") {
            targetUrl = "/hr/payroll";
          }
          if (key === "chatMessages" && count.items) {
            chatItems = count.items;
          }
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
          items: chatItems,
          recruitmentItems: typeof count === "object" && count !== null ? count.recruitment_items : undefined,
          taskItems: typeof count === "object" && count !== null ? count.task_items : undefined,
          paymentItems: typeof count === "object" && count !== null ? count.payment_items : undefined,
        };
      }
      return acc;
    },
    {} as Record<string, { count: number; label: string; url: string; items?: { conversation_id: string; sender_name: string; count: number }[]; recruitmentItems?: { id: string; title: string; body: string; count: number; url: string }[]; taskItems?: { task_id: string; title: string; body: string; count: number; view: "assigned_to_me" | "assigned_by_me" }[]; paymentItems?: { id: string; title: string; message: string; count: number; url: string }[] }>,
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
                  <PopoverContent align="end" className="w-[360px] sm:w-[380px] p-0">
                    <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/50">
                      <span className="text-sm font-bold">Notifications</span>
                      {totalNotifications > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          disabled={isClearing}
                          className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {isClearing ? "Clearing..." : "Clear all"}
                        </button>
                      )}
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
                            if (data.paymentItems?.length) return data.paymentItems.map(payment => <Link key={`payment-${payment.id}`} href={payment.url} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{payment.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{payment.message}</p></div><span className="shrink-0 rounded-full bg-red-100 px-2 text-[10px] font-bold text-red-600">{payment.count}</span></Link>);
                            if (key === "paymentLinkAttention") return <Link key={key} href="/accounts/payment-links?status=needs_attention" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 border-b"><span className="text-sm">Payments needing Accounts attention</span><span className="text-xs font-semibold">{data.count}</span></Link>;
                            if (key === "recruitmentUpdates" && data.recruitmentItems?.length) {
                              return data.recruitmentItems.map(item => <Link key={`recruitment-${item.id}`} href={item.url} className="flex items-center justify-between gap-3 border-b px-4 py-3 hover:bg-muted/50 last:border-0">
                                <div className="min-w-0"><p className="text-sm font-medium">{item.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p></div>
                                {item.count > 1 && <span className="shrink-0 text-xs font-semibold tabular-nums">{item.count}</span>}
                              </Link>);
                            }
                            if (key === "taskUpdates" && data.taskItems?.length) {
                              return data.taskItems.map(task => <Link key={`task-${task.task_id}`} href={`/my/task-tracker?view=${task.view}&task=${encodeURIComponent(task.task_id)}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0">
                                <div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{task.body}</p></div>
                                <span className="shrink-0 rounded-full bg-red-100 px-2 text-[10px] font-bold text-red-600">{task.count}</span>
                              </Link>);
                            }
                            if (key === "chatMessages" && data.items && data.items.length > 0) {
                              return data.items.map((chatItem) => (
                                <Link
                                  key={`chat-${chatItem.conversation_id}`}
                                  href={`/chat?conversationId=${chatItem.conversation_id}`}
                                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors"
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-sm font-medium truncate">
                                      You have {chatItem.count} unread message{chatItem.count > 1 ? "s" : ""} from {chatItem.sender_name}
                                    </span>
                                  </div>
                                  <span className="flex h-5 items-center justify-center rounded-full bg-red-100 px-2 text-[10px] font-bold text-red-600 shrink-0">
                                    {chatItem.count}
                                  </span>
                                </Link>
                              ));
                            }

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
                    <div className="p-2.5 border-t bg-muted/20">
                      <PushNotificationSettings compact />
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

"use client";

import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getNavigationBadgeTotal } from "@/lib/navigation-badges";
import type { NavItem } from "@/lib/navigation";
import type { NotificationCountValue } from "@/lib/api/notifications";

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span aria-label={`${count} pending notifications`} className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-medium tabular-nums text-white">{count}</span>;
}

export function NavMain({
  items,
  label,
  badges,
  collapsibleGroup = false,
  searchTerm = "",
}: {
  items: NavItem[];
  label?: string;
  badges?: Record<string, NotificationCountValue>;
  collapsibleGroup?: boolean;
  searchTerm?: string;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [groupOpen, setGroupOpen] = useState(false);

  const groupTotal = getNavigationBadgeTotal(items, badges);

  if (items.length === 0) return null;

  const menu = (
    <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={`${item.title}-${searchTerm.trim() ? "search" : "normal"}`}
              asChild
              defaultOpen={Boolean(searchTerm.trim()) || item.isActive || item.items.some((subItem) => subItem.url === pathname)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    disabled={item.disabled}
                    className={
                      item.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    {item.icon && <item.icon />}
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.disabled && (
                          <Lock className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <NotificationBadge count={getNavigationBadgeTotal([item], badges)} />
                    </div>
                    {!item.disabled && (
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.url === pathname}
                        >
                          <Link
                            href={subItem.disabled ? "#" : subItem.url}
                            onClick={(e) => {
                              if (subItem.disabled) {
                                e.preventDefault();
                                return;
                              }
                              if (isMobile) setOpenMobile(false);
                            }}
                            className={
                              subItem.disabled
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{subItem.title}</span>
                                {subItem.disabled && (
                                  <Lock className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                              <NotificationBadge count={getNavigationBadgeTotal([subItem], badges)} />
                            </div>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.url === pathname}
              >
                <Link
                  href={item.disabled ? "#" : item.url}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    if (isMobile) setOpenMobile(false);
                  }}
                  className={
                    item.disabled ? "pointer-events-none opacity-50" : ""
                  }
                >
                  {item.icon && <item.icon />}
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.disabled && (
                        <Lock className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <NotificationBadge count={getNavigationBadgeTotal([item], badges)} />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
    </SidebarMenu>
  );

  return (
    <SidebarGroup className={collapsibleGroup ? "py-1" : undefined}>
      {label && collapsibleGroup ? (
        <Collapsible open={groupOpen} onOpenChange={setGroupOpen} className="group/nav-section">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel asChild>
              <button
                type="button"
                aria-label={`${groupOpen ? "Collapse" : "Expand"} ${label}${groupTotal > 0 ? `, ${groupTotal} pending notifications` : ""}`}
                className="flex w-full cursor-pointer items-center justify-between hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <span className="min-w-0 truncate">{label}</span>
                <span className="ml-auto mr-2"><NotificationBadge count={groupTotal} /></span>
                <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/nav-section:rotate-90" />
              </button>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>{menu}</CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
          {menu}
        </>
      )}
    </SidebarGroup>
  );
}

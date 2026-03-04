"use client";

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
import type { NavItem } from "@/lib/navigation";

export function NavMain({
  items,
  label,
  badges,
}: {
  items: NavItem[];
  label?: string;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={
                item.isActive ||
                item.items.some((subItem) => subItem.url === pathname)
              }
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
                      {badges &&
                        item.badgeKey &&
                        (() => {
                          const keys = item.badgeKey.split(",");
                          const total = keys.reduce(
                            (acc, key) => acc + (badges[key.trim()] || 0),
                            0,
                          );
                          return total > 0 ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                              {total}
                            </span>
                          ) : null;
                        })()}
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
                              isMobile && setOpenMobile(false);
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
                              {badges &&
                                subItem.badgeKey &&
                                (() => {
                                  const keys = subItem.badgeKey.split(",");
                                  const total = keys.reduce(
                                    (acc, key) =>
                                      acc + (badges[key.trim()] || 0),
                                    0,
                                  );
                                  return total > 0 ? (
                                    <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                      {total}
                                    </span>
                                  ) : null;
                                })()}
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
                    isMobile && setOpenMobile(false);
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
                    {badges &&
                      item.badgeKey &&
                      (() => {
                        const keys = item.badgeKey.split(",");
                        const total = keys.reduce(
                          (acc, key) => acc + (badges[key.trim()] || 0),
                          0,
                        );
                        return total > 0 ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                            {total}
                          </span>
                        ) : null;
                      })()}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

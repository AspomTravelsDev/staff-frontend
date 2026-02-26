"use client";

import { ChevronRight } from "lucide-react";
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
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <div className="flex w-full items-center justify-between">
                      <span>{item.title}</span>
                      {badges && item.badgeKey && badges[item.badgeKey] > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                          {badges[item.badgeKey]}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
                            href={subItem.url}
                            onClick={() => isMobile && setOpenMobile(false)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span>{subItem.title}</span>
                              {badges &&
                                subItem.badgeKey &&
                                badges[subItem.badgeKey] > 0 && (
                                  <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                    {badges[subItem.badgeKey]}
                                  </span>
                                )}
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
                  href={item.url}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  {item.icon && <item.icon />}
                  <div className="flex w-full items-center justify-between">
                    <span>{item.title}</span>
                    {badges && item.badgeKey && badges[item.badgeKey] > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                        {badges[item.badgeKey]}
                      </span>
                    )}
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

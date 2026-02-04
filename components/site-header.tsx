"use client";
import { ThemeSwitcher } from "./icons/theme-switcher";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { BellIcon } from "lucide-react";
import { ClockInWidget } from "./clock-in-widget";
import { useUser } from "@/providers/user-provider";

export const SiteHeader = () => {
  const { user } = useUser();
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
                  <PopoverTrigger className="bg-primary cursor-pointer hover:bg-primary/80">
                    <BellIcon className="h-4 w-4 text-primary-foreground" />
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-bold">
                        No new notifications
                      </span>
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

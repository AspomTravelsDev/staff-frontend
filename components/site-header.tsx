"use client";
// import React, { useEffect, useState } from "react";
import { ThemeSwitcher } from "./icons/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { BellIcon } from "lucide-react";
// import { getExchangeRate } from "@/lib/getExchangeRate";
import { useUser } from "@/providers/user-provider";

export const SiteHeader = () => {
  // const [exchangeRate, setExchangeRate] = useState<{ USD: number; EUR: number; GBP: number } | null>(null);

  // useEffect(() => {
  //   getExchangeRate().then(setExchangeRate);
  // }, []);

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
          {/* Current Dollar, Euro and Pound Prices in naira */}
          {/* <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                $1 ={" "}
                {exchangeRate?.USD.toLocaleString("en-US", {
                  style: "currency",
                  currency: "NGN",
                })}
              </span>
              <span className="text-xs text-green-700 dark:text-green-400 font-bold">
                €1 ={" "}
                {exchangeRate?.EUR.toLocaleString("en-US", {
                  style: "currency",
                  currency: "NGN",
                })}
              </span>
              <span className="text-xs text-red-700 dark:text-red-400 font-bold">
                £1 ={" "}
                {exchangeRate?.GBP.toLocaleString("en-US", {
                  style: "currency",
                  currency: "NGN",
                })}
              </span>
            </div>
          </div> */}
          <div className="flex items-center gap-4">
            {" "}
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
            {/* User Image */}
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
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

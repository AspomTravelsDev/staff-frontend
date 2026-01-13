import type { Metadata } from "next";
import { Geist, Geist_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { getExchangeRate } from "@/lib/getExchangeRate";
import { BellIcon, User2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aspom Travels Staff Dashboard",
  description: "Manage your Aspom account and services",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const exchangeRate = await getExchangeRate();
  return (
    <html lang="en" className={publicSans.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
              </div>

              <div className="flex items-center justify-between w-full pr-8">
                <span className="text-sm text-gray-700 font-bold">
                  Welcome back, Damian
                </span>
                <div className="flex items-center gap-8">
                  {/* Current Dollar, Euro and Pound Prices in naira */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-blue-700 font-bold">
                        $1 ={" "}
                        {exchangeRate?.USD.toLocaleString("en-US", {
                          style: "currency",
                          currency: "NGN",
                        })}
                      </span>
                      <span className="text-xs text-green-700 font-bold">
                        €1 ={" "}
                        {exchangeRate?.EUR.toLocaleString("en-US", {
                          style: "currency",
                          currency: "NGN",
                        })}
                      </span>
                      <span className="text-xs text-red-700 font-bold">
                        £1 ={" "}
                        {exchangeRate?.GBP.toLocaleString("en-US", {
                          style: "currency",
                          currency: "NGN",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {" "}
                    {/* Popover Notifications */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center p-1.5 rounded-md bg-primary cursor-pointer">
                        <Popover>
                          <PopoverTrigger className="bg-primary cursor-pointer hover:bg-primary/80">
                            <BellIcon className="h-4 w-4 text-white" />
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700 font-bold">
                                No notifications
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
                  </div>
                </div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}

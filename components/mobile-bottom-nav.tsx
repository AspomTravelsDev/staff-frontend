"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  CalendarDays,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPattern: RegExp;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPattern: /^\/dashboard(\/.*)?$/,
  },
  {
    label: "Attendance",
    href: "/my/attendance",
    icon: Clock,
    matchPattern: /^\/my\/attendance(\/.*)?$/,
  },
  {
    label: "Tasks",
    href: "/my/tasks",
    icon: CheckSquare,
    matchPattern: /^\/my\/tasks(\/.*)?$/,
  },
  {
    label: "Leave",
    href: "/my/leave",
    icon: CalendarDays,
    matchPattern: /^\/my\/leave(\/.*)?$/,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/92 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPattern.test(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-95",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-150",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10.5px] mt-0.5 tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu drawer trigger */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-muted-foreground hover:text-foreground font-medium transition-all duration-150 active:scale-95 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10.5px] mt-0.5 tracking-tight leading-none">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}

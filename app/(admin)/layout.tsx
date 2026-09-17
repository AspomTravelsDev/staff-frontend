import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { UserProvider } from "@/providers/user-provider";
import { QueryProvider } from "@/providers/query-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/api/notifications";
import { NotificationsUpdater } from "@/components/notifications-updater";
import { GlobalChatNotifications } from "@/components/chat/global-chat-notifications";
import { CheatsheetFloatingWidget } from "@/components/cheatsheet-floating-widget";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/logout");
  }

  const initialNotifications = await getNotifications();

  return (
    <QueryProvider>
      <UserProvider user={user}>
        <NotificationsUpdater notifications={initialNotifications} />
        <GlobalChatNotifications />
        <SidebarProvider className="h-svh min-h-0 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
            <SiteHeader />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4 pt-4 pb-20 md:pb-4">
              {children}
            </div>
            {/* Native Mobile Bottom Navigation */}
            <MobileBottomNav />
            {/* <CheatsheetFloatingWidget /> */}
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </QueryProvider>
  );
}

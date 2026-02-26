import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { UserProvider } from "@/providers/user-provider";
import { QueryProvider } from "@/providers/query-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { FeedbackButton } from "@/components/feedback-button";
import { getNotifications } from "@/lib/api/notifications";
import { NotificationsUpdater } from "@/components/notifications-updater";

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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
            <FeedbackButton />
          </SidebarInset>
        </SidebarProvider>
      </UserProvider>
    </QueryProvider>
  );
}

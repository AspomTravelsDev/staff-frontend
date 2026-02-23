import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllAnnouncements } from "./queries";
import { AdminAnnouncementsContent } from "./components/admin-announcements-content";

export default async function AdminAnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user || !["admin", "super"].includes(user.role)) {
    redirect("/dashboard");
  }

  const announcements = await getAllAnnouncements();

  return <AdminAnnouncementsContent initialAnnouncements={announcements} />;
}

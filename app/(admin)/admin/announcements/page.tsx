import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getAllAnnouncements } from "./queries";
import { AdminAnnouncementsContent } from "./components/admin-announcements-content";

export default async function AdminAnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userHasAnyRole(user, ["admin", "super", "it"])) {
    redirect("/dashboard");
  }

  const announcements = await getAllAnnouncements();

  return <AdminAnnouncementsContent initialAnnouncements={announcements} />;
}

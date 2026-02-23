import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyAnnouncements } from "./queries";
import { AnnouncementsContent } from "./components/announcements-content";

export default async function MyAnnouncementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const announcements = await getMyAnnouncements();

  return <AnnouncementsContent initialAnnouncements={announcements} />;
}

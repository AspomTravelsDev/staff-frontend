import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canReviewAnnouncements } from "@/lib/announcement-review-access";
import { renderDataPage } from "@/lib/api/render-data-page";
import { getAllAnnouncements } from "./queries";
import { AdminAnnouncementsContent } from "./components/admin-announcements-content";

export default async function AdminAnnouncementsPage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    if (!canReviewAnnouncements(user)) {
      redirect("/dashboard");
    }

    const announcements = await getAllAnnouncements();

    return <AdminAnnouncementsContent initialAnnouncements={announcements} />;
  }, "Unable to load announcement reviews");
}

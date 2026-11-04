import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/api/announcements";
import { AnnouncementsTable } from "./components/announcements-table";
import { MarkAnnouncementsReadOnVisit } from "./components/mark-announcements-read-on-visit";

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const type = params.type === "announcement" || params.type === "newsletter" ? params.type : undefined;
  const result = await getAnnouncements({ status: "approved", limit: 20, page, type });

  return <><MarkAnnouncementsReadOnVisit /><AnnouncementsTable announcements={result.items} pagination={result.pagination} type={type} /></>;
}

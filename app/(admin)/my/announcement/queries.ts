import { getAnnouncements } from "@/lib/api/announcements";
import { getCurrentUser } from "@/lib/auth/session";
import type { AnnouncementItem } from "@/lib/api/announcements";

export async function getMyAnnouncements(): Promise<AnnouncementItem[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await getAnnouncements({ author_id: user.id });
    return result.items ?? [];
}

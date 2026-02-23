"use server";

import { getAnnouncements } from "@/lib/api/announcements";
import type { AnnouncementItem } from "@/lib/api/announcements";

export async function getAllAnnouncements(): Promise<AnnouncementItem[]> {
    const result = await getAnnouncements({ limit: 100 });
    return result.items ?? [];
}

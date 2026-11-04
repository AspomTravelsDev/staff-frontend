"use server";

import { api } from "@/lib/api/client";
import { ExpectedActionError } from "@/lib/api/action-result";
import type { AnnouncementItem } from "@/lib/api/announcements";

export async function getAllAnnouncements(): Promise<AnnouncementItem[]> {
    const announcements: AnnouncementItem[] = [];
    let totalPages = 1;
    for (let page = 1; page <= totalPages; page++) {
        const result = await api.get<{ data: AnnouncementItem[]; pagination: { total_pages: number } }>(`/api/announcements?limit=100&page=${page}`);
        if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
        announcements.push(...result.data.data);
        totalPages = result.data.pagination.total_pages;
    }
    return announcements;
}

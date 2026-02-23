"use server";

import { updateAnnouncement, deleteAnnouncement } from "@/lib/api/announcements";
import type { UpdateAnnouncementPayload } from "@/lib/api/announcements";

export async function updateAnnouncementAction(
    id: string,
    data: UpdateAnnouncementPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateAnnouncement(id, data);
        return { success: true };
    } catch (error) {
        console.error("Update announcement error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update",
        };
    }
}

export async function deleteAnnouncementAdminAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteAnnouncement(id);
        return { success: true };
    } catch (error) {
        console.error("Delete announcement error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete",
        };
    }
}

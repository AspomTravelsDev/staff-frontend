"use server";

import { createAnnouncement, deleteAnnouncement } from "@/lib/api/announcements";
import type { AnnouncementFormValues } from "@/lib/validations/announcements";

export async function createAnnouncementAction(
    data: AnnouncementFormValues
): Promise<{ success: boolean; error?: string }> {
    try {
        await createAnnouncement({
            type: data.type,
            title: data.title,
            content: data.content,
            // Convert Date → ISO string for the API; omit if not set
            publish_at: data.publish_at ? data.publish_at.toISOString() : null,
        });
        return { success: true };
    } catch (error) {
        console.error("Create announcement error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to submit announcement",
        };
    }
}


export async function deleteAnnouncementAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteAnnouncement(id);
        return { success: true };
    } catch (error) {
        console.error("Delete announcement error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete announcement",
        };
    }
}

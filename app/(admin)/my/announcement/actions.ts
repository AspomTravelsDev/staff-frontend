"use server";

import { format } from "date-fns";
import {
    createAnnouncement,
    deleteAnnouncement,
    updateAnnouncementContent,
} from "@/lib/api/announcements";
import type { AnnouncementFormValues } from "@/lib/validations/announcements";

export async function createAnnouncementAction(
    data: AnnouncementFormValues
): Promise<{ success: boolean; error?: string }> {
    try {
        await createAnnouncement({
            type: data.type,
            title: data.title,
            content: data.content,
            publish_at: data.publish_at
                ? format(data.publish_at, "yyyy-MM-dd'T'HH:mm:ssXXX")
                : null,
            priority: data.priority,
            visibility_days: data.visibility_days,
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

export async function updateAnnouncementContentAction(
    id: string,
    data: AnnouncementFormValues
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateAnnouncementContent(id, {
            type: data.type,
            title: data.title,
            content: data.content,
            publish_at: data.publish_at
                ? format(data.publish_at, "yyyy-MM-dd'T'HH:mm:ssXXX")
                : null,
            priority: data.priority,
            visibility_days: data.visibility_days,
        });
        return { success: true };
    } catch (error) {
        console.error("Update announcement error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to update announcement",
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

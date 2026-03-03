import { z } from "zod";

export const announcementSchema = z.object({
    type: z.enum(["announcement", "newsletter"] as const, {
        error: "Please select a type",
    }),
    priority: z.enum(["low", "medium", "high", "urgent"] as const),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must be under 150 characters"),
    content: z
        .string()
        .min(10, "Content must be at least 10 characters")
        .max(20000, "Content is too long"),
    publish_at: z
        .date()
        .min(new Date(), { message: "Scheduled time must be in the future" })
        .optional()
        .nullable(),
    visibility_days: z.number().min(1).nullable().optional(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

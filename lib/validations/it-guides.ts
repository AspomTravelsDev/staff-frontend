import { z } from "zod";

export const itGuideSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(200, "Title must be under 200 characters"),
    excerpt: z
        .string()
        .max(500, "Excerpt is too long")
        .optional()
        .nullable(),
    content: z
        .string()
        .min(10, "Content must be at least 10 characters"),
    category: z
        .string()
        .max(50, "Category is too long")
        .optional()
        .nullable(),
    status: z.enum(["draft", "published"] as const),
});

export type ITGuideFormValues = z.infer<typeof itGuideSchema>;

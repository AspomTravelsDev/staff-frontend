import { z } from "zod";

export const requestSchema = z.object({
    category: z.string().min(1, "Category is required"),
    priority: z.enum(["low", "medium", "high", "critical"]),
    reason: z.string().min(3, "Reason must be at least 3 characters").max(100, "Reason must be less than 100 characters"),
    details: z.string().min(10, "Please provide more details (at least 10 characters)"),
});

export type RequestFormValues = z.infer<typeof requestSchema>;

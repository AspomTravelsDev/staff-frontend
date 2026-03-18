export const weeklyFeedbackQueryKeys = {
    all: ["weekly-feedback"] as const,
    active: () => [...weeklyFeedbackQueryKeys.all, "active"] as const,
    lockStatus: () => [...weeklyFeedbackQueryKeys.all, "lock-status"] as const,
    questions: () => [...weeklyFeedbackQueryKeys.all, "questions"] as const,
    analytics: (weekStart?: string) =>
        [...weeklyFeedbackQueryKeys.all, "analytics", weekStart ?? "current"] as const,
};

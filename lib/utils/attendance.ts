/**
 * Utility to check if a clock-in time is late.
 * Threshold: After 09:05 AM Africa/Lagos (UTC+1)
 *
 * This ensures we always check against Lagos time regardless of the browser's timezone.
 */
export function isLate(dateString: string | Date): boolean {
    if (!dateString) return false;
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    const lagosTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    }).formatToParts(date);

    const hour = parseInt(lagosTime.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(lagosTime.find((p) => p.type === "minute")?.value || "0", 10);

    return hour > 9 || (hour === 9 && minute > 5);
}

/**
 * Formats a date string specifically as Lagos time (the "Office Clock").
 */
export function formatLagosTime(dateString: string | Date): string {
    if (!dateString) return "-";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
        .format(date)
        .toUpperCase();
}

/**
 * Formats a date string as a local date (Lagos perspective).
 */
export function formatLagosDate(dateString: string | Date): string {
    if (!dateString) return "-";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

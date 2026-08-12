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

/**
 * Formats a date string specifically as YYYY-MM-DD (Lagos perspective) for HTML date inputs.
 */
export function formatLagosDateForInput(dateString: string | Date | null | undefined): string {
    if (!dateString) return "";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    // en-CA natively formats as YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export type AttendanceStatusType = "on-time" | "late" | "late-permitted" | "proxy";

export function getAttendanceStatusInfo(record: {
    clock_in_at: string;
    is_late_permitted?: boolean;
    is_flagged_proxy?: boolean;
}): { status: AttendanceStatusType; label: string; badgeClass: string } {
    if (record.is_flagged_proxy) {
        return {
            status: "proxy",
            label: "Flagged Proxy",
            badgeClass: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800",
        };
    }

    const late = isLate(record.clock_in_at);

    if (late) {
        if (record.is_late_permitted) {
            return {
                status: "late-permitted",
                label: "Late (Permitted)",
                badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
            };
        }
        return {
            status: "late",
            label: "Late",
            badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800",
        };
    }

    return {
        status: "on-time",
        label: "On Time",
        badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
    };
}


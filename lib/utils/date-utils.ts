/**
 * Parses a date string (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss) as a calendar date,
 * avoiding timezone shifts by treating it as local time.
 */
export function parseCalendarDate(dateString: string): Date {
    // Extract only the date part YYYY-MM-DD (first 10 characters)
    // This handles both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss... formats
    const datePart = dateString.substring(0, 10);
    const [year, month, day] = datePart.split("-").map(Number);

    // Create date using local time constructor (month is 0-indexed)
    return new Date(year, month - 1, day);
}

/**
 * Tries to parse a date string using multiple common formats.
 * Returns a Date object if successful, or null if all formats fail.
 */
import { parse, isValid, format } from "date-fns";

export function parseFlexibleDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    const trimmed = dateString.trim();
    if (!trimmed) return null;

    // Try native Date first (handles ISO strings)
    const nativeDate = new Date(trimmed);
    if (isValid(nativeDate) && trimmed.includes('-') && trimmed.length >= 10) {
        return nativeDate;
    }

    const formats = [
        "yyyy-MM-dd",
        "dd/MM/yyyy",
        "MM/dd/yyyy",
        "dd-MM-yyyy",
        "MM-dd-yyyy",
        "dd.MM.yyyy",
        "yyyy/MM/dd",
        "d/M/yyyy",
        "M/d/yyyy",
        "MMM d, yyyy",
        "MMMM d, yyyy",
        "d MMM yyyy",
        "d MMMM yyyy",
    ];

    for (const fmt of formats) {
        try {
            const parsed = parse(trimmed, fmt, new Date());
            if (isValid(parsed)) {
                // Heuristic: if year is two digits, it might be ambiguous, but date-fns parse handles it.
                // We want to ensure we don't get crazy years.
                if (parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
                    return parsed;
                }
            }
        } catch (e) {
            // Continue to next format
        }
    }

    return null;
}

/**
 * Formats a date to YYYY-MM-DD for backend compatibility.
 */
export function formatToISODate(date: Date | null): string | null {
    if (!date || !isValid(date)) return null;
    return format(date, "yyyy-MM-dd");
}

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

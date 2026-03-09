import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));


export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Parses a date string like "YYYY-MM-DD" or "YYYY-MM-DDT..." into a local Date object,
 * effectively ignoring any time component or UTC offset in the string.
 * This prevents the typical bug where new Date("YYYY-MM-DD") is parsed as UTC
 * and then shifted to the previous day in western timezones.
 */
export function parseLocalDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;
  try {
    const datePart = dateString.split("T")[0]; // "YYYY-MM-DD"
    const [yearStr, monthStr, dayStr] = datePart.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    return new Date(year, month - 1, day);
  } catch (e) {
    return undefined;
  }
}

/**
 * Returns a proxied URL for a backend file to handle authentication
 * via cookies in standard <img> tags.
 */
export function getProxiedImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith("http")) return url; // Already local or data URL

  return `/api/proxy-file?url=${encodeURIComponent(url)}`;
}
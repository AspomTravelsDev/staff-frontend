/**
 * Converts a backend image_url (which requires Bearer auth) into a
 * local Next.js proxy URL that the browser can load without auth headers.
 *
 * Example:
 *   input:  "http://localhost:8000/api/files/download/42"
 *   output: "/api/proxy/image/api/files/download/42"
 *
 * Returns null if the url is null/undefined/empty.
 */
export function toProxiedImageUrl(imageUrl: string | null | undefined): string | undefined {
    if (!imageUrl) return undefined;

    try {
        const parsed = new URL(imageUrl);
        // parsed.pathname is e.g. "/api/files/download/42"
        // strip leading slash so we get "api/files/download/42"
        const backendPath = parsed.pathname.replace(/^\//, "");
        return `/api/proxy/image/${backendPath}`;
    } catch {
        // If it's already a relative URL or malformed, return as-is
        return imageUrl;
    }
}

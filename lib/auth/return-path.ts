/** Only return to local pages, never an external URL or another authentication flow. */
export function safeReturnPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://portal.invalid");
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== "https://portal.invalid" || decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    if (/^\/(?:auth|api|_next|login|reset-password|update-password|accept-invite)(?:\/|$)/.test(decoded)) return fallback;
    url.searchParams.delete("_rsc");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function sessionLogoutUrl(returnPath: unknown): string {
  return `/auth/logout?redirect=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

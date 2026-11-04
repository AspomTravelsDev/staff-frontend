import { sessionLogoutUrl } from "./return-path";

/** Cover authenticated same-origin uploads/downloads which bypass the shared API client. */
export function installSessionRecovery(): () => void {
  const previousFetch = window.fetch;
  let redirecting = false;
  let active = true;
  const sessionFetch: typeof fetch = async (input, options) => {
    const response = await previousFetch.call(window, input, options);
    const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(address, window.location.href);
    if (active && !redirecting && response.status === 401 && url.origin === window.location.origin && url.pathname.startsWith("/api/") && !/^\/api\/(?:auth|login|logout)(?:\/|$)/.test(url.pathname)) {
      redirecting = true;
      window.location.replace(sessionLogoutUrl(window.location.pathname + window.location.search + window.location.hash));
    }
    return response;
  };
  window.fetch = sessionFetch;
  return () => { active = false; if (window.fetch === sessionFetch) window.fetch = previousFetch; };
}

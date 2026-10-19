/** Map stored backend document URLs to the portal's own download endpoint. */
export function onboardingDownloadUrl(url: string, applicationId: string): string {
  const parsed = new URL(url, "http://onboarding.invalid");
  const match = parsed.pathname.match(/^\/api\/public\/onboarding-applications\/([a-zA-Z0-9-]+)\/(files|assets)\/([^/]+)$/);
  if (!match || match[1] !== applicationId) throw new Error("Invalid onboarding document link.");
  const document = decodeURIComponent(match[3]);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_. -]*$/.test(document) || document.includes("..")) {
    throw new Error("Invalid onboarding document link.");
  }
  return `/api/onboarding/${applicationId}/documents/${match[2]}/${encodeURIComponent(document)}`;
}

export async function fetchOnboardingDocument(url: string, applicationId: string): Promise<Response> {
  return fetch(onboardingDownloadUrl(url, applicationId), { cache: "no-store" });
}

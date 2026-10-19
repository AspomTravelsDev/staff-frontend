export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string; kind: string; document: string }> },
) {
  const { applicationId, kind, document } = await params;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validDocument = kind === "files" ? uuid.test(document)
    : kind === "assets" && /^[a-zA-Z0-9][a-zA-Z0-9_. -]*$/.test(document) && !document.includes("..");
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!uuid.test(applicationId) || !validDocument) {
    return new Response("Invalid document link.", { status: 400, headers });
  }

  // Fetch only the configured backend's existing public, application-scoped endpoint.
  // Never forward a visitor's credentials or accept an arbitrary upstream URL.
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
    || (process.env.NODE_ENV === "production" ? "https://api.aspomportal.com" : "http://127.0.0.1:8000");
  try {
    const response = await fetch(
      `${base.replace(/\/$/, "")}/api/public/onboarding-applications/${applicationId}/${kind}/${encodeURIComponent(document)}`,
      { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30_000) },
    );
    if (!response.ok) {
      return new Response(response.status === 404 ? "This document is no longer available. Refresh the page and try again." : "The document could not be downloaded. Please try again.", {
        status: response.status, headers,
      });
    }
    // Finish reading upstream before responding so a reset produces a useful error.
    const content = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const disposition = response.headers.get("content-disposition") || "attachment";
    return new Response(content, {
      headers: {
        ...headers,
        "Content-Length": String(content.byteLength),
        "Content-Type": contentType,
        "Content-Disposition": disposition,
      },
    });
  } catch {
    return new Response("The document service could not be reached. Please try again.", { status: 502, headers });
  }
}

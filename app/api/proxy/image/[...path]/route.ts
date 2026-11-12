import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
    ? "https://api.aspomportal.com"
    : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

/**
 * GET /api/proxy/image/api/files/download/{fileId}
 *
 * Proxies authenticated file requests from the backend.
 * The browser doesn't need to send auth headers — Next.js does it server-side.
 *
 * Usage: src="/api/proxy/image/api/files/download/{fileId}"
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const resolvedParams = await params;
    const token = await getAuthToken();

    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendPath = resolvedParams.path.join("/");
    const backendUrl = `${API_URL}/${backendPath}`;

    try {
        const backendRes = await fetch(backendUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "*/*",
            },
            cache: "no-store",
        });

        if (!backendRes.ok) {
            return new NextResponse("File not found", { status: backendRes.status });
        }

        const contentType = backendRes.headers.get("content-type") || "application/octet-stream";
        const contentLength = backendRes.headers.get("content-length");
        const headers: Record<string, string> = {
            "Content-Type": contentType,
            // Cache for 24 hours in browser with 7-day stale-while-revalidate to avoid redundant proxy invocations
            "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
        };
        if (contentLength) {
            headers["Content-Length"] = contentLength;
        }

        return new NextResponse(backendRes.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("File proxy error:", error);
        return new NextResponse("Proxy error", { status: 502 });
    }
}

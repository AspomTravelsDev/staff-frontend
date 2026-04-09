import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        const buffer = await backendRes.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                // Cache for 5 minutes in browser; revalidated each time by the proxy
                "Cache-Control": "private, max-age=300",
            },
        });
    } catch (error) {
        console.error("File proxy error:", error);
        return new NextResponse("Proxy error", { status: 502 });
    }
}

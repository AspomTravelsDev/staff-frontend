import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    let targetUrl = url;

    // Normalizing Laravel localhost URLs for Node Fetch
    // If APP_URL lacks a port / resolves to ::1 instead of 127.0.0.1, Node fetch breaks.
    if (targetUrl.startsWith("http://localhost/") || targetUrl.startsWith("http://127.0.0.1/")) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const parsed = new URL(targetUrl);
        targetUrl = `${apiUrl}${parsed.pathname}${parsed.search}`;
    } else if (targetUrl.startsWith("http://localhost:8000")) {
        targetUrl = targetUrl.replace("http://localhost:8000", "http://127.0.0.1:8000");
    }

    const token = await getAuthToken();

    try {
        const response = await fetch(targetUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        const contentDisposition = response.headers.get("content-disposition");
        const buffer = await response.arrayBuffer();

        const headers: Record<string, string> = {
            "Content-Type": contentType || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
        };

        if (contentDisposition) {
            headers["Content-Disposition"] = contentDisposition;
        }

        return new NextResponse(buffer, { headers });
    } catch (error) {
        console.error("Proxy error fetching file:", error);
        return new NextResponse("Error fetching file proxy", { status: 500 });
    }
}

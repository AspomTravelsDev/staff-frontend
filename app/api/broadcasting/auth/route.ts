import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

// Prefer the server-side API URL in production, with fallbacks for development.
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyAuthRequest(request: NextRequest) {
    const token = await getAuthToken();
    if (!token) {
        console.warn("Broadcast auth proxy: no token available");
        return new NextResponse("Unauthorized", { status: 401 });
    }

    function maskToken(t: string | null | undefined) {
        if (!t) return null;
        return t.length > 12 ? `${t.slice(0, 8)}...${t.slice(-4)}` : t;
    }

    const backendUrl = `${API_URL}/api/broadcasting/auth`;

    const requestBody = await request.text();
    console.info(`Broadcast auth proxy: forwarding ${request.method} to ${backendUrl}`);
    console.info(`Broadcast auth proxy: auth=${maskToken(token)} bodyPreview=${requestBody ? requestBody.slice(0, 200) : "(empty)"
        }`);

    try {
        const backendResponse = await fetch(backendUrl, {
            method: request.method,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                ...(request.headers.get("Content-Type")
                    ? { "Content-Type": request.headers.get("Content-Type")! }
                    : {}),
            },
            body: requestBody,
            cache: "no-store",
        });

        const body = await backendResponse.text();

        console.info(
            `Broadcast auth proxy: backend status=${backendResponse.status} content-type=${backendResponse.headers.get("content-type")}`
        );

        return new NextResponse(body, {
            status: backendResponse.status,
            headers: {
                "Content-Type":
                    backendResponse.headers.get("content-type") || "application/json",
            },
        });
    } catch (error) {
        console.error("Broadcast auth proxy error:", error);
        return new NextResponse("Proxy error", { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    return proxyAuthRequest(request);
}

export async function GET(request: NextRequest) {
    return proxyAuthRequest(request);
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyAuthRequest(request: NextRequest) {
    const token = await getAuthToken();
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendUrl = `${API_URL}/api/broadcasting/auth`;

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
            body: await request.text(),
            cache: "no-store",
        });

        const body = await backendResponse.text();

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

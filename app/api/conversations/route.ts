import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(_request: NextRequest) {
    const token = await getAuthToken();
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendUrl = `${API_URL}/api/conversations`;

    try {
        const backendResponse = await fetch(backendUrl, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
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
        console.error("Conversations proxy error:", error);
        return new NextResponse("Proxy error", { status: 502 });
    }
}

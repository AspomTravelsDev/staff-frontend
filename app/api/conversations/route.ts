import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
    ? "https://api.aspomportal.com"
    : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
    const token = await getAuthToken();
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendUrl = `${API_URL}/api/conversations`;

    const maxAttempts = 3;
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            const backendResponse = await fetch(backendUrl, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const contentType = backendResponse.headers.get("content-type") || "application/json";
            const body = await backendResponse.text();

            // Mirror backend status and content-type
            return new NextResponse(body, {
                status: backendResponse.status,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
                },
            });
        } catch (err) {
            lastError = err;
            console.error(`Conversations proxy: fetch error (attempt ${attempt})`, err);

            // If not last attempt, wait with exponential backoff
            if (attempt < maxAttempts) {
                const backoffMs = attempt === 1 ? 300 : 1000;
                await sleep(backoffMs);
                continue;
            }
        }
    }

    console.error("Conversations proxy final error:", lastError);
    return new NextResponse("Proxy error", { status: 502 });
}

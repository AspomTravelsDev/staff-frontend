import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
    ? "https://api.aspomportal.com"
    : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function maskToken(token: string | null | undefined) {
    if (!token) return null;
    return token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : token;
}

export async function GET(_request: NextRequest) {
    const token = await getAuthToken();
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const backendUrl = `${API_URL}/api/conversations`;

    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
        attempt += 1;
        const start = Date.now();
        try {
            console.info(`Conversations proxy: fetching ${backendUrl} (attempt ${attempt})`);
            console.info(`Conversations proxy: auth=${maskToken(token)}`);

            const backendResponse = await fetch(backendUrl, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const elapsed = Date.now() - start;
            const contentType = backendResponse.headers.get("content-type") || "application/json";
            const body = await backendResponse.text();

            console.info(
                `Conversations proxy: success status=${backendResponse.status} elapsed=${elapsed}ms content-type=${contentType}`
            );

            // Mirror backend status and content-type
            return new NextResponse(body, {
                status: backendResponse.status,
                headers: {
                    "Content-Type": contentType,
                },
            });
        } catch (err) {
            lastError = err;
            const elapsed = Date.now() - start;
            console.error(
                `Conversations proxy: fetch error (attempt ${attempt}) after ${elapsed}ms:`,
                err
            );

            // If not last attempt, wait with exponential backoff
            if (attempt < maxAttempts) {
                const backoffMs = attempt === 1 ? 300 : 1000;
                console.info(`Conversations proxy: retrying after ${backoffMs}ms`);
                // eslint-disable-next-line no-await-in-loop
                await sleep(backoffMs);
                continue;
            }
        }
    }

    console.error("Conversations proxy final error:", lastError);
    return new NextResponse("Proxy error", { status: 502 });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendUrl = `${API_URL}/api/visa/sample-purposes/generate`;

  try {
    const body = await request.json();

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseData = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") || "application/json";

    return new NextResponse(responseData, {
      status: backendResponse.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Visa sample purposes proxy error:", error);
    return NextResponse.json({ error: "Failed to connect to visa backend service" }, { status: 500 });
  }
}

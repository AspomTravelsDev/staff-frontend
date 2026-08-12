import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function GET(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backendUrl = `${API_URL}/api/late-permission-requests?${searchParams.toString()}`;

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
      headers: { "Content-Type": backendResponse.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect to backend service" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendUrl = `${API_URL}/api/late-permission-requests`;

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

    const responseText = await backendResponse.text();
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit late request" }, { status: 500 });
  }
}

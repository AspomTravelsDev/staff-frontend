import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const backendUrl = `${API_URL}/api/late-permission-requests/${id}/cancel`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel late request" }, { status: 500 });
  }
}

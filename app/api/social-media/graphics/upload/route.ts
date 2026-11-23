import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.aspomportal.com"
    : "http://localhost:8000";

const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const incoming = await request.formData();
    const rawGraphicId = incoming.get("graphic_id");
    const graphicId =
      typeof rawGraphicId === "string" && rawGraphicId.trim() !== ""
        ? rawGraphicId.trim()
        : null;

    if (graphicId && !UUID_PATTERN.test(graphicId)) {
      return NextResponse.json(
        { message: "Invalid graphic identifier." },
        { status: 400 }
      );
    }

    const forwardForm = new FormData();
    for (const [key, value] of incoming.entries()) {
      if (key === "graphic_id") continue;
      if (value instanceof Blob) {
        const fileName = (value as File).name || "graphic";
        forwardForm.append(key, value, fileName);
      } else {
        forwardForm.append(key, value);
      }
    }

    const endpoint = graphicId
      ? `${API_URL}/api/social-media/graphics/${encodeURIComponent(graphicId)}/items`
      : `${API_URL}/api/social-media/graphics`;

    const backendRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: forwardForm,
      cache: "no-store",
    });

    const text = await backendRes.text();
    let payload: unknown = {};
    if (text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: "Unexpected server response." };
      }
    }

    return NextResponse.json(payload, { status: backendRes.status });
  } catch (error) {
    console.error("Social media graphics upload proxy error:", error);
    return NextResponse.json(
      { message: "Unable to upload graphic right now. Please try again." },
      { status: 502 }
    );
  }
}

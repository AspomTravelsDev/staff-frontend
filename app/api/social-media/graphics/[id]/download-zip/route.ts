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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new NextResponse("Invalid graphic identifier", { status: 400 });
  }

  try {
    const backendRes = await fetch(
      `${API_URL}/api/social-media/graphics/${encodeURIComponent(id)}/download-zip`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/zip, */*",
        },
        cache: "no-store",
        redirect: "error",
      }
    );

    if (!backendRes.ok) {
      return new NextResponse("Unable to download carousel archive", {
        status: backendRes.status,
      });
    }

    const contentDisposition =
      backendRes.headers.get("content-disposition") ||
      'attachment; filename="graphics.zip"';
    const contentLength = backendRes.headers.get("content-length");

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/zip",
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    return new NextResponse(backendRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Social media graphic ZIP proxy error:", error);
    return new NextResponse("Unable to download archive", { status: 502 });
  }
}

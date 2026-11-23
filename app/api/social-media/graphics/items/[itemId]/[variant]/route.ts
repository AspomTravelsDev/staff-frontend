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
const ALLOWED_VARIANTS = new Set(["thumb", "preview", "original"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; variant: string }> }
) {
  const token = await getAuthToken();
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { itemId, variant } = await params;
  if (!UUID_PATTERN.test(itemId) || !ALLOWED_VARIANTS.has(variant)) {
    return new NextResponse("Invalid media request", { status: 400 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "*/*",
  };

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) {
    headers["If-None-Match"] = ifNoneMatch;
  }

  try {
    const backendRes = await fetch(
      `${API_URL}/api/social-media/graphics/items/${encodeURIComponent(itemId)}/media/${encodeURIComponent(variant)}`,
      {
        headers,
        cache: "no-store",
        redirect: "error",
      }
    );

    if (backendRes.status === 304) {
      const etag = backendRes.headers.get("etag");
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control":
            variant === "original"
              ? "private, no-store"
              : "private, max-age=31536000, immutable",
          ...(etag ? { ETag: etag } : {}),
        },
      });
    }

    if (!backendRes.ok) {
      return new NextResponse("Graphic unavailable", {
        status: backendRes.status,
      });
    }

    const contentType =
      backendRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = backendRes.headers.get("content-length");
    const contentDisposition = backendRes.headers.get("content-disposition");
    const etag = backendRes.headers.get("etag");

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control":
        variant === "original"
          ? "private, no-store"
          : "private, max-age=31536000, immutable",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (contentDisposition) {
      responseHeaders["Content-Disposition"] = contentDisposition;
    }
    if (etag) {
      responseHeaders["ETag"] = etag;
    }

    return new NextResponse(backendRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Social media graphic media proxy error:", error);
    return new NextResponse("Unable to load graphic", { status: 502 });
  }
}

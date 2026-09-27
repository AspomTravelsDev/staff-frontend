import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 422 }
      );
    }

    const backendFormData = new FormData();
    const fileName = (file as File).name || "leave_document";
    backendFormData.append("file", file, fileName);
    backendFormData.append("model_type", "LeaveRequest");
    backendFormData.append("model_id", "temp");

    const backendResponse = await fetch(`${API_URL}/api/files/upload/leave_document`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      const errorMsg =
        data.message || data.error || `Upload failed with status ${backendResponse.status}`;
      return NextResponse.json({ error: errorMsg }, { status: backendResponse.status });
    }

    const downloadUrl = data.data?.download_url || data.download_url;
    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Upload succeeded but no download URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, download_url: downloadUrl });
  } catch (error: any) {
    console.error("Leave document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

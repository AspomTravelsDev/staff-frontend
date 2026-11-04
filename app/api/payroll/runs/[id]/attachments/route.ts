import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const formData = await request.formData();
    const backendResponse = await fetch(`${API_URL}/api/hr/payroll/runs/${id}/attachments`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
    const responseText = await backendResponse.text();
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "Could not upload payroll supporting document. Please try again." }, { status: 500 });
  }
}

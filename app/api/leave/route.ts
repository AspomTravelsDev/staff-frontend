import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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
    const payload = await request.json();

    const backendResponse = await fetch(`${API_URL}/api/my/leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      let errorMessage = data.message || data.error || `Request failed with status ${backendResponse.status}`;
      if (data.errors && typeof data.errors === "object") {
        const flatErrors = Object.values(data.errors).flat().filter(Boolean);
        if (flatErrors.length > 0) {
          errorMessage = flatErrors.join(" ");
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: backendResponse.status });
    }

    revalidatePath("/my/leave");
    revalidatePath("/hr/leave");

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error: any) {
    console.error("Create leave request API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit leave request" },
      { status: 500 }
    );
  }
}

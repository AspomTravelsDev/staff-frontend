import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production" ? "https://api.aspomportal.com" : "http://localhost:8000";
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthToken();
  if (!token) return new Response("Unauthenticated", { status: 401 });
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return new Response("Invalid file", { status: 400 });

  const response = await fetch(`${API_URL}/api/birth-services-information/${id}/file`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!response.ok) return new Response("The file could not be downloaded.", { status: response.status });
  return new Response(response.body, { headers: {
    "Content-Type": response.headers.get("content-type") || "application/octet-stream",
    "Content-Disposition": response.headers.get("content-disposition") || "attachment",
    "Cache-Control": "private, no-store",
  } });
}

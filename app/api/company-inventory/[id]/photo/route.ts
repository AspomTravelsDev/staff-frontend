import { getAuthToken } from '@/lib/auth/session';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthToken();
  if (!token) return new Response('Unauthenticated', { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response('Invalid asset', { status: 400 });
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.aspomportal.com' : 'http://127.0.0.1:8000');
  try {
    const response = await fetch(`${base}/api/admin/company-inventory/${id}/photo`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) return new Response('Photo unavailable', { status: response.status });
    const type = response.headers.get('content-type') || '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type.split(';')[0])) return new Response('Invalid photo', { status: 415 });
    return new Response(response.body, { headers: { 'Content-Type': type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Unable to load photo', { status: 502 }); }
}

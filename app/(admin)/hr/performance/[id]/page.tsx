import { redirect } from "next/navigation";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/performance/reviews/${encodeURIComponent(id)}`);
}

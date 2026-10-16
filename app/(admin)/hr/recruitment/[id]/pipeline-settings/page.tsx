import { redirect } from "next/navigation";
export default async function PipelineSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hr/recruitment/${encodeURIComponent(id)}?settings=1`);
}

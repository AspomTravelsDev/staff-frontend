import { redirect } from "next/navigation";
export default async function ApplicantPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id, candidateId } = await params;
  redirect(
    `/hr/recruitment/${encodeURIComponent(id)}?applicant=${encodeURIComponent(candidateId)}`,
  );
}

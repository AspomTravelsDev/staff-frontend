import { redirect } from "next/navigation";

export default async function ApplicantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Redirect to step 1
  redirect(`/applicant/${id}/1`);
}

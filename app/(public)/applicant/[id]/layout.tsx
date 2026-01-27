export default async function ApplicantSessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // In a real app, we would validate the ID here.
  // For frontend-only, we just pass through.

  return <>{children}</>;
}

import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ContentCollectionWorkspace } from "@/components/social-media/content-collection-workspace";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const roles = [user?.role, ...(user?.secondary_roles ?? [])];
  if (!roles.some(role => role === "social-media" || role === "super")) redirect("/dashboard");
  const { id } = await params;
  return <ContentCollectionWorkspace collectionId={id} />;
}

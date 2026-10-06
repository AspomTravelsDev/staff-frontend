import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ContentCollections } from "@/components/social-media/content-collections";

export default async function Page() {
  const user = await getCurrentUser();
  const roles = [user?.role, ...(user?.secondary_roles ?? [])];
  if (!roles.some(role => role === "social-media" || role === "super")) redirect("/dashboard");
  return <ContentCollections />;
}

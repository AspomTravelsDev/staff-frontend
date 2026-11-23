import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessSocialMediaGraphics } from "@/lib/social-media-graphics-access";
import { SocialMediaGraphicsWorkspace } from "@/components/social-media/graphics/graphics-workspace";

export const metadata: Metadata = {
  title: "Graphics Library | Social Media Tools",
  description:
    "Upload fresh social media graphics, collaborate on captions, and track posted and archived assets.",
};

export default async function SocialMediaGraphicsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!canAccessSocialMediaGraphics(user)) {
    redirect("/dashboard");
  }

  return <SocialMediaGraphicsWorkspace />;
}

import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/types/user-types";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "@/components/profile-form";
import { getMyAwards } from "@/lib/api/awards";
import { AwardsCard } from "./components/awards-card";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch awards concurrently with user data if possible, but safe here
  // Ideally we would Promise.all but getCurrentUser is needed for auth check
  const awards = await getMyAwards().catch(() => []); // Fail gracefully if awards API errors

  const initials = getInitials(user.name);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your personal information and employment details.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Awards & Stats (could add more later) */}
        <div className="space-y-6 md:col-span-1 order-2 md:order-1">
          <AwardsCard awards={awards} />
          {/* Potential Attendance Summary could go here too */}
        </div>

        {/* Right Column: Profile Form (Main Content) */}
        <Card className="md:col-span-2 order-1 md:order-2">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <AvatarUpload user={user} initials={initials} />

            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                <span className="text-muted-foreground">•</span>
                <span>{user.staff_id}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

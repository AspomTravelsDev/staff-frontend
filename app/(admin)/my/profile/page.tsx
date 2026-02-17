import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRoleLabel } from "@/types/user-types";

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

  const initials = getInitials(user.name);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your personal information and employment details.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Personal Details Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage src={user.image_url || ""} alt={user.name} />
              <AvatarFallback className="rounded-lg text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {getRoleLabel(user.role)}
                <Badge variant={user.is_active ? "default" : "destructive"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Email Address
                </span>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Phone Number
                </span>
                <p className="text-sm font-medium">
                  {user.phone || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Staff ID
                </span>
                <p className="text-sm font-medium">{user.staff_id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Date Joined
                </span>
                <p className="text-sm font-medium">
                  {user.date_joined
                    ? new Date(user.date_joined).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not recorded"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

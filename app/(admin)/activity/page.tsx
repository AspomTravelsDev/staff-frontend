import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ActivityTable } from "./components/activity-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActivities } from "@/lib/api/activity";
import { userHasAnyRole } from "@/types/user-types";

export default async function ActivityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userHasAnyRole(user, ["super", "it"])) {
    redirect("/dashboard");
  }

  const { items: activities, pagination } = await getActivities({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          System-wide audit trail of all actions and changes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {activities.length} of {pagination.total} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTable activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}

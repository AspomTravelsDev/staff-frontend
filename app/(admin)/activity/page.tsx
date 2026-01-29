import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ActivityList } from "./components/activity-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActivities } from "@/lib/api/activity";

export default async function ActivityPage() {
  const user = await getCurrentUser();

  // Only admin, super, and IT can access activity log
  if (!user || !["super", "it"].includes(user.role)) {
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
          <ActivityList activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}

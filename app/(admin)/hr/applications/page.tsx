import { renderDataPage } from "@/lib/api/render-data-page";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationsTable } from "./components/applications-table";
import {
  getApplications,
  markOnboardingNotificationsViewed,
} from "@/lib/api/hr";

export default async function AdminDashboardPage() {
  return renderDataPage(async () => {
    const applications = await getApplications();

    // Opening this page clears "new onboarding completions" notifications.
    void markOnboardingNotificationsViewed().catch((error) => {
      console.error(
        "Failed to mark onboarding notifications as viewed:",
        error,
      );
    });

    const stats = {
      total: applications.length,
      invited: applications.filter((a) => a.status === "invited").length,
      inProgress: applications.filter((a) => a.status === "in_progress").length,
      completed: applications.filter((a) => a.status === "completed").length,
    };

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Applications Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage onboarding applications and track progress
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button asChild className="min-h-10 flex-1 sm:flex-none">
              <Link href="/hr/applications/new">Create Application</Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.invited}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <ApplicationsTable applications={applications} />
      </div>
    );
  }, "Unable to load onboarding applications");
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApplicationActions } from "./components/application-actions";
import { ApplicationExportButton } from "./components/application-export-button";
import {
  getApplications,
  markOnboardingNotificationsViewed,
} from "@/lib/api/hr";
import { formatLagosDate } from "@/lib/utils/attendance";

export default async function AdminDashboardPage() {
  const applications = await getApplications();

  // Opening this page clears "new onboarding completions" notifications.
  void markOnboardingNotificationsViewed().catch((error) => {
    console.error("Failed to mark onboarding notifications as viewed:", error);
  });

  const stats = {
    total: applications.length,
    invited: applications.filter((a) => a.status === "invited").length,
    inProgress: applications.filter((a) => a.status === "in_progress").length,
    completed: applications.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="space-y-8">
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
          <div className="flex-1 sm:flex-none">
            <ApplicationExportButton applications={applications} />
          </div>
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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first onboarding application to get started.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/hr/applications/new">Create Application</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="space-y-3 rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {app.applicant_name ||
                            app.applicant_email.split("@")[0]}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {app.applicant_email}
                        </p>
                      </div>
                      <Badge
                        className="shrink-0"
                        variant={
                          app.status === "completed"
                            ? "default"
                            : app.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {app.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="break-words">{app.position_title}</span>
                      <span>{formatLagosDate(app.invited_at)}</span>
                    </div>
                    <ApplicationActions
                      id={app.id}
                      step={app.form_data?.currentStep ?? 1}
                    />
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.applicant_name ||
                            app.applicant_email.split("@")[0]}
                        </TableCell>
                        <TableCell>{app.applicant_email}</TableCell>
                        <TableCell>{app.position_title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              app.status === "completed"
                                ? "default"
                                : app.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {app.status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatLagosDate(app.invited_at)}</TableCell>
                        <TableCell>
                          <ApplicationActions
                            id={app.id}
                            step={app.form_data?.currentStep ?? 1}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

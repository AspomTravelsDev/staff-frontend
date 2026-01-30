import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RequestsTable } from "./components/requests-table";
import { StatsCards } from "./components/stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequests, getRequestStats } from "@/lib/api/requests";

export default async function RequestsPage() {
  const user = await getCurrentUser();

  // Only admin, super, and IT can access requests log
  // Assuming access control is similar to activity log
  if (!user || !["super", "it", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch data in parallel
  const [requestsData, stats] = await Promise.all([
    getRequests({ limit: 50 }),
    getRequestStats(),
  ]);

  const { items: requests, pagination } = requestsData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Requests</h1>
        <p className="text-muted-foreground">
          Manage and track all internal requests from employees.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            Showing {requests.length} of {pagination.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}

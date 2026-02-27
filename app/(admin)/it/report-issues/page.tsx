import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import { getItIssues, getItIssueStats } from "@/lib/api/it-issues";
import { ItIssuesTable } from "./components/it-issues-table";

export default async function IssueTrackerAdminPage() {
  const [issuesResult, statsResult] = await Promise.all([
    getItIssues(),
    getItIssueStats(),
  ]);

  const issues = issuesResult.success ? issuesResult.data.data : [];
  const stats = statsResult.success
    ? statsResult.data
    : { open: 0, in_progress: 0, resolved: 0, critical: 0 };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Issue Tracker</h1>
        <p className="text-muted-foreground">
          Monitor and resolve incoming IT support tickets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Open Tickets"
          icon={Inbox}
          value={stats.open}
          description="Awaiting action"
          iconClassName="text-orange-500"
        />
        <StatsCard
          title="In Progress"
          icon={Clock}
          value={stats.in_progress}
          description="Currently being worked on"
          iconClassName="text-blue-500"
        />
        <StatsCard
          title="Resolved"
          icon={CheckCircle}
          value={stats.resolved}
          description="Closed successfully"
          iconClassName="text-green-500"
        />
        <StatsCard
          title="Critical Issues"
          icon={AlertTriangle}
          value={stats.critical}
          description="High priority tickets"
          iconClassName="text-destructive"
        />
      </div>

      {/* All Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <ItIssuesTable issues={issues} />
        </CardContent>
      </Card>
    </div>
  );
}

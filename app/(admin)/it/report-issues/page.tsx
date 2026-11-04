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

      <ItIssuesTable issues={issues} stats={stats} />
    </div>
  );
}

import { IssueForm } from "./components/issue-form";
import { MyIssuesContent } from "./components/my-issues-content";
import { getItIssues } from "@/lib/api/it-issues";

export default async function ReportIssuePage() {
  const result = await getItIssues();
  const issues = result.success ? result.data.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 pt-10 lg:pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My IT Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Submit and track your IT support requests.
          </p>
        </div>
        <IssueForm />
      </div>

      <MyIssuesContent issues={issues} />
    </div>
  );
}

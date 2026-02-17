import { StatsCard } from "@/components/dashboard/stats-card";
import { CreateApplicationButton } from "./components/create-application-button";
import { ApplicationsTable } from "./components/applications-table";
import { getApplications } from "./queries";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export const metadata = {
  title: "Visa Applications | Aspom Travels",
  description: "Manage visa applications",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    country?: string;
    page?: string;
  }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const applications = await getApplications({
    status: params.status,
    country: params.country,
    page: params.page ? parseInt(params.page) : 1,
  });

  // Calculate statistics
  const totalApplications = applications.data.length;
  const pendingApplications = applications.data.filter(
    (app) => app.status === "draft" || app.status === "processing",
  ).length;
  const completedApplications = applications.data.filter(
    (app) => app.status === "approved" || app.status === "submitted",
  ).length;
  const rejectedApplications = applications.data.filter(
    (app) => app.status === "rejected",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visa Applications</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track visa applications
          </p>
        </div>
        <CreateApplicationButton />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Applications"
          icon={FileText}
          value={totalApplications.toString()}
          description="All applications"
          color="blue"
        />
        <StatsCard
          title="Pending"
          icon={Clock}
          value={pendingApplications.toString()}
          description="Awaiting review"
          color="yellow"
        />
        <StatsCard
          title="Completed"
          icon={CheckCircle}
          value={completedApplications.toString()}
          description="Approved & submitted"
          color="green"
        />
        <StatsCard
          title="Rejected"
          icon={XCircle}
          value={rejectedApplications.toString()}
          description="Not approved"
          color="red"
        />
      </div>

      {/* Applications table */}
      <ApplicationsTable
        applications={applications.data}
        totalPages={applications.totalPages}
        currentPage={applications.currentPage}
      />
    </div>
  );
}

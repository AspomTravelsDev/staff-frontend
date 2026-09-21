import { getRecruitmentRoles } from "@/lib/api/recruitment";
import { getAllHrRequests } from "@/lib/api/hr-requests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RolesTable } from "./components/roles-table";
import { CreateRoleDialog } from "./components/create-role-dialog";
import { Briefcase, Users, UserCheck, Clock } from "lucide-react";
import { RecruitmentHubTour, RecruitmentHubTourButton } from "./components/recruitment-hub-tour";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  let roles: any[] = [];
  let hrRequests: any[] = [];

  try {
    const rolesData = await getRecruitmentRoles();
    roles = rolesData || [];
  } catch (error) {
    console.error("[Recruitment Page] Failed to fetch recruitment roles:", error);
  }

  try {
    const reqResponse = await getAllHrRequests();
    hrRequests = reqResponse.data?.data || reqResponse.data || [];
  } catch (error) {
    console.error("[Recruitment Page] Failed to fetch hr requests:", error);
  }

  const activeRolesCount = roles.filter((r) => r.status === "active").length;
  const totalCandidates = roles.reduce((sum, r) => sum + (r.total_candidates || 0), 0);
  const totalInterviewing = roles.reduce((sum, r) => sum + (r.interviewing_count || 0), 0);
  const totalAccepted = roles.reduce((sum, r) => sum + (r.accepted_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div id="tour-recruitment-header" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment & Hiring</h1>
          <p className="text-muted-foreground mt-1">
            Manage candidate pipelines, analyze CVs with AI against custom criteria, and bridge hired candidates into onboarding.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <RecruitmentHubTourButton />
          <div id="tour-create-role">
            <CreateRoleDialog hrRequests={hrRequests} />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div id="tour-recruitment-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Roles
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRolesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {roles.length} total roles created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all open campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interviewing
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterviewing}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active interview stages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hired & Onboarding
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccepted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Accepted and onboarded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles List */}
      <Card id="tour-roles-table">
        <CardHeader>
          <CardTitle>Recruitment Campaigns</CardTitle>
          <CardDescription>
            Select any role to manage candidates, upload resumes, review AI scores, and move applicants through your pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable roles={roles} />
        </CardContent>
      </Card>

      <RecruitmentHubTour />
    </div>
  );
}

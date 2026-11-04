import { getRecruitmentRoles } from "@/lib/api/recruitment";
import { getAllHrRequests } from "@/lib/api/hr-requests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RolesTable } from "./components/roles-table";
import { CreateRoleDialog } from "./components/create-role-dialog";
import { StandaloneRubricDialog } from "./components/standalone-rubric-dialog";
import { StandaloneRecruitmentEmailDialog } from "./components/standalone-recruitment-email-dialog";
import { getStandaloneEmailComposer } from "@/lib/api/standalone-recruitment-email";
import { Briefcase, Users, UserCheck, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const canEdit=userHasAnyRole(await getCurrentUser(),["hr","super"]);
  let roles: any[] = [];
  let hrRequests: any[] = [];

  const [rolesResult, requestsResult, composerResult] = await Promise.allSettled([
    getRecruitmentRoles(), getAllHrRequests(), canEdit ? getStandaloneEmailComposer() : Promise.resolve(null),
  ]);
  if (rolesResult.status === "fulfilled") roles = rolesResult.value || [];
  else console.error("[Recruitment Page] Failed to fetch recruitment roles:", rolesResult.reason);
  if (requestsResult.status === "fulfilled") {
    const reqResponse = requestsResult.value;
    hrRequests = reqResponse.data?.data || reqResponse.data || [];
  } else console.error("[Recruitment Page] Failed to fetch hr requests:", requestsResult.reason);
  const emailComposer = composerResult.status === "fulfilled" ? composerResult.value : null;

  const activeRolesCount = roles.filter((r) => r.status === "active").length;
  const totalCandidates = roles.reduce((sum, r) => sum + (r.total_candidates || 0), 0);
  const totalInterviewing = roles.reduce((sum, r) => sum + (r.pipeline_config ? r.pipeline_interview_count || 0 : r.interviewing_count || 0), 0);
  const totalAccepted = roles.reduce((sum, r) => sum + (r.accepted_count || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div id="tour-recruitment-header" className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Recruitment & Hiring</h1>
          <p className="text-muted-foreground mt-1">
            Screen CVs, check compatibility, assess applicants and prepare finalists for management review.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center xl:shrink-0 xl:flex-nowrap">
          <div id="tour-create-rubric" className="w-full sm:w-auto">
            <StandaloneRubricDialog className="h-10 w-full sm:w-auto" />
          </div>
          {canEdit && <StandaloneRecruitmentEmailDialog initialData={emailComposer} className="h-10 w-full sm:w-auto" />}
          {canEdit && <div id="tour-create-role" className="w-full sm:w-auto">
            <CreateRoleDialog hrRequests={hrRequests} triggerClassName="h-10 w-full sm:w-auto" />
          </div>}
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
          <RolesTable roles={roles} canEdit={canEdit}/>
        </CardContent>
      </Card>

    </div>
  );
}

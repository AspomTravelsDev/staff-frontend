import { notFound } from "next/navigation";
import { getRecruitmentRole } from "@/lib/api/recruitment";
import { RoleHeader } from "./components/role-header";
import { CandidatesTable } from "./components/candidates-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecruitmentRoleTour } from "./components/recruitment-role-tour";

export const dynamic = "force-dynamic";

interface RecruitmentRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecruitmentRolePage({ params }: RecruitmentRolePageProps) {
  const { id } = await params;

  let roleData: any = null;
  try {
    roleData = await getRecruitmentRole(id);
  } catch (error) {
    console.error("[Recruitment Role Page] Failed to fetch role:", error);
    notFound();
  }

  if (!roleData?.role) {
    notFound();
  }

  const { role, candidates, stats } = roleData;

  return (
    <div className="space-y-8">
      {/* Role Header Banner */}
      <RoleHeader role={role} stats={stats} />

      {/* Candidates Pipeline Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Candidates & AI Rankings</CardTitle>
              <CardDescription>
                Applicants ranked automatically by Gemini AI against role criteria and custom instructions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CandidatesTable
            candidates={candidates || []}
            roleId={role.id}
            roleTitle={role.title}
            stats={stats || { total: 0, reviewing: 0, shortlisted: 0, interviewing: 0, offered: 0, accepted: 0, rejected: 0 }}
          />
        </CardContent>
      </Card>

      <RecruitmentRoleTour />
    </div>
  );
}

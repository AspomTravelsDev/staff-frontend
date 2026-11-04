import { notFound } from "next/navigation";
import { getRecruitmentRole } from "@/lib/api/recruitment";
import type { RoleDetailResponse } from "@/lib/types/recruitment";
import { recruitmentPipelinePrefills } from "@/lib/recruitment/pipeline-prefills";
import { RoleHeader } from "./components/role-header";
import { CandidatesTable } from "./components/candidates-table";
import { RecruitmentPipelineBoard } from "./components/recruitment-pipeline-board";
import { ManagementShortlist } from "./components/management-shortlist";
import { getManagementShortlist } from "@/lib/api/recruitment-pipeline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RecruitmentRoleTour } from "./components/recruitment-role-tour";

export const dynamic = "force-dynamic";

interface RecruitmentRolePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    applicant?: string;
    settings?: string;
    review?: string;
    panel?: string;
  }>;
}

export default async function RecruitmentRolePage({
  params,
  searchParams,
}: RecruitmentRolePageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};

  let roleData: RoleDetailResponse | null = null;
  try {
    roleData = await getRecruitmentRole(id);
  } catch (error) {
    console.error("[Recruitment Role Page] Failed to fetch role:", error);
    notFound();
  }

  if (!roleData?.role) {
    notFound();
  }

  const { role, candidates, stats: rawStats } = roleData;
  if (
    role.pipeline_config &&
    (query.review === "1" || roleData.management_only)
  ) {
    const shortlist = await getManagementShortlist(id);
    return (
      <ManagementShortlist
        key={query.applicant ?? "shortlist"}
        initial={shortlist}
        initialApplicantId={query.applicant}
        managementOnly={roleData.management_only}
      />
    );
  }
  // Legacy non-pipeline pages expect reviewing/shortlisted/etc. Provide defaults.
  const stats = {
    total: rawStats?.total ?? 0,
    reviewing: rawStats?.reviewing ?? 0,
    shortlisted: rawStats?.shortlisted ?? 0,
    interviewing: rawStats?.interviewing ?? 0,
    offered: rawStats?.offered ?? 0,
    accepted: rawStats?.accepted ?? 0,
    rejected: rawStats?.rejected ?? 0,
    // Pipeline board extras
    active: rawStats?.active,
    on_hold: rawStats?.on_hold,
    ready_for_review: rawStats?.ready_for_review,
    avg_score: rawStats?.avg_score,
  };
  if (role.pipeline_config || (query.settings === "1" && !candidates.length))
    return (
      <RecruitmentPipelineBoard
        key={`${query.applicant ?? "board"}:${query.panel ?? ""}`}
        role={role}
        candidates={candidates}
        initialContexts={recruitmentPipelinePrefills(roleData)}
        initialFinalReviews={Object.fromEntries(Object.entries(roleData.pipeline_prefills ?? {}).map(([candidateId, prefill]) => [candidateId, prefill.final_review]))}
        initialApplicantId={query.applicant}
        initialStatusOpen={query.panel === "status"}
        initialSettingsOpen={query.settings === "1"}
        stats={rawStats}
      />
    );

  return (
    <div className="space-y-5">
      {/* Role Header Banner */}
      <RoleHeader role={role} stats={stats} />
      {/* Candidates Pipeline Section */}
      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                Applicants{" "}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                  {candidates?.length ?? 0}
                </span>
              </CardTitle>
              <CardDescription>
                Review CV screening, conduct interviews and manage each
                applicant&apos;s next step.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CandidatesTable
            candidates={candidates || []}
            roleId={role.id}
            roleTitle={role.title}
            assessmentEnabled={Boolean(role.assessment_plan_summary)}
            stats={stats}
          />
        </CardContent>
      </Card>

      <RecruitmentRoleTour />
    </div>
  );
}

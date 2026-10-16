"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Loader2,
  MoreHorizontal,
  RotateCw,
  Sparkles,
  Users,
  Activity,
  PauseCircle,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/components/stats-card";
import { reanalyzeCandidate } from "@/lib/api/recruitment";
import { decideRecruitmentStage } from "@/lib/api/recruitment-pipeline";
import { cvEvaluationScore } from "@/lib/recruitment/cv-evaluation";
import { UploadCvDialog } from "./upload-cv-dialog";
import { CvAnalysisSheet } from "./cv-analysis-sheet";
import { ApplicantAdvanceDialog } from "./applicant-advance-dialog";
import { ApplicantStageWorkspace } from "./applicant-stage-workspace";
import { ApplicantStatusDialog } from "./applicant-status-dialog";
import { VacancySettingsDialog } from "./vacancy-settings-dialog";
import { ManagementReviewSheet } from "./management-review-sheet";
import { PrepareOfferDialog } from "./prepare-offer-dialog";
import {
  pipelineLabels,
  pipelineStages,
  type PipelineStage,
  type PipelineContext,
} from "@/lib/types/recruitment-pipeline";
import type {
  RecruitmentRole,
  RecruitmentCandidate,
} from "@/lib/types/recruitment";

function isOfferStage(candidate?: RecruitmentCandidate) {
  return (
    candidate?.pipeline_stage === "offer_preparation" ||
    (candidate?.pipeline_stage === "management_review" &&
      candidate.pipeline_summary?.state === "completed" &&
      candidate.management_review_summary?.decision === "approve")
  );
}

export function RecruitmentPipelineBoard({
  role,
  candidates,
  initialApplicantId,
  initialSettingsOpen = false,
  initialStatusOpen = false,
  stats: serverStats,
}: {
  role: RecruitmentRole;
  candidates: RecruitmentCandidate[];
  initialApplicantId?: string;
  initialSettingsOpen?: boolean;
  initialStatusOpen?: boolean;
  stats?: {
    total: number;
    active?: number;
    on_hold?: number;
    rejected?: number;
    ready_for_review?: number;
    avg_score?: number | null;
  };
}) {
  const router = useRouter();
  const [stage, setStage] = useState<PipelineStage | "all">("all"),
    [search, setSearch] = useState(""),
    [outcome, setOutcome] = useState("all");
  const [analysisId, setAnalysisId] = useState<string | null>(
      !initialStatusOpen &&
        candidates.find((c) => c.id === initialApplicantId)?.pipeline_stage ===
          "cv_screening"
        ? initialApplicantId!
        : null,
    ),
    [advanceId, setAdvanceId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    !initialStatusOpen &&
      initialApplicantId &&
      candidates.find((c) => c.id === initialApplicantId)?.pipeline_stage !==
        "cv_screening" &&
      !isOfferStage(candidates.find((c) => c.id === initialApplicantId))
      ? initialApplicantId
      : null,
  );
  const [statusId, setStatusId] = useState<string | null>(
      initialStatusOpen ? (initialApplicantId ?? null) : null,
    ),
    [settingsOpen, setSettingsOpen] = useState(initialSettingsOpen);
  // Reopen-previous-stage state
  const [reopenId, setReopenId] = useState<string | null>(null),
    [reopenReason, setReopenReason] = useState(""),
    [reopenBusy, setReopenBusy] = useState(false),
    [reopenError, setReopenError] = useState("");
  const [workspaceView, setWorkspaceView] = useState<PipelineStage | undefined>(
    undefined,
  );
  const [managementId, setManagementId] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(
    !initialStatusOpen &&
      initialApplicantId &&
      isOfferStage(candidates.find((c) => c.id === initialApplicantId))
      ? initialApplicantId
      : null,
  );
  function closeDeepLink(id: string | null | undefined) {
    if (id && id === initialApplicantId)
      router.replace(`/hr/recruitment/${role.id}`);
  }
  function openStage(id: string, view?: PipelineStage) {
    const applicant = applicants.find((c) => c.id === id);
    if (
      !view &&
      applicant?.pipeline_outcome === "active" &&
      isOfferStage(applicant)
    ) {
      setOfferId(id);
      return;
    }
    if (
      !view &&
      applicant?.pipeline_stage === "management_review" &&
      applicant.management_review_summary &&
      applicant.pipeline_summary?.state === "completed"
    ) {
      setManagementId(id);
      return;
    }
    setWorkspaceView(view);
    setWorkspaceId(id);
  }
  const [updates, setUpdates] = useState<
    Record<
      string,
      { source: RecruitmentCandidate; candidate: RecruitmentCandidate }
    >
  >({});
  const [retrying, setRetrying] = useState<string[]>([]);
  const inFlight = useRef(new Set<string>());
  // Fresh server records supersede optimistic analysis and stage updates.
  const applicants = candidates.map((c) =>
    updates[c.id]?.source === c ? { ...c, ...updates[c.id].candidate } : c,
  );
  const pending = applicants.some((c) =>
    ["pending", "processing"].includes(c.ai_evaluation?.status ?? ""),
  );
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [pending, router]);
  const statusLabel = (c: RecruitmentCandidate) =>
    c.pipeline_outcome === "hold"
      ? "On hold"
      : c.pipeline_outcome && c.pipeline_outcome !== "active"
        ? c.pipeline_outcome.charAt(0).toUpperCase() +
          c.pipeline_outcome.slice(1)
        : c.status === "accepted"
          ? "Hired"
          : c.status === "offered"
            ? "Offer sent"
            : c.pipeline_stage === "offer_preparation"
              ? "Awaiting HR offer"
              : c.pipeline_summary?.state === "completed"
                ? c.pipeline_stage === "management_review"
                  ? c.management_review_summary?.decision === "approve"
                    ? "Approved for offer preparation"
                    : "Submitted for review"
                  : c.pipeline_summary?.passed === false
                    ? "Review needed"
                    : "Ready to advance"
                : c.pipeline_summary?.started
                  ? "In progress"
                  : "Not started";
  const visible = applicants.filter(
    (c) =>
      (stage === "all" || c.pipeline_stage === stage) &&
      (outcome === "all" || c.pipeline_outcome === outcome) &&
      `${c.name} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const stageOrderRank: Record<string, number> = {
    offer_preparation: 6,
    management_review: 5,
    practical: 4,
    written_exam: 3,
    oral_interview: 2,
    call_screening: 1,
    cv_screening: 0,
  };

  const getCandidateScore = (c: RecruitmentCandidate): number => {
    if (c.pipeline_summary?.score_100 != null)
      return c.pipeline_summary.score_100;
    const stageScores = c.pipeline_summary?.stage_scores;
    if (stageScores?.practical != null) return stageScores.practical;
    if (stageScores?.written_exam != null) return stageScores.written_exam;
    if (stageScores?.oral_interview != null) return stageScores.oral_interview;
    if (c.pipeline_summary?.stage_score != null)
      return c.pipeline_summary.stage_score;
    const cvScore = cvEvaluationScore(c);
    if (cvScore != null) return cvScore;
    return -1;
  };

  const sorted = [...visible].sort((a, b) => {
    // 1. Outcome ranking: active > hold > other
    const outcomeOrder = (c: RecruitmentCandidate) =>
      c.pipeline_outcome === "active"
        ? 2
        : c.pipeline_outcome === "hold"
          ? 1
          : 0;
    const outcomeDiff = outcomeOrder(b) - outcomeOrder(a);
    if (outcomeDiff !== 0) return outcomeDiff;

    // 2. Progression: closer to the finish at the top
    const stageA = a.pipeline_stage ?? "cv_screening";
    const stageB = b.pipeline_stage ?? "cv_screening";
    const rankA =
      (stageOrderRank[stageA] ?? 0) +
      (a.pipeline_summary?.state === "completed" ? 0.5 : 0);
    const rankB =
      (stageOrderRank[stageB] ?? 0) +
      (b.pipeline_summary?.state === "completed" ? 0.5 : 0);
    const stageDiff = rankB - rankA;
    if (stageDiff !== 0) return stageDiff;

    // 3. Score ranking: higher score first
    const scoreDiff = getCandidateScore(b) - getCandidateScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    // 4. Stable tie-breaker: newest creation first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const analysisCandidate = applicants.find((c) => c.id === analysisId),
    advanceCandidate = applicants.find((c) => c.id === advanceId),
    workspaceCandidate = applicants.find((c) => c.id === workspaceId),
    statusCandidate = applicants.find((c) => c.id === statusId);
  const money = (value: number | null | undefined) =>
    value == null ? "—" : new Intl.NumberFormat("en-NG").format(value);
  const relativeDate = (value: string) => {
    const days = Math.floor(
      (Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000),
    );
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };
  async function retryAnalysis(candidate: RecruitmentCandidate) {
    if (
      inFlight.current.has(candidate.id) ||
      ["pending", "processing"].includes(candidate.ai_evaluation?.status ?? "")
    )
      return;
    inFlight.current.add(candidate.id);
    setRetrying((ids) => [...ids, candidate.id]);
    try {
      const result = await reanalyzeCandidate(candidate.id, role.id);
      if (!result.success || !result.data) {
        toast.error(
          result.error || "AI analysis could not be queued. Please retry.",
        );
        return;
      }
      const source = candidates.find((c) => c.id === candidate.id)!;
      setUpdates((values) => ({
        ...values,
        [candidate.id]: { source, candidate: result.data! },
      }));
      if (result.data.ai_evaluation?.status === "failed")
        toast.error("AI analysis could not be queued. Please retry.");
      else toast.success("AI analysis queued. You can continue working.");
      router.refresh();
    } catch {
      toast.error("AI analysis could not be queued. Please retry.");
    } finally {
      inFlight.current.delete(candidate.id);
      setRetrying((ids) => ids.filter((id) => id !== candidate.id));
    }
  }
  function updateApplicant(context: PipelineContext) {
    const source = candidates.find((c) => c.id === context.candidate.id)!;
    const record = context.records.find(
      (r) => r.stage === context.candidate.pipeline_stage,
    );
    const stageScores = Object.fromEntries(
      ["oral_interview", "written_exam", "practical"].map((s) => {
        const r = context.records.find((rec) => rec.stage === s);
        return [
          s,
          r?.state === "completed" ? (r.results?.score_100 ?? null) : null,
        ];
      }),
    );
    setUpdates((values) => ({
      ...values,
      [context.candidate.id]: {
        source,
        candidate: {
          ...context.candidate,
          pipeline_summary: {
            score_100: context.final_score,
            stage_score: record?.results?.score_100 ?? null,
            stage_scores: stageScores,
            status: record?.payload.custom_status ?? null,
            state: record?.state ?? "draft",
            passed: record?.results?.passed ?? null,
          },
        },
      },
    }));
  }
  function moved(context: PipelineContext) {
    updateApplicant(context);
    setAdvanceId(null);
    openStage(context.candidate.id);
    toast.success(
      `${context.candidate.name} moved to ${pipelineLabels[context.candidate.pipeline_stage!].toLowerCase()}.`,
    );
    router.refresh();
  }
  // Live stats — derived from the (optimistically updated) applicants list
  const liveStats = {
    total: applicants.length,
    active: applicants.filter((c) => c.pipeline_outcome === "active").length,
    on_hold: applicants.filter((c) => c.pipeline_outcome === "hold").length,
    rejected: applicants.filter((c) =>
      ["rejected", "withdrawn"].includes(c.pipeline_outcome ?? ""),
    ).length,
    ready_for_review: applicants.filter(
      (c) => c.pipeline_stage === "management_review",
    ).length,
    avg_score: serverStats?.avg_score ?? null,
  };

  async function reopenPreviousStage(candidate: RecruitmentCandidate) {
    if (reopenBusy || reopenReason.trim().length < 3) return;
    setReopenBusy(true);
    setReopenError("");
    try {
      const result = await decideRecruitmentStage(candidate.id, role.id, {
        revision: candidate.pipeline_revision!,
        stage: candidate.pipeline_stage!,
        action: "back",
        reason: reopenReason.trim(),
      });
      if (result.success) {
        updateApplicant(result.data);
        setReopenId(null);
        setReopenReason("");
        toast.success(
          `Returned ${candidate.name} to the previous stage. Corrections can now be made.`,
        );
        router.refresh();
      } else {
        setReopenError(result.error || "Could not reopen. Please retry.");
      }
    } catch {
      setReopenError("Could not reopen the stage. Please retry.");
    } finally {
      setReopenBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        asChild
        variant="link"
        className="h-auto p-0 text-muted-foreground"
      >
        <Link href="/hr/recruitment">Back to recruitment</Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-xl font-semibold">{role.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {role.department} · {role.openings_count} openings ·{" "}
            {candidates.length} applicants
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Monthly budget: NGN {money(role.salary_budget_min)}–
            {money(role.salary_budget_max)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/hr/recruitment/${role.id}?review=1`}>
              Management shortlist
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Vacancy settings
          </Button>
          <UploadCvDialog
            roleId={role.id}
            roleTitle={role.title}
            disabled={role.status === "closed"}
          />
        </div>
      </header>

      {/* Pipeline stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Total Applicants"
          icon={Users}
          value={liveStats.total}
          description={`${role.openings_count} opening${role.openings_count !== 1 ? "s" : ""}`}
          iconClassName="text-blue-500"
        />
        <StatsCard
          title="Active"
          icon={Activity}
          value={liveStats.active}
          description="In the pipeline"
          iconClassName="text-emerald-500"
        />
        <StatsCard
          title="On Hold"
          icon={PauseCircle}
          value={liveStats.on_hold}
          description="Awaiting decision"
          iconClassName="text-amber-500"
        />
        <StatsCard
          title="Rejected / Withdrawn"
          icon={XCircle}
          value={liveStats.rejected}
          description="Removed from pipeline"
          iconClassName="text-destructive"
        />
        <StatsCard
          title="Ready for Review"
          icon={Trophy}
          value={liveStats.ready_for_review}
          description={
            liveStats.avg_score != null
              ? `Avg score: ${liveStats.avg_score.toFixed(1)}%`
              : "Cleared all stages"
          }
          iconClassName="text-purple-500"
        />
      </div>
      <section className="space-y-3" aria-label="Applicants">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Applicants{" "}
            <span className="font-normal text-muted-foreground">
              ({visible.length})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Search applicants"
              placeholder="Search name or email"
              className="w-52 max-w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={stage}
              onValueChange={(value) =>
                setStage(value as PipelineStage | "all")
              }
            >
              <SelectTrigger aria-label="Filter by stage" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {pipelineStages.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "management_review"
                      ? "Management review"
                      : pipelineLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger aria-label="Filter by status" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["all", "active", "hold", "rejected", "withdrawn"].map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {value === "all"
                        ? "All statuses"
                        : value === "hold"
                          ? "On hold"
                          : value.charAt(0).toUpperCase() + value.slice(1)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {(stage !== "all" || outcome !== "all" || search) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStage("all");
                  setOutcome("all");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
        <div className="rounded-md border">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[170px]">Applicant</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CV fit</TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Oral (35%)
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Written (25%)
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Practical (40%)
                </TableHead>
                <TableHead className="text-center font-semibold">
                  Total
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const analysing = ["pending", "processing"].includes(
                  c.ai_evaluation?.status ?? "",
                );
                const isRetrying = retrying.includes(c.id),
                  score = cvEvaluationScore(c),
                  failed = c.ai_evaluation?.status === "failed",
                  current = c.pipeline_stage!;
                const next =
                  pipelineStages[pipelineStages.indexOf(current) + 1];
                const status = statusLabel(c);
                const stageCompleted =
                  c.pipeline_summary?.state === "completed";
                const needsException =
                  stageCompleted && c.pipeline_summary?.passed === false;
                const canStartNext =
                  c.pipeline_outcome === "active" &&
                  current !== "management_review" &&
                  current !== "offer_preparation" &&
                  !!next &&
                  (current === "cv_screening" || stageCompleted);
                const taskLabel =
                  c.pipeline_outcome === "hold"
                    ? "Resume applicant"
                    : c.pipeline_outcome === "rejected" ||
                        c.pipeline_outcome === "withdrawn"
                      ? "Reopen applicant"
                      : c.status === "accepted"
                        ? "View onboarding"
                        : c.status === "offered"
                          ? "View offer"
                          : isOfferStage(c)
                            ? c.onboarding_application_id
                              ? "Continue offer"
                              : "Prepare offer"
                            : current === "cv_screening" && score === null
                              ? "Review CV manually"
                              : current === "management_review"
                                ? stageCompleted
                                  ? "Review candidate"
                                  : "Prepare review brief"
                                : needsException
                                  ? "Review exception"
                                  : canStartNext
                                    ? `Move to ${next === "management_review" ? "management review" : pipelineLabels[next].toLowerCase()}`
                                    : `${c.pipeline_summary?.started || c.pipeline_summary?.status != null ? "Continue" : "Start"} ${pipelineLabels[current].toLowerCase()}`;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          className="h-auto justify-start p-0 text-foreground"
                          aria-label={`View CV analysis for ${c.name}`}
                          onClick={() => setAnalysisId(c.id)}
                        >
                          {c.name}
                        </Button>
                        {Date.now() - new Date(c.created_at).getTime() <
                          24 * 60 * 60 * 1000 && (
                          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-muted-foreground">
                        {c.email || "No email recorded"}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="size-3" />
                        Uploaded {relativeDate(c.created_at)}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        {current === "management_review"
                          ? "Management review"
                          : pipelineLabels[current]}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {stageCompleted
                            ? c.pipeline_summary?.passed === false
                              ? "Below standard"
                              : "Completed"
                            : c.pipeline_summary?.started
                              ? "In progress"
                              : "Not started"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={needsException ? "destructive" : "outline"}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="status"
                      >
                        {analysing || isRetrying ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Analysis pending
                          </>
                        ) : failed ? (
                          <>
                            <span className="text-destructive">
                              Analysis failed
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Retry AI analysis for ${c.name}`}
                              onClick={() => void retryAnalysis(c)}
                            >
                              <RotateCw />
                              Retry
                            </Button>
                          </>
                        ) : score === null ? (
                          <span className="text-muted-foreground">
                            Not scored
                          </span>
                        ) : (
                          <div>
                            <Button
                              variant="link"
                              className={`h-auto p-0 tabular-nums ${score < 50 ? "text-destructive" : "text-foreground"}`}
                              aria-label={`View ${c.name}'s CV score: ${score}%`}
                              onClick={() => setAnalysisId(c.id)}
                            >
                              {score}% match
                            </Button>
                            {c.ai_evaluation?.recommendation && (
                              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Sparkles className="size-3" />
                                {c.ai_evaluation.recommendation}
                              </p>
                            )}
                            {!!c.ai_evaluation?.years_of_experience && (
                              <p className="text-[11px] text-muted-foreground">
                                {c.ai_evaluation.years_of_experience} yrs
                                {c.ai_evaluation.skills?.length
                                  ? ` · ${c.ai_evaluation.skills.slice(0, 2).join(" · ")}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* Oral Interview (35%) */}
                    <TableCell className="text-center tabular-nums">
                      {(() => {
                        const v =
                          c.pipeline_summary?.stage_scores?.oral_interview ??
                          null;
                        const threshold =
                          role.pipeline_config?.thresholds?.oral_interview ??
                          60;
                        if (v === null)
                          return (
                            <span className="text-muted-foreground">—</span>
                          );
                        return (
                          <span
                            className={
                              v >= threshold
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }
                          >
                            {v.toFixed(1)}%
                          </span>
                        );
                      })()}
                    </TableCell>
                    {/* Written Exam (25%) */}
                    <TableCell className="text-center tabular-nums">
                      {(() => {
                        const v =
                          c.pipeline_summary?.stage_scores?.written_exam ??
                          null;
                        const threshold =
                          role.pipeline_config?.thresholds?.written_exam ?? 60;
                        if (v === null)
                          return (
                            <span className="text-muted-foreground">—</span>
                          );
                        return (
                          <span
                            className={
                              v >= threshold
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }
                          >
                            {v.toFixed(1)}%
                          </span>
                        );
                      })()}
                    </TableCell>
                    {/* Practical (40%) */}
                    <TableCell className="text-center tabular-nums">
                      {(() => {
                        const v =
                          c.pipeline_summary?.stage_scores?.practical ?? null;
                        const threshold =
                          role.pipeline_config?.thresholds?.practical ?? 70;
                        if (v === null)
                          return (
                            <span className="text-muted-foreground">—</span>
                          );
                        return (
                          <span
                            className={
                              v >= threshold
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }
                          >
                            {v.toFixed(1)}%
                          </span>
                        );
                      })()}
                    </TableCell>
                    {/* Weighted Total */}
                    <TableCell className="text-center">
                      {c.pipeline_summary?.score_100 != null ? (
                        <Badge
                          variant="outline"
                          className="tabular-nums font-semibold"
                        >
                          {c.pipeline_summary.score_100.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          aria-label={`${taskLabel} for ${c.name}`}
                          onClick={() => {
                            if (c.pipeline_outcome !== "active")
                              setStatusId(c.id);
                            else if (canStartNext) setAdvanceId(c.id);
                            else openStage(c.id);
                          }}
                        >
                          {canStartNext &&
                            !needsException &&
                            !analysing &&
                            !failed && <ArrowRight />}
                          {taskLabel}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAnalysisId(c.id)}
                          aria-label={`View candidate details for ${c.name}`}
                        >
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${c.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => setAnalysisId(c.id)}
                            >
                              View CV analysis
                            </DropdownMenuItem>
                            {current !== "cv_screening" && (
                              <DropdownMenuItem
                                onSelect={() => openStage(c.id)}
                              >
                                {current === "management_review"
                                  ? "Review finalist"
                                  : `${c.pipeline_summary?.state === "completed" ? "View" : "Continue"} ${pipelineLabels[current].toLowerCase()}`}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onSelect={() => setStatusId(c.id)}
                            >
                              Status &amp; history
                            </DropdownMenuItem>
                            {/* Reopen previous stage — visible when the candidate
                                is active and is past CV screening (there's a
                                previous stage to return to). */}
                            {c.pipeline_outcome === "active" &&
                              current !== "cv_screening" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-amber-600 focus:text-amber-600"
                                    onSelect={() => {
                                      setReopenId(c.id);
                                      setReopenReason("");
                                      setReopenError("");
                                    }}
                                  >
                                    <RotateCcw />
                                    Reopen previous stage
                                  </DropdownMenuItem>
                                </>
                              )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={analysing || isRetrying}
                              onSelect={() => void retryAnalysis(c)}
                            >
                              <RotateCw />
                              {analysing || isRetrying
                                ? "AI analysis pending"
                                : failed
                                  ? "Retry AI analysis"
                                  : "Reanalyse CV"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/recruitment/candidates/${c.id}/cv`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download original CV
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!sorted.length && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {candidates.length
                      ? "No applicants match these filters."
                      : "Upload the first CV to begin screening."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      {analysisCandidate && (
        <CvAnalysisSheet
          key={analysisCandidate.id}
          candidate={analysisCandidate}
          onManage={() => {
            setAnalysisId(null);
            setStatusId(analysisCandidate.id);
          }}
          onClose={() => {
            closeDeepLink(analysisId);
            setAnalysisId(null);
          }}
          onRetry={retryAnalysis}
          retrying={retrying.includes(analysisCandidate.id)}
        />
      )}
      {advanceCandidate && (
        <ApplicantAdvanceDialog
          key={advanceCandidate.id}
          candidate={advanceCandidate}
          roleId={role.id}
          onClose={() => setAdvanceId(null)}
          onMoved={moved}
          onContinue={() => {
            setAdvanceId(null);
            openStage(advanceCandidate.id);
          }}
        />
      )}
      {workspaceCandidate && (
        <ApplicantStageWorkspace
          key={workspaceCandidate.id}
          candidate={workspaceCandidate}
          roleId={role.id}
          viewStage={workspaceView}
          onClose={() => {
            closeDeepLink(workspaceId);
            setWorkspaceId(null);
          }}
          onUpdate={updateApplicant}
          onComplete={(context) => {
            updateApplicant(context);
            setWorkspaceId(null);
            const currentStage = workspaceCandidate.pipeline_stage;
            const newStage = context.candidate.pipeline_stage;
            toast.success(
              newStage === currentStage
                ? `${pipelineLabels[currentStage!] ?? "Stage"} completed.`
                : newStage === "management_review"
                  ? "Applicant ready for management review."
                  : `Applicant moved to ${pipelineLabels[newStage!].toLowerCase()}.`,
            );
            router.refresh();
          }}
          onCv={(candidate) => {
            setWorkspaceId(null);
            setAnalysisId(candidate.id);
          }}
        />
      )}
      {managementId && (
        <ManagementReviewSheet
          candidateId={managementId}
          roleId={role.id}
          onClose={() => {
            closeDeepLink(managementId);
            setManagementId(null);
          }}
          onSaved={() => router.refresh()}
        />
      )}
      {offerId && applicants.find((c) => c.id === offerId) && (
        <PrepareOfferDialog
          key={offerId}
          candidate={applicants.find((c) => c.id === offerId)!}
          role={role}
          onClose={() => {
            closeDeepLink(offerId);
            setOfferId(null);
            router.refresh();
          }}
        />
      )}
      {statusCandidate && (
        <ApplicantStatusDialog
          key={statusCandidate.id}
          candidate={statusCandidate}
          roleId={role.id}
          onClose={() => {
            closeDeepLink(statusId);
            setStatusId(null);
          }}
          onSaved={(context) => {
            updateApplicant(context);
            setStatusId(null);
            toast.success("Applicant status updated.");
            router.refresh();
          }}
          onViewStage={(stage) => {
            setStatusId(null);
            openStage(statusCandidate.id, stage);
          }}
        />
      )}
      {settingsOpen && (
        <VacancySettingsDialog
          role={role}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setSettingsOpen(false);
            toast.success("Vacancy settings saved.");
            router.refresh();
          }}
        />
      )}

      {/* Reopen previous stage dialog */}
      {reopenId &&
        (() => {
          const candidate = applicants.find((c) => c.id === reopenId);
          if (!candidate) return null;
          const prevStage =
            candidate.pipeline_stage === "management_review"
              ? "practical"
              : pipelineStages[
                  pipelineStages.indexOf(
                    candidate.pipeline_stage as PipelineStage,
                  ) - 1
                ];
          return (
            <Dialog
              open
              onOpenChange={(open) => {
                if (!open && !reopenBusy) {
                  setReopenId(null);
                  setReopenReason("");
                  setReopenError("");
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <RotateCcw className="size-4 text-amber-500" />
                    Reopen previous stage
                  </DialogTitle>
                  <DialogDescription>
                    This will return{" "}
                    <span className="font-medium">{candidate.name}</span> from{" "}
                    <span className="font-medium">
                      {pipelineLabels[candidate.pipeline_stage!] ??
                        candidate.pipeline_stage}
                    </span>{" "}
                    back to{" "}
                    <span className="font-medium">
                      {prevStage
                        ? pipelineLabels[prevStage]
                        : "the previous stage"}
                    </span>
                    . The stage record will be reset to draft so corrections can
                    be made. This action is recorded in the audit trail.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void reopenPreviousStage(candidate);
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="reopen-reason">Reason for reopening</Label>
                    <Textarea
                      id="reopen-reason"
                      placeholder="e.g. Scores for 3 applicants were not entered before submitting the oral interview…"
                      required
                      minLength={3}
                      maxLength={2000}
                      disabled={reopenBusy}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  {reopenError && (
                    <p className="text-xs text-destructive" role="alert">
                      {reopenError}
                    </p>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={reopenBusy}
                      onClick={() => {
                        setReopenId(null);
                        setReopenReason("");
                        setReopenError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={reopenBusy || reopenReason.trim().length < 3}
                    >
                      {reopenBusy ? "Saving…" : "Reopen stage"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          );
        })()}
    </div>
  );
}

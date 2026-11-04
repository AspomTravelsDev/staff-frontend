"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailsTableRow } from "@/components/ui/details-table-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Send,
  Eye,
  ExternalLink,
  ClipboardList,
  Download,
  MoreHorizontal,
  RotateCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type {
  RecruitmentCandidate,
  CandidateStatus,
} from "@/lib/types/recruitment";
import {
  updateCandidateStatus,
  reanalyzeCandidate,
} from "@/lib/api/recruitment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CandidateEvaluationSheet } from "./candidate-evaluation-sheet";
import { AcceptOnboardModal } from "./accept-onboard-modal";
import { InterviewRubricDialog } from "./interview-rubric-dialog";
import { DeleteCandidateDialog } from "./delete-candidate-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  cvEvaluationFailed,
  cvEvaluationScore,
} from "@/lib/recruitment/cv-evaluation";

interface CandidatesTableProps {
  candidates: RecruitmentCandidate[];
  roleId: string;
  roleTitle: string;
  assessmentEnabled: boolean;
  stats: {
    total: number;
    reviewing: number;
    shortlisted: number;
    interviewing: number;
    offered: number;
    accepted: number;
    rejected: number;
  };
}

export function CandidatesTable({
  candidates,
  roleId,
  roleTitle,
  assessmentEnabled,
  stats,
}: CandidatesTableProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("score_desc");

  const [selectedCandidate, setSelectedCandidate] =
    useState<RecruitmentCandidate | null>(null);
  const [evalSheetOpen, setEvalSheetOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [candidateToOnboard, setCandidateToOnboard] =
    useState<RecruitmentCandidate | null>(null);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [candidateForRubric, setCandidateForRubric] =
    useState<RecruitmentCandidate | null>(null);

  const handleOpenRubric = (candidate: RecruitmentCandidate) => {
    setCandidateForRubric(candidate);
    setRubricModalOpen(true);
  };

  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  async function retryEvaluation(candidate: RecruitmentCandidate) {
    if (reanalyzing) return;
    setReanalyzing(candidate.id);
    try {
      const result = await reanalyzeCandidate(candidate.id, roleId);
      if (!result.success || !result.data)
        toast.error(result.error || "Could not reanalyze CV.");
      else if (cvEvaluationFailed(result.data))
        toast.error("AI evaluation is still unavailable. Please retry later.");
      else toast.success("CV evaluation updated.");
      router.refresh();
    } catch {
      toast.error("Could not reanalyze CV. Please retry.");
    } finally {
      setReanalyzing(null);
    }
  }

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        if (activeTab !== "all" && c.status !== activeTab) {
          return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();

        const nameMatch = c.name?.toLowerCase().includes(q);
        const emailMatch = c.email?.toLowerCase().includes(q);
        const skillsMatch = (c.ai_evaluation?.skills || []).some((s) =>
          s.toLowerCase().includes(q),
        );
        const summaryMatch = c.ai_summary?.toLowerCase().includes(q);

        return nameMatch || emailMatch || skillsMatch || summaryMatch;
      })
      .sort((a, b) => {
        const assessmentA = a.assessment_summary?.score_100;
        const assessmentB = b.assessment_summary?.score_100;
        const effectiveA =
          a.post_interview_evaluation?.combined_score ??
          assessmentA ??
          cvEvaluationScore(a) ??
          -1;
        const effectiveB =
          b.post_interview_evaluation?.combined_score ??
          assessmentB ??
          cvEvaluationScore(b) ??
          -1;

        switch (sortBy) {
          case "score_desc":
            if (effectiveB !== effectiveA) return effectiveB - effectiveA;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "score_asc":
            if (effectiveA !== effectiveB) return effectiveA - effectiveB;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "post_desc": {
            const postA = a.post_interview_evaluation?.combined_score ?? -1;
            const postB = b.post_interview_evaluation?.combined_score ?? -1;
            if (postB !== postA) return postB - postA;
            return effectiveB - effectiveA;
          }
          case "assessment_desc":
            if ((assessmentB ?? -1) !== (assessmentA ?? -1)) {
              return (assessmentB ?? -1) - (assessmentA ?? -1);
            }
            return effectiveB - effectiveA;
          case "cv_desc": {
            const cvA = cvEvaluationScore(a) ?? -1;
            const cvB = cvEvaluationScore(b) ?? -1;
            if (cvB !== cvA) return cvB - cvA;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
          case "date_desc":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "");
          default:
            return effectiveB - effectiveA;
        }
      });
  }, [candidates, activeTab, searchQuery, sortBy]);

  const handleStatusUpdate = async (
    candidateId: string,
    newStatus: CandidateStatus,
  ) => {
    try {
      const res = await updateCandidateStatus(candidateId, roleId, newStatus);
      if (!res.success) {
        toast.error(res.error || "Failed to update status.");
        return;
      }
      toast.success(`Candidate status moved to ${newStatus}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status.",
      );
    }
  };

  const handleOpenEvaluation = (candidate: RecruitmentCandidate) => {
    setSelectedCandidate(candidate);
    setEvalSheetOpen(true);
  };

  const handleOpenOnboard = (candidate: RecruitmentCandidate) => {
    setCandidateToOnboard(candidate);
    setOnboardModalOpen(true);
  };

  const getScoreBadge = (score: number | null) => {
    if (score == null) {
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
          Pending
        </Badge>
      );
    }

    if (score >= 80) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold hover:bg-emerald-500/20">
          {score}% Match
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold hover:bg-amber-500/20">
          {score}% Match
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-bold hover:bg-rose-500/20">
        {score}% Match
      </Badge>
    );
  };

  const tabs = [
    { id: "all", label: "All Candidates", count: stats.total },
    { id: "reviewing", label: "Reviewing", count: stats.reviewing },
    { id: "shortlisted", label: "Shortlisted", count: stats.shortlisted },
    { id: "interviewing", label: "Interviewing", count: stats.interviewing },
    { id: "offered", label: "Offered", count: stats.offered },
    { id: "accepted", label: "Accepted / Hired", count: stats.accepted },
    { id: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="min-w-0 space-y-4">
      {/* Pipeline Stage Tabs */}
      <div
        id="tour-pipeline-stages"
        className="flex items-center gap-1.5 overflow-x-auto border-b pb-2 sm:flex-wrap"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Sort Toolbar */}
      <div
        id="tour-candidate-search"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, skills, summary..."
            aria-label="Search applicants"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Sort by:
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger
              aria-label="Sort applicants"
              className="h-10 w-[240px] max-w-full text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Best score first</SelectItem>
              <SelectItem value="post_desc">AI interview score</SelectItem>
              <SelectItem value="assessment_desc">
                Assessment score: highest first
              </SelectItem>
              <SelectItem value="cv_desc">CV score: highest first</SelectItem>
              <SelectItem value="score_asc">Lowest score first</SelectItem>
              <SelectItem value="date_desc">Newest applicants</SelectItem>
              <SelectItem value="name_asc">Name: A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ranked Candidate Table */}
      <div
        id="tour-candidate-table"
        className="rounded-md border bg-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">Rank</TableHead>
              <TableHead className="min-w-[220px]">Applicant</TableHead>
              <TableHead>CV Match</TableHead>
              <TableHead className="min-w-[150px]">Assessment</TableHead>
              <TableHead className="min-w-[140px]">Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      No candidates found in this view.
                    </p>
                    <p className="text-xs">
                      Upload a candidate CV to screen them with AI.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate, index) => {
                const score = cvEvaluationScore(candidate);

                return (
                  <DetailsTableRow
                    key={candidate.id}
                    detailLabel={`Open evaluation for ${candidate.name}`}
                    onOpenDetails={() => handleOpenEvaluation(candidate)}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="text-center text-xs font-medium">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-foreground">
                          #{index + 1}
                        </span>
                        {candidate.post_interview_evaluation && (
                          <span className="text-[9px] font-semibold text-primary uppercase tracking-tighter">
                            Debriefed
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Candidate Info */}
                    <TableCell>
                      <div className="max-w-xs space-y-1.5">
                        <button
                          onClick={() => handleOpenEvaluation(candidate)}
                          className="font-semibold text-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5"
                        >
                          {candidate.name}
                        </button>
                        <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                          {candidate.email && <span>{candidate.email}</span>}
                          {candidate.phone && <span>{candidate.phone}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {candidate.ai_evaluation?.years_of_experience !=
                            null && (
                            <span>
                              {candidate.ai_evaluation.years_of_experience} yrs
                              experience ·
                            </span>
                          )}
                          {(candidate.ai_evaluation?.skills || [])
                            .slice(0, 2)
                            .map((skill) => (
                              <span
                                key={skill}
                                className="rounded bg-muted px-1.5 py-0.5 text-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                          {(candidate.ai_evaluation?.skills || []).length >
                            2 && (
                            <span>
                              +
                              {(candidate.ai_evaluation?.skills || []).length -
                                2}{" "}
                              skills
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added{" "}
                          {format(
                            new Date(candidate.created_at),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </TableCell>

                    {/* Initial CV Score */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {cvEvaluationFailed(candidate) ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                              <AlertCircle className="size-4 shrink-0" />
                              Evaluation failed
                            </span>
                          ) : (
                            getScoreBadge(score)
                          )}
                        </div>
                        {cvEvaluationFailed(candidate) && (
                          <button
                            type="button"
                            disabled={reanalyzing !== null}
                            onClick={() => void retryEvaluation(candidate)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            {reanalyzing === candidate.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RotateCw className="size-4" />
                            )}
                            {reanalyzing === candidate.id
                              ? "Reanalyzing"
                              : "Reanalyze CV"}
                          </button>
                        )}
                        {!cvEvaluationFailed(candidate) &&
                          candidate.ai_evaluation?.recommendation && (
                            <div className="text-[11px] text-muted-foreground">
                              {candidate.ai_evaluation.recommendation}
                            </div>
                          )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {candidate.assessment_summary
                          ? candidate.assessment_summary.score_100 != null
                            ? `${candidate.assessment_summary.score_100.toFixed(1)}/100`
                            : "In progress"
                          : "Not started"}
                      </span>
                    </TableCell>

                    {/* Stage / Status Selector */}
                    <TableCell
                      id={
                        index === 0
                          ? "tour-candidate-stage-selector"
                          : undefined
                      }
                    >
                      <div className="space-y-1.5">
                        <Select
                          value={candidate.status}
                          onValueChange={(val: string) =>
                            handleStatusUpdate(
                              candidate.id,
                              val as CandidateStatus,
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs capitalize font-medium w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="shortlisted">
                              Shortlisted
                            </SelectItem>
                            <SelectItem value="interviewing">
                              Interviewing
                            </SelectItem>
                            {candidate.status === "offered" && (
                              <SelectItem
                                value="offered"
                                disabled
                                className="opacity-60 text-xs"
                              >
                                Offered (Offer Sent)
                              </SelectItem>
                            )}
                            {candidate.status === "accepted" && (
                              <SelectItem
                                value="accepted"
                                disabled
                                className="opacity-60 text-xs"
                              >
                                Accepted / Hired
                              </SelectItem>
                            )}
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Onboarding Badge if offered */}
                        {candidate.status === "offered" && (
                          <div>
                            {candidate.onboarding_application ? (
                              <Link
                                href={`/hr/applications`}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:underline"
                              >
                                <span>Offer Sent • Onboarding Pending</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleOpenOnboard(candidate)}
                                className="text-[11px] text-primary font-semibold hover:underline"
                              >
                                + Resend Offer Letter
                              </button>
                            )}
                          </div>
                        )}

                        {/* Onboarding Badge if accepted/hired */}
                        {candidate.status === "accepted" && (
                          <div>
                            <Link
                              href={`/hr/applications`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                            >
                              <span>Hired • Onboarding Completed</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <CandidateActions
                        candidate={candidate}
                        roleId={roleId}
                        assessmentEnabled={assessmentEnabled}
                        reanalyzing={reanalyzing !== null}
                        onEvaluation={() => handleOpenEvaluation(candidate)}
                        onRubric={() => handleOpenRubric(candidate)}
                        onOffer={() => handleOpenOnboard(candidate)}
                        onReanalyze={() => void retryEvaluation(candidate)}
                      />
                    </TableCell>
                  </DetailsTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Candidate Evaluation Sheet */}
      <CandidateEvaluationSheet
        candidate={selectedCandidate}
        roleId={roleId}
        roleTitle={roleTitle}
        open={evalSheetOpen}
        onOpenChange={setEvalSheetOpen}
        onAcceptCandidate={handleOpenOnboard}
        onOpenRubric={handleOpenRubric}
        assessmentEnabled={assessmentEnabled}
      />

      {/* Accept & Onboard Modal */}
      <AcceptOnboardModal
        candidate={candidateToOnboard}
        roleId={roleId}
        roleTitle={roleTitle}
        open={onboardModalOpen}
        onOpenChange={setOnboardModalOpen}
      />

      {/* Interview Rubric Dialog */}
      <InterviewRubricDialog
        candidate={candidateForRubric}
        roleId={roleId}
        roleTitle={roleTitle}
        roleDepartment=""
        open={rubricModalOpen}
        onOpenChange={setRubricModalOpen}
        onCandidateUpdated={(updated) => {
          setCandidateForRubric(updated);
          router.refresh();
        }}
        onProceedToOffer={(cand) => {
          setRubricModalOpen(false);
          handleOpenOnboard(cand);
        }}
      />
    </div>
  );
}

function CandidateActions({
  candidate,
  roleId,
  assessmentEnabled,
  reanalyzing,
  onEvaluation,
  onRubric,
  onOffer,
  onReanalyze,
}: {
  candidate: RecruitmentCandidate;
  roleId: string;
  assessmentEnabled: boolean;
  reanalyzing: boolean;
  onEvaluation: () => void;
  onRubric: () => void;
  onOffer: () => void;
  onReanalyze: () => void;
}) {
  const [open, setOpen] = useState(false);
  const itemClass =
    "flex min-h-10 w-full items-center justify-start gap-2 rounded-md px-3 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
  const action = (callback: () => void) => {
    setOpen(false);
    callback();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="size-10"
          aria-label={`Actions for ${candidate.name}`}
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 gap-1 p-2"
        aria-label={`Actions for ${candidate.name}`}
      >
        {(candidate.status === "interviewing" ||
          candidate.assessment_summary ||
          candidate.interview_rubric) && (
          <div className="border-b pb-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Interview documents
            </p>
            {(candidate.status === "interviewing" ||
              candidate.assessment_summary) && (
              <Link
                className={itemClass}
                href={`/hr/recruitment/${roleId}/candidates/${candidate.id}/assessment`}
              >
                <ClipboardList className="size-4" />
                <span>
                  <span className="block">
                    {candidate.assessment_summary?.state === "submitted" ||
                    (candidate.assessment_summary &&
                      candidate.status !== "interviewing")
                      ? "1. View assessment"
                      : candidate.assessment_summary
                        ? "1. Continue assessment"
                        : "1. Start assessment"}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {candidate.assessment_summary?.score_100 != null
                      ? `${candidate.assessment_summary.score_100.toFixed(1)}/100`
                      : "Complete before rubric"}
                  </span>
                </span>
              </Link>
            )}
            {!assessmentEnabled && (candidate.status === "interviewing" ||
              candidate.interview_rubric) && (
              <button
                id="tour-interview-rubric"
                className={itemClass}
                disabled={
                  !candidate.interview_rubric &&
                  candidate.assessment_summary?.state !== "submitted"
                }
                onClick={() => action(onRubric)}
              >
                <ClipboardList className="size-4 text-purple-600" />
                <span>
                  <span className="block">
                    {candidate.interview_rubric
                      ? "2. View rubric"
                      : "2. Fill rubric"}
                  </span>
                  {!candidate.interview_rubric &&
                    candidate.assessment_summary?.state !== "submitted" && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        Submit assessment first
                      </span>
                    )}
                </span>
              </button>
            )}
            {candidate.interview_rubric && (
              <button className={itemClass} onClick={() => action(onRubric)}>
                <Download className="size-4" />
                Download rubric
              </button>
            )}
            {candidate.assessment_summary?.state === "submitted" && (
              <Link
                className={itemClass}
                href={`/hr/recruitment/${roleId}/candidates/${candidate.id}/assessment?download=assessment`}
                onClick={() => setOpen(false)}
              >
                <Download className="size-4" />
                Download assessment form
              </Link>
            )}
          </div>
        )}
        <button className={itemClass} onClick={() => action(onEvaluation)}>
          <Eye className="size-4" />
          View evaluation
        </button>
        <button
          className={itemClass}
          disabled={reanalyzing}
          onClick={() => action(onReanalyze)}
        >
          <RotateCw className="size-4" />
          Reanalyze CV
        </button>
        {["interviewing", "offered"].includes(candidate.status) &&
          (!assessmentEnabled || candidate.assessment_summary?.state === "submitted") && (
          <button
            id="tour-send-offer"
            className={itemClass}
            onClick={() => action(onOffer)}
          >
            <Send className="size-4" />
            {candidate.status === "offered" ? "Resend offer" : "Send offer"}
          </button>
        )}
        <div className="mt-1 border-t pt-1">
          <DeleteCandidateDialog
            candidate={candidate}
            roleId={roleId}
            triggerClassName={itemClass + " text-destructive"}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

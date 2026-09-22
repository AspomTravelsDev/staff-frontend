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
  UserCheck,
  Send,
  FileText,
  Clock,
  Eye,
  ExternalLink,
  ChevronDown,
  RotateCw,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import type { RecruitmentCandidate, CandidateStatus, PostInterviewEvaluation } from "@/lib/types/recruitment";
import { updateCandidateStatus, reanalyzeCandidate } from "@/lib/api/recruitment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CandidateEvaluationSheet } from "./candidate-evaluation-sheet";
import { AcceptOnboardModal } from "./accept-onboard-modal";
import { InterviewRubricDialog } from "./interview-rubric-dialog";

interface CandidatesTableProps {
  candidates: RecruitmentCandidate[];
  roleId: string;
  roleTitle: string;
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
  stats,
}: CandidatesTableProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("score_desc");

  const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);
  const [evalSheetOpen, setEvalSheetOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [candidateToOnboard, setCandidateToOnboard] = useState<RecruitmentCandidate | null>(null);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [candidateForRubric, setCandidateForRubric] = useState<RecruitmentCandidate | null>(null);

  const handleOpenRubric = (candidate: RecruitmentCandidate) => {
    setCandidateForRubric(candidate);
    setRubricModalOpen(true);
  };

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
          s.toLowerCase().includes(q)
        );
        const summaryMatch = c.ai_summary?.toLowerCase().includes(q);

        return nameMatch || emailMatch || skillsMatch || summaryMatch;
      })
      .sort((a, b) => {
        const effectiveA = a.post_interview_evaluation?.combined_score ?? a.ai_score ?? -1;
        const effectiveB = b.post_interview_evaluation?.combined_score ?? b.ai_score ?? -1;

        switch (sortBy) {
          case "score_desc":
            if (effectiveB !== effectiveA) return effectiveB - effectiveA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "score_asc":
            if (effectiveA !== effectiveB) return effectiveA - effectiveB;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "post_desc": {
            const postA = a.post_interview_evaluation?.combined_score ?? -1;
            const postB = b.post_interview_evaluation?.combined_score ?? -1;
            if (postB !== postA) return postB - postA;
            return effectiveB - effectiveA;
          }
          case "cv_desc": {
            const cvA = a.ai_score ?? -1;
            const cvB = b.ai_score ?? -1;
            if (cvB !== cvA) return cvB - cvA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          case "date_desc":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "");
          default:
            return effectiveB - effectiveA;
        }
      });
  }, [candidates, activeTab, searchQuery, sortBy]);

  const handleStatusUpdate = async (
    candidateId: string,
    newStatus: CandidateStatus
  ) => {
    try {
      await updateCandidateStatus(candidateId, roleId, newStatus);
      toast.success(`Candidate status moved to ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
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

  const getPostScoreBadge = (evaluation?: PostInterviewEvaluation | null) => {
    if (!evaluation) return null;
    const score = evaluation.combined_score;
    const verdict = evaluation.verdict;

    let badgeClass = "bg-primary/15 text-primary border-primary/30";
    if (score >= 80 || verdict === "Strong Hire") {
      badgeClass = "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    } else if (score >= 65 || verdict === "Recommend for Offer") {
      badgeClass = "bg-blue-500/15 text-blue-600 border-blue-500/30";
    } else if (score >= 50 || verdict === "Hire with Reservations") {
      badgeClass = "bg-amber-500/15 text-amber-600 border-amber-500/30";
    } else {
      badgeClass = "bg-rose-500/15 text-rose-600 border-rose-500/30";
    }

    return (
      <Badge className={`${badgeClass} font-bold hover:opacity-90 flex items-center gap-1`}>
        <TrendingUp className="h-3 w-3" />
        {score}% Combined
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
    <div className="space-y-4">
      {/* Pipeline Stage Tabs */}
      <div id="tour-pipeline-stages" className="flex flex-wrap items-center gap-1.5 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
      <div id="tour-candidate-search" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, skills, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Rank: Post-Interview / Best Score</SelectItem>
              <SelectItem value="post_desc">Post-Interview Score: Highest First</SelectItem>
              <SelectItem value="cv_desc">Initial CV Score: Highest First</SelectItem>
              <SelectItem value="score_asc">Score: Lowest First</SelectItem>
              <SelectItem value="date_desc">Date Added: Newest First</SelectItem>
              <SelectItem value="name_asc">Candidate Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ranked Candidate Table */}
      <div id="tour-candidate-table" className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>CV Match</TableHead>
              <TableHead>Post-Interview Fit</TableHead>
              <TableHead>Skills & Experience</TableHead>
              <TableHead>Pipeline Stage</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="space-y-1">
                    <p className="font-medium">No candidates found in this view.</p>
                    <p className="text-xs">Upload a candidate CV to screen them with AI.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate, index) => {
                const score = candidate.ai_score;

                return (
                  <TableRow
                    key={candidate.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="text-center text-xs font-medium">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-foreground">#{index + 1}</span>
                        {candidate.post_interview_evaluation && (
                          <span className="text-[9px] font-semibold text-primary uppercase tracking-tighter">
                            Debriefed
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Candidate Info */}
                    <TableCell>
                      <div className="space-y-0.5">
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
                      </div>
                    </TableCell>

                    {/* Initial CV Score */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getScoreBadge(score)}
                        </div>
                        {candidate.ai_evaluation?.recommendation && (
                          <div className="text-[11px] text-muted-foreground">
                            {candidate.ai_evaluation.recommendation}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Post-Interview AI Score & Verdict */}
                    <TableCell>
                      {candidate.post_interview_evaluation ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {getPostScoreBadge(candidate.post_interview_evaluation)}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-1.5 py-0 ${
                                candidate.post_interview_evaluation.verdict === "Strong Hire"
                                  ? "text-emerald-600 border-emerald-500/30"
                                  : candidate.post_interview_evaluation.verdict === "Recommend for Offer"
                                  ? "text-blue-600 border-blue-500/30"
                                  : candidate.post_interview_evaluation.verdict === "Hire with Reservations"
                                  ? "text-amber-600 border-amber-500/30"
                                  : "text-rose-600 border-rose-500/30"
                              }`}
                            >
                              {candidate.post_interview_evaluation.verdict}
                            </Badge>
                            {candidate.interview_rubric?.scores?.total_score !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleOpenRubric(candidate)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 hover:underline"
                              >
                                <ClipboardList className="h-2.5 w-2.5" />
                                {candidate.interview_rubric.scores.total_score}/55
                              </button>
                            )}
                          </div>
                        </div>
                      ) : candidate.interview_rubric ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleOpenRubric(candidate)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/20 transition-colors"
                          >
                            <ClipboardList className="h-2.5 w-2.5" />
                            Rubric: {candidate.interview_rubric.scores?.total_score ?? 0}/55
                          </button>
                          <div className="text-[10px] text-amber-600 font-medium">
                            AI Debrief Pending
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          Pending Interview
                        </div>
                      )}
                    </TableCell>

                    {/* Skills & Experience */}
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        {candidate.ai_evaluation?.years_of_experience != null && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {candidate.ai_evaluation.years_of_experience} yrs experience
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {(candidate.ai_evaluation?.skills || []).slice(0, 3).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 font-normal"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {(candidate.ai_evaluation?.skills || []).length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{(candidate.ai_evaluation?.skills || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Stage / Status Selector */}
                    <TableCell id={index === 0 ? "tour-candidate-stage-selector" : undefined}>
                      <div className="space-y-1.5">
                        <Select
                          value={candidate.status}
                          onValueChange={(val: any) => handleStatusUpdate(candidate.id, val)}
                        >
                          <SelectTrigger className="h-8 text-xs capitalize font-medium w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="interviewing">Interviewing</SelectItem>
                            {candidate.status === "offered" && (
                              <SelectItem value="offered" disabled className="opacity-60 text-xs">
                                Offered (Offer Sent)
                              </SelectItem>
                            )}
                            {candidate.status === "accepted" && (
                              <SelectItem value="accepted" disabled className="opacity-60 text-xs">
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

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(candidate.created_at), "MMM d, yyyy")}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleOpenEvaluation(candidate)}
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          Evaluation
                        </Button>

                        {(candidate.status === "interviewing" || candidate.interview_rubric) && (
                          <Button
                            id="tour-interview-rubric"
                            variant={candidate.interview_rubric ? "secondary" : "outline"}
                            size="sm"
                            className="h-8 text-xs gap-1 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                            onClick={() => handleOpenRubric(candidate)}
                          >
                            <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                            {candidate.interview_rubric ? "Rubric" : "Fill Rubric"}
                          </Button>
                        )}

                        {candidate.status === "interviewing" && (
                          <Button
                            id="tour-send-offer"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleOpenOnboard(candidate)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Send Offer
                          </Button>
                        )}

                        {candidate.status === "offered" && (
                          <Button
                            id="tour-send-offer"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleOpenOnboard(candidate)}
                          >
                            <Send className="h-3 w-3" />
                            Resend Offer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
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

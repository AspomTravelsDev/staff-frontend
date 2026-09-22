"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  FileText,
  UserCheck,
  Send,
  RotateCw,
  Download,
  Mail,
  Phone,
  Clock,
  Loader2,
  ExternalLink,
  ClipboardList,
  Sparkles,
  AlertCircle,
  XCircle,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import type { RecruitmentCandidate, CandidateStatus } from "@/lib/types/recruitment";
import { updateCandidateStatus, reanalyzeCandidate } from "@/lib/api/recruitment";
import { toast } from "sonner";

interface CandidateEvaluationSheetProps {
  candidate: RecruitmentCandidate | null;
  roleId: string;
  roleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptCandidate: (candidate: RecruitmentCandidate) => void;
  onOpenRubric?: (candidate: RecruitmentCandidate) => void;
}

export function CandidateEvaluationSheet({
  candidate,
  roleId,
  roleTitle,
  open,
  onOpenChange,
  onAcceptCandidate,
  onOpenRubric,
}: CandidateEvaluationSheetProps) {
  const router = useRouter();
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<CandidateStatus>(candidate?.status || "reviewing");
  const [notes, setNotes] = useState(candidate?.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  // Sync state if candidate changes
  if (candidate && status !== candidate.status && !savingNotes) {
    setStatus(candidate.status);
    setNotes(candidate.notes || "");
  }

  if (!candidate) return null;

  const evalData = candidate.ai_evaluation;
  const score = candidate.ai_score ?? evalData?.match_score ?? 0;

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    if (sc >= 60) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    return "text-rose-600 bg-rose-500/10 border-rose-500/20";
  };

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(idx);
    toast.success("Question copied to clipboard!");
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    try {
      setStatus(newStatus);
      await updateCandidateStatus(candidate.id, roleId, newStatus, notes);
      toast.success(`Candidate status moved to ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await updateCandidateStatus(candidate.id, roleId, status, notes);
      toast.success("Notes saved successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setReanalyzing(true);
      await reanalyzeCandidate(candidate.id, roleId);
      toast.success("Candidate re-analyzed with updated role criteria!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to re-analyze candidate.");
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-6 space-y-6">
        <SheetHeader className="space-y-2 border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                {candidate.name}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Applicant for <strong>{roleTitle}</strong>
              </SheetDescription>
            </div>

            {/* AI Score Badges */}
            <div className="flex items-center gap-2">
              {candidate.post_interview_evaluation && (
                <div
                  className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl border font-bold ${getScoreColor(
                    candidate.post_interview_evaluation.combined_score
                  )}`}
                >
                  <div className="text-xl flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {candidate.post_interview_evaluation.combined_score}%
                  </div>
                  <div className="text-[9px] tracking-wider uppercase font-semibold">
                    Post-Interview Index
                  </div>
                </div>
              )}
              <div
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border font-bold ${
                  candidate.post_interview_evaluation
                    ? "bg-muted/40 border-border/60 text-muted-foreground"
                    : getScoreColor(score)
                }`}
              >
                <div className={candidate.post_interview_evaluation ? "text-base font-semibold text-foreground" : "text-2xl"}>
                  {score}%
                </div>
                <div className="text-[9px] tracking-wider uppercase font-semibold">
                  CV Match
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details & Meta */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            {candidate.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {candidate.phone}
              </span>
            )}
            {evalData?.years_of_experience != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {evalData.years_of_experience} yrs exp
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {candidate.cv_original_name}
            </span>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between pt-3 gap-2">
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(v) => handleStatusChange(v as CandidateStatus)}>
                <SelectTrigger className="h-9 w-[160px] text-xs capitalize font-medium">
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="gap-1.5 h-9 text-xs"
              >
                {reanalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Re-analyze
              </Button>
            </div>

            {(candidate.status === "interviewing" || candidate.interview_rubric) && onOpenRubric && (
              <Button
                variant={candidate.interview_rubric ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 h-9 text-xs text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                onClick={() => onOpenRubric(candidate)}
              >
                <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                {candidate.interview_rubric ? `Rubric (${candidate.interview_rubric.scores?.total_score || 0}/55)` : "Interview Rubric"}
              </Button>
            )}

            {candidate.status === "interviewing" && (
              <Button
                size="sm"
                className="gap-1.5 h-9 text-xs"
                onClick={() => onAcceptCandidate(candidate)}
              >
                <Send className="h-3.5 w-3.5" />
                Send Offer Letter
              </Button>
            )}

            {candidate.status === "offered" && (
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-medium">
                  Offer Sent • Awaiting Onboarding
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1"
                  onClick={() => onAcceptCandidate(candidate)}
                >
                  Resend Offer
                </Button>
              </div>
            )}

            {candidate.status === "accepted" && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-medium">
                Hired • Onboarding Completed
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* AI Evaluation Section */}
        <div className="space-y-5">
          {/* Post-Interview AI Debrief (if available) */}
          {candidate.post_interview_evaluation && (
            <div className="space-y-3 rounded-lg border-2 border-primary/30 bg-primary/[0.03] p-4">
              <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Post-Interview AI Debrief & Hiring Verdict
                  </span>
                </div>
                <Badge
                  className={`text-xs font-semibold px-2.5 py-0.5 ${
                    candidate.post_interview_evaluation.verdict === "Strong Hire"
                      ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                      : candidate.post_interview_evaluation.verdict === "Recommend for Offer"
                      ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                      : candidate.post_interview_evaluation.verdict === "Hire with Reservations"
                      ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                      : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                  }`}
                >
                  {candidate.post_interview_evaluation.verdict}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Combined Hiring Index:</span>
                <span className="font-bold text-foreground text-sm flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  {candidate.post_interview_evaluation.combined_score}%
                </span>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2.5 rounded border border-border/40">
                {candidate.post_interview_evaluation.executive_summary}
              </p>

              {/* Gap Resolution Check */}
              {candidate.post_interview_evaluation.gap_resolution && candidate.post_interview_evaluation.gap_resolution.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    CV Red Flag / Gap Resolution:
                  </div>
                  <div className="space-y-1.5">
                    {candidate.post_interview_evaluation.gap_resolution.map((item, gIdx) => (
                      <div
                        key={gIdx}
                        className="text-xs p-2 rounded bg-background/80 border border-border/50 flex items-start gap-2"
                      >
                        {item.status === "resolved" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        ) : item.status === "partially_resolved" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground text-[11px]">
                            {item.gap}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Probation Watchlist */}
              {candidate.post_interview_evaluation.probation_focus_areas && candidate.post_interview_evaluation.probation_focus_areas.length > 0 && (
                <div className="pt-1 text-[11px]">
                  <span className="text-muted-foreground font-medium">Probation Focus: </span>
                  <span className="text-foreground">
                    {candidate.post_interview_evaluation.probation_focus_areas.join(" • ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Executive Summary */}
          <div className="space-y-1.5 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Candidate Fit Assessment (CV Screening)
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {candidate.ai_summary || evalData?.summary || "No summary available."}
            </p>
            {evalData?.recommendation && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs font-medium">
                  Initial Recommendation: {evalData.recommendation}
                </Badge>
              </div>
            )}
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Key Strengths
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {(evalData?.strengths || []).length > 0 ? (
                  evalData?.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground italic">None specifically identified</li>
                )}
              </ul>
            </div>

            {/* Gaps / Flags */}
            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Missing / Gaps to Check
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {(evalData?.gaps || []).length > 0 ? (
                  evalData?.gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground italic">No critical gaps noted</li>
                )}
              </ul>
            </div>
          </div>

          {/* Targeted Interview Probes (Triggered by CV Gaps & Red Flags) */}
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <HelpCircle className="h-4 w-4" />
                Targeted Interview Probes (CV Gaps & Red Flags)
              </div>
              {evalData?.interview_probes && evalData.interview_probes.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                  {evalData.interview_probes.length} Probes Generated
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Questions generated specifically to probe this candidate’s CV red flags, experience gaps, or unverified claims:
            </p>

            <div className="space-y-3 pt-1">
              {evalData?.interview_probes && evalData.interview_probes.length > 0 ? (
                evalData.interview_probes.map((probe, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold tracking-wide ${
                          probe.category.toLowerCase().includes("red flag")
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                            : probe.category.toLowerCase().includes("gap")
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {probe.category}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-70 hover:opacity-100"
                        onClick={() => handleCopyQuestion(probe.question, idx)}
                        title="Copy question"
                      >
                        {copiedQuestionIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {probe.cv_trigger && (
                      <div className="text-[11px] text-muted-foreground bg-background/80 p-2 rounded border border-border/60 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-foreground/90 font-medium">CV Trigger:</strong>{" "}
                          {probe.cv_trigger}
                        </span>
                      </div>
                    )}

                    <p className="font-semibold text-foreground text-xs leading-relaxed">
                      {probe.question}
                    </p>

                    {probe.what_to_listen_for && (
                      <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 pt-0.5">
                        <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-primary font-medium">Listen for:</strong>{" "}
                          {probe.what_to_listen_for}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (evalData?.suggested_interview_questions || []).length > 0 ? (
                evalData?.suggested_interview_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start justify-between gap-2 p-2.5 rounded-md border bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
                  >
                    <span className="leading-relaxed font-medium text-foreground/90">
                      {idx + 1}. {q}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-60 group-hover:opacity-100 shrink-0"
                      onClick={() => handleCopyQuestion(q, idx)}
                      title="Copy question"
                    >
                      {copiedQuestionIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No interview questions generated.</p>
              )}
            </div>
          </div>

          {/* Skills */}
          {evalData?.skills && evalData.skills.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {evalData.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className="space-y-2 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                HR Interview & Screening Notes
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Save Notes
              </Button>
            </div>
            <Textarea
              placeholder="Add feedback from hiring manager, interview impressions, salary expectations..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Extracted Text Preview (Collapsible) */}
          {candidate.cv_extracted_text && (
            <div className="space-y-2 border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawText(!showRawText)}
                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                {showRawText ? "Hide Extracted CV Text" : "View Extracted CV Text"}
              </Button>

              {showRawText && (
                <div className="max-h-60 overflow-y-auto rounded border bg-muted/30 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {candidate.cv_extracted_text}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

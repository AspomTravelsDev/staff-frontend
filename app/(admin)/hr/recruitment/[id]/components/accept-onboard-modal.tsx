"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  ArrowRight,
  CheckCircle2,
  ShieldOff,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  RotateCw,
  HelpCircle,
  XCircle,
} from "lucide-react";
import type { RecruitmentCandidate, PostInterviewEvaluation } from "@/lib/types/recruitment";
import { onboardCandidateAction, analyzeInterviewAction } from "@/lib/api/recruitment";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";
import { sendInvite } from "@/lib/api/hr";
import {
  calculateNetFromGross,
  calculateGrossFromNet,
  ComputedSalaryPackage,
} from "@/lib/payroll/payroll-reverse-calculator";
import { toast } from "sonner";
import Link from "next/link";

interface AcceptOnboardModalProps {
  candidate: RecruitmentCandidate | null;
  roleId: string;
  roleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcceptOnboardModal({
  candidate,
  roleId,
  roleTitle,
  open,
  onOpenChange,
}: AcceptOnboardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    applicant_name: "",
    applicant_email: "",
    position_title: roleTitle,
    effective_date: new Date().toISOString().split("T")[0],
  });

  // Salary State: Gross ↔ Net bidirectional inputs and Tax Exemption
  const [grossInput, setGrossInput] = useState<string>("200000");
  const [netInput, setNetInput] = useState<string>("187500");
  const [lastEdited, setLastEdited] = useState<"gross" | "net">("gross");
  const [isTaxExempt, setIsTaxExempt] = useState(false);

  // Compute breakdown dynamically in background based on active input and tax exemption
  const breakdown: ComputedSalaryPackage = useMemo(() => {
    if (lastEdited === "net") {
      const netVal = Number(netInput) || 0;
      return calculateGrossFromNet(netVal, isTaxExempt);
    } else {
      const grossVal = Number(grossInput) || 0;
      return calculateNetFromGross(grossVal, isTaxExempt);
    }
  }, [lastEdited, grossInput, netInput, isTaxExempt]);

  // Pre-Offer AI Verification State
  const [postInterviewAnalysis, setPostInterviewAnalysis] = useState<PostInterviewEvaluation | null>(
    candidate?.post_interview_evaluation || null
  );
  const [analyzingInterview, setAnalyzingInterview] = useState(false);

  // Pre-fill when candidate changes
  useEffect(() => {
    if (candidate) {
      const assessmentSalary = candidate.assessment_summary?.hiring_review?.recommended_salary;
      const parsedSalary = assessmentSalary ?? (candidate.interview_rubric?.logistics?.recommended_salary
        ? parseFloat(candidate.interview_rubric.logistics.recommended_salary.replace(/[^0-9.]/g, ""))
        : null);

      const gross = parsedSalary && !isNaN(parsedSalary) && parsedSalary > 0 ? parsedSalary : 200000;
      const calc = calculateNetFromGross(gross, false);

      setFormData({
        applicant_name: candidate.name || "",
        applicant_email: candidate.email || "",
        position_title: roleTitle || "",
        effective_date: new Date().toISOString().split("T")[0],
      });

      setGrossInput(String(gross));
      setNetInput(String(calc.net_salary));
      setLastEdited("gross");
      setIsTaxExempt(false);
      setCreatedAppId(null);
      setPostInterviewAnalysis(candidate.post_interview_evaluation || null);
    }
  }, [candidate, roleTitle]);

  // Automatically trigger pre-offer interview analysis if candidate has rubric but no debrief yet
  useEffect(() => {
    if (!open || !candidate) return;

    if (candidate.post_interview_evaluation) {
      setPostInterviewAnalysis(candidate.post_interview_evaluation);
      return;
    }

    if ((candidate.assessment_summary?.state === "submitted" || candidate.interview_rubric) && !postInterviewAnalysis && !analyzingInterview) {
      const runAutoPreOfferCheck = async () => {
        try {
          setAnalyzingInterview(true);
          const currentGross = breakdown.gross_salary || 200000;
          const res = await analyzeInterviewAction(candidate.id, roleId, currentGross);
          if (res.success && res.data?.post_interview_evaluation) {
            setPostInterviewAnalysis(res.data.post_interview_evaluation);
          }
        } catch (err: any) {
          console.error("Auto pre-offer AI check failed:", err);
        } finally {
          setAnalyzingInterview(false);
        }
      };

      runAutoPreOfferCheck();
    }
  }, [open, candidate?.id]);

  const handleRerunInterviewAnalysis = async () => {
    if (!candidate) return;
    try {
      setAnalyzingInterview(true);
      const currentGross = breakdown.gross_salary || 200000;
      const res = await analyzeInterviewAction(candidate.id, roleId, currentGross);
      if (!res.success) {
        toast.error(res.error || "Failed to run pre-offer analysis.");
        return;
      }
      if (res.data?.post_interview_evaluation) {
        setPostInterviewAnalysis(res.data.post_interview_evaluation);
        toast.success("Pre-offer AI verification refreshed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to run pre-offer analysis.");
    } finally {
      setAnalyzingInterview(false);
    }
  };

  const handleGrossChange = (val: string) => {
    setLastEdited("gross");
    setGrossInput(val);
    const num = Number(val) || 0;
    if (num > 0) {
      const calc = calculateNetFromGross(num, isTaxExempt);
      setNetInput(calc.net_salary ? String(calc.net_salary) : "");
    } else {
      setNetInput("");
    }
  };

  const handleNetChange = (val: string) => {
    setLastEdited("net");
    setNetInput(val);
    const num = Number(val) || 0;
    if (num > 0) {
      const calc = calculateGrossFromNet(num, isTaxExempt);
      setGrossInput(calc.gross_salary ? String(calc.gross_salary) : "");
    } else {
      setGrossInput("");
    }
  };

  const handleTaxExemptToggle = (checked: boolean) => {
    setIsTaxExempt(checked);
    if (lastEdited === "net") {
      const netVal = Number(netInput) || 0;
      const calc = calculateGrossFromNet(netVal, checked);
      setGrossInput(calc.gross_salary ? String(calc.gross_salary) : "");
    } else {
      const grossVal = Number(grossInput) || 0;
      const calc = calculateNetFromGross(grossVal, checked);
      setNetInput(calc.net_salary ? String(calc.net_salary) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    if (!formData.applicant_email) {
      toast.error("Candidate email is required to send their offer letter.");
      return;
    }

    const finalGross = breakdown.gross_salary;
    if (finalGross <= 0) {
      toast.error("Please enter a valid Gross or Net salary.");
      return;
    }

    const toastId = toast.loading("Configuring employment terms...");
    try {
      setLoading(true);
      const res = await onboardCandidateAction(candidate.id, roleId, {
        applicant_name: formData.applicant_name,
        applicant_email: formData.applicant_email,
        position_title: formData.position_title,
        reporting_to: "Nancy O. Peters",
        effective_date: formData.effective_date,
        salary_gross: finalGross,
        is_tax_exempt: isTaxExempt,
        salary_breakdown: {
          basic_salary: breakdown.basic,
          housing_allowance: breakdown.rent_housing,
          transport_allowance: breakdown.transport,
          utility_allowance: breakdown.utility,
          statutory_tax_deduction: breakdown.statutory_tax_deduction,
          net_salary: breakdown.net_salary,
          gross_salary: breakdown.gross_salary,
          medical_allowance: breakdown.medical,
          furniture_allowance: breakdown.furniture,
          entertainment_allowance: breakdown.entertainment,
          meal_subsidy: breakdown.meal_subsidy,
          clothing_allowance: breakdown.clothing,
          passages_allowance: breakdown.passages,
        },
      });

      if (!res.success) {
        toast.error(res.error || "Failed to configure employment terms.", { id: toastId });
        return;
      }

      const newApp = res.data?.onboarding_application || res.data;
      if (!newApp?.id) {
        throw new Error("Failed to initialize onboarding application.");
      }

      toast.loading("Generating offer letter & NDA PDFs...", { id: toastId });
      const pdfResult = await downloadPdfFormsAction(newApp.id, { includeAdminOnly: true });
      if (pdfResult && "error" in pdfResult && pdfResult.error) {
        console.error("PDF generation warning/error:", pdfResult.error);
        throw new Error(`Failed to generate documents: ${pdfResult.error}`);
      }

      toast.loading(`Emailing offer letter package to ${formData.applicant_email}...`, { id: toastId });
      await sendInvite(newApp.id);

      setCreatedAppId(newApp.id);
      toast.success(
        `Offer letter & onboarding package dispatched to ${formData.applicant_email}!`,
        { id: toastId }
      );
      router.refresh();
    } catch (err: any) {
      console.error("Error dispatching offer package:", err);
      toast.error(err.message || "Failed to create offer & onboarding application.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="h-5 w-5 text-primary" />
            Send Offer Letter & Onboarding Invite
          </DialogTitle>
          <DialogDescription>
            Configure employment terms and dispatch the official offer letter to <strong>{candidate?.name}</strong>. Candidate status will update to <strong>Offered</strong>, and automatically mirror to <strong>Accepted / Hired</strong> once onboarding is completed.
          </DialogDescription>
        </DialogHeader>

        {createdAppId ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Offer Letter Dispatched!</h3>
              <p className="text-sm text-muted-foreground">
                The candidate’s status is now <strong>Offered</strong>. Once they accept the offer and complete onboarding, their status will automatically update to <strong>Accepted / Hired</strong>.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Back to Workspace
              </Button>
              <Button asChild className="gap-1.5">
                <Link href={`/hr/applications`}>
                  View In Onboarding Queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Pre-Offer AI Verification & Interview Debrief */}
            {analyzingInterview ? (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-3 text-xs text-primary font-medium animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
                <span>Running Pre-Offer AI Analysis (synthesizing interview rubric, gap resolution, & salary match)...</span>
              </div>
            ) : postInterviewAnalysis ? (
              <div className="space-y-3 rounded-lg border-2 border-primary/30 bg-primary/[0.03] p-4 text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold uppercase tracking-wider text-primary text-[11px]">
                      Pre-Offer AI Hiring Verification
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs font-semibold px-2 py-0.5 ${
                        postInterviewAnalysis.verdict === "Strong Hire"
                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                          : postInterviewAnalysis.verdict === "Recommend for Offer"
                          ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                          : postInterviewAnalysis.verdict === "Hire with Reservations"
                          ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                      }`}
                    >
                      {postInterviewAnalysis.verdict}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={handleRerunInterviewAnalysis}
                      title="Re-analyze with current salary"
                    >
                      <RotateCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Metric Highlights */}
                <div className="grid grid-cols-3 gap-2 text-center py-1.5 bg-background/70 rounded border border-border/40">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Combined Score</div>
                    <div className="text-sm font-bold text-foreground flex items-center justify-center gap-0.5">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {postInterviewAnalysis.combined_score}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Interview score</div>
                    <div className="text-sm font-bold text-foreground">
                      {candidate?.assessment_summary?.score_100 ?? candidate?.interview_rubric?.scores?.total_score ?? 0}
                      <span className="text-[10px] font-normal text-muted-foreground">{candidate?.assessment_summary ? " / 100" : " / 55"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">CV Gaps Cleared</div>
                    <div className="text-sm font-bold text-emerald-600">
                      {postInterviewAnalysis.gap_resolution?.filter((g) => g.status === "resolved").length || 0}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {" "}/ {postInterviewAnalysis.gap_resolution?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <p className="text-[11px] text-foreground/90 leading-relaxed bg-background/50 p-2.5 rounded border border-border/30">
                  {postInterviewAnalysis.executive_summary}
                </p>

                {/* Salary Alignment Note */}
                {postInterviewAnalysis.salary_alignment && (
                  <div
                    className={`p-2 rounded border text-[11px] flex items-start gap-1.5 ${
                      postInterviewAnalysis.salary_alignment.status === "below_expectation"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    <span className="font-semibold shrink-0">Salary Match:</span>
                    <span>{postInterviewAnalysis.salary_alignment.notes}</span>
                  </div>
                )}

                {/* Caution banner for reservations */}
                {(postInterviewAnalysis.verdict === "Do Not Recommend" ||
                  postInterviewAnalysis.verdict === "Hire with Reservations") && (
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Caution:</strong> The AI interview debrief noted reservations. Verify before sending this offer letter.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {candidate?.assessment_summary?.state === "submitted" || candidate?.interview_rubric ? (
                    <span>Interview assessment is recorded. You can run pre-offer analysis below.</span>
                  ) : (
                    <span>No submitted interview assessment is recorded for this candidate yet.</span>
                  )}
                </span>
                {(candidate?.assessment_summary?.state === "submitted" || candidate?.interview_rubric) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleRerunInterviewAnalysis}
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    Run AI Analysis
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="applicant_name">Candidate Name</Label>
                <Input
                  id="applicant_name"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="applicant_email">Email for Offer & Onboarding</Label>
                <Input
                  id="applicant_email"
                  type="email"
                  value={formData.applicant_email}
                  onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="position_title">Position Title</Label>
                <Input
                  id="position_title"
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">Reporting manager: Nancy O. Peters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="effective_date">Effective Start Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                required
              />
            </div>

            {/* Compensation Section: Gross and Net Only (No Breakdown) */}
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salary_gross" className="text-xs font-semibold">
                    Gross Monthly Salary (₦)
                  </Label>
                  <Input
                    id="salary_gross"
                    type="number"
                    min={0}
                    step="any"
                    value={grossInput}
                    onChange={(e) => handleGrossChange(e.target.value)}
                    placeholder="e.g. 200,000"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="salary_net" className="text-xs font-semibold flex items-center justify-between">
                    <span>Net Monthly Salary (₦)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {isTaxExempt ? "Tax Exempt" : "After PAYE Tax"}
                    </span>
                  </Label>
                  <Input
                    id="salary_net"
                    type="number"
                    min={0}
                    step="any"
                    value={netInput}
                    onChange={(e) => handleNetChange(e.target.value)}
                    placeholder="e.g. 187,500"
                    required
                  />
                </div>
              </div>

              {/* Tax Exemption Option */}
              <div className="rounded-lg border p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                <label
                  htmlFor="is_tax_exempt"
                  className="flex cursor-pointer items-start gap-3 select-none"
                >
                  <input
                    id="is_tax_exempt"
                    name="is_tax_exempt"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer"
                    checked={isTaxExempt}
                    onChange={(e) => handleTaxExemptToggle(e.target.checked)}
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldOff className="h-3.5 w-3.5 text-amber-500" />
                      Tax Exempt Candidate
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Exempt this salary from PAYE statutory tax deduction (Gross = Net).
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Est. PAYE Tax:</span>
                  <span className="font-semibold text-foreground">
                    {isTaxExempt
                      ? "₦0.00 (Exempt)"
                      : `₦${Number(breakdown.statutory_tax_deduction || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Monthly Take-Home:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{Number(breakdown.net_salary || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Offer Letter & Onboarding Invite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

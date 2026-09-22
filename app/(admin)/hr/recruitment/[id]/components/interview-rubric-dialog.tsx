"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Send,
  Loader2,
  Sparkles,
  ClipboardList,
  User,
  Award,
  FileText,
  DollarSign,
  Calendar,
  Check,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Target,
  ShieldCheck,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import type {
  RecruitmentCandidate,
  InterviewRubric,
  RubricAssessmentScores,
  PostInterviewEvaluation,
} from "@/lib/types/recruitment";
import { saveCandidateRubricAction, analyzeInterviewAction } from "@/lib/api/recruitment";
import { toast } from "sonner";

interface InterviewRubricDialogProps {
  candidate: RecruitmentCandidate | null;
  roleTitle: string;
  roleDepartment: string;
  roleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToOffer?: (candidate: RecruitmentCandidate) => void;
  onCandidateUpdated?: (candidate: RecruitmentCandidate) => void;
}

export function InterviewRubricDialog({
  candidate,
  roleTitle,
  roleDepartment,
  roleId,
  open,
  onOpenChange,
  onProceedToOffer,
  onCandidateUpdated,
}: InterviewRubricDialogProps) {
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [postInterviewEvaluation, setPostInterviewEvaluation] = useState<PostInterviewEvaluation | null>(
    candidate?.post_interview_evaluation || null
  );

  // Form State
  const [applicantName, setApplicantName] = useState("");
  const [applicantAge, setApplicantAge] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [roleAppliedFor, setRoleAppliedFor] = useState(roleTitle);

  const [reviewerName, setReviewerName] = useState("");
  const [reviewerDesignation, setReviewerDesignation] = useState("HR Officer");
  const [interviewDate, setInterviewDate] = useState("");

  // Assessment Scores
  const [scores, setScores] = useState<Omit<RubricAssessmentScores, "total_score">>({
    cultural_fit: 3,
    career_motivation: 4,
    teamwork: 4,
    technical_skills: 3,
    leadership_capabilities: 3,
    self_awareness: 3,
    critical_thinking: 4,
    social_skills: 3,
    communication: 3,
    test_score: 5,
  });

  // Qualitative Fields
  const [keyStrengths, setKeyStrengths] = useState("");
  const [weaknessAreas, setWeaknessAreas] = useState("");
  const [interviewComments, setInterviewComments] = useState("");

  // Logistics & Offer Fields
  const [availabilityToResume, setAvailabilityToResume] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [recommendedSalary, setRecommendedSalary] = useState("");
  const [recommendation, setRecommendation] = useState("RECOMMEND FOR OFFER");
  const [nyscStatus, setNyscStatus] = useState("");
  const [accommodation, setAccommodation] = useState("NOT NEEDED");

  // AI Suggestions for the 4 targeted categories
  const aiSuggestions = useMemo(() => {
    return (
      candidate?.ai_suggested_rubric_scores ||
      candidate?.ai_evaluation?.suggested_rubric_scores || {
        technical_skills: 3,
        teamwork: 4,
        leadership_capabilities: 3,
        critical_thinking_problem_solving: 3,
      }
    );
  }, [candidate]);

  // Load existing rubric or initialize defaults
  useEffect(() => {
    if (!candidate) return;

    const existing = candidate.interview_rubric;
    if (existing) {
      setApplicantName(existing.applicant_info?.name || candidate.name || "");
      setApplicantAge(existing.applicant_info?.age || "");
      setApplicantAddress(existing.applicant_info?.address || "");
      setRoleAppliedFor(existing.applicant_info?.role_applied_for || roleTitle);

      setReviewerName(existing.reviewer_info?.name || "");
      setReviewerDesignation(existing.reviewer_info?.designation || "HR Officer");
      setInterviewDate(existing.reviewer_info?.date || format(new Date(), "do MMMM yyyy"));

      if (existing.scores) {
        setScores({
          cultural_fit: Number(existing.scores.cultural_fit) || 3,
          career_motivation: Number(existing.scores.career_motivation) || 4,
          teamwork: Number(existing.scores.teamwork) || 4,
          technical_skills: Number(existing.scores.technical_skills) || 3,
          leadership_capabilities: Number(existing.scores.leadership_capabilities) || 3,
          self_awareness: Number(existing.scores.self_awareness) || 3,
          critical_thinking: Number(existing.scores.critical_thinking) || 4,
          social_skills: Number(existing.scores.social_skills) || 3,
          communication: Number(existing.scores.communication) || 3,
          test_score: Number(existing.scores.test_score) || 5,
        });
      }

      setKeyStrengths(existing.qualitative?.key_strengths || "");
      setWeaknessAreas(existing.qualitative?.weakness_areas || "");
      setInterviewComments(existing.qualitative?.comments_from_interview || "");

      setAvailabilityToResume(existing.logistics?.availability_to_resume || "");
      setSalaryExpectation(existing.logistics?.salary_expectation || "");
      setRecommendedSalary(existing.logistics?.recommended_salary || "");
      setRecommendation(existing.logistics?.recommendation || "RECOMMEND FOR OFFER");
      setNyscStatus(existing.logistics?.nysc_status || "");
      setAccommodation(existing.logistics?.accommodation || "NOT NEEDED");
    } else {
      setApplicantName(candidate.name || "");
      setApplicantAge("");
      setApplicantAddress("");
      setRoleAppliedFor(roleTitle);

      setReviewerName("");
      setReviewerDesignation("HR Officer");
      setInterviewDate(format(new Date(), "do MMMM yyyy"));

      setScores({
        cultural_fit: 3,
        career_motivation: 4,
        teamwork: aiSuggestions.teamwork ?? 4,
        technical_skills: aiSuggestions.technical_skills ?? 3,
        leadership_capabilities: aiSuggestions.leadership_capabilities ?? 3,
        self_awareness: 3,
        critical_thinking: aiSuggestions.critical_thinking_problem_solving ?? 4,
        social_skills: 3,
        communication: 3,
        test_score: 5,
      });

      setKeyStrengths(candidate.ai_evaluation?.strengths?.slice(0, 3).join("\n") || "");
      setWeaknessAreas(candidate.ai_evaluation?.gaps?.slice(0, 2).join("\n") || "");
      setInterviewComments(candidate.ai_summary || "");

      setAvailabilityToResume("");
      setSalaryExpectation("");
      setRecommendedSalary("");
      setRecommendation("RECOMMEND FOR OFFER");
      setNyscStatus("");
      setAccommodation("NOT NEEDED");
    }
    setPostInterviewEvaluation(candidate.post_interview_evaluation || null);
  }, [candidate, roleTitle, aiSuggestions]);

  // Total score calculation (out of 55)
  const totalScore = useMemo(() => {
    return (
      (Number(scores.cultural_fit) || 0) +
      (Number(scores.career_motivation) || 0) +
      (Number(scores.teamwork) || 0) +
      (Number(scores.technical_skills) || 0) +
      (Number(scores.leadership_capabilities) || 0) +
      (Number(scores.self_awareness) || 0) +
      (Number(scores.critical_thinking) || 0) +
      (Number(scores.social_skills) || 0) +
      (Number(scores.communication) || 0) +
      (Number(scores.test_score) || 0)
    );
  }, [scores]);

  const handleScoreChange = (field: keyof typeof scores, value: number) => {
    const maxVal = field === "test_score" ? 10 : 5;
    const clamped = Math.max(0, Math.min(maxVal, value));
    setScores((prev) => ({ ...prev, [field]: clamped }));
  };

  const buildRubricPayload = (): InterviewRubric => {
    return {
      applicant_info: {
        name: applicantName.trim() || candidate?.name || "",
        age: applicantAge.trim(),
        address: applicantAddress.trim(),
        role_applied_for: roleAppliedFor.trim() || roleTitle,
      },
      reviewer_info: {
        name: reviewerName.trim() || "HR Reviewer",
        designation: reviewerDesignation.trim() || "HR Officer",
        date: interviewDate.trim() || format(new Date(), "do MMMM yyyy"),
      },
      scores: {
        ...scores,
        total_score: totalScore,
      },
      qualitative: {
        key_strengths: keyStrengths.trim(),
        weakness_areas: weaknessAreas.trim(),
        comments_from_interview: interviewComments.trim(),
      },
      logistics: {
        availability_to_resume: availabilityToResume.trim(),
        salary_expectation: salaryExpectation.trim(),
        recommended_salary: recommendedSalary.trim(),
        recommendation: recommendation.trim(),
        nysc_status: nyscStatus.trim(),
        accommodation: accommodation.trim(),
      },
    };
  };

  const handleSaveRubricOnly = async () => {
    if (!candidate) return;

    setSaving(true);
    try {
      const rubricPayload = buildRubricPayload();
      await saveCandidateRubricAction(candidate.id, roleId, rubricPayload);
      toast.success("Interview rubric saved successfully.");

      const updatedCandidate: RecruitmentCandidate = {
        ...candidate,
        interview_rubric: rubricPayload,
      };
      onCandidateUpdated?.(updatedCandidate);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save interview rubric.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAnalyze = async (proceedToOffer: boolean = false) => {
    if (!candidate) return;

    setSaving(true);
    setAnalyzing(true);
    try {
      const rubricPayload = buildRubricPayload();
      await saveCandidateRubricAction(candidate.id, roleId, rubricPayload);

      const parsedSalary = recommendedSalary
        ? parseFloat(recommendedSalary.replace(/[^0-9.]/g, ""))
        : undefined;

      const updatedCandidate = await analyzeInterviewAction(
        candidate.id,
        roleId,
        !isNaN(parsedSalary as number) && (parsedSalary as number) > 0 ? (parsedSalary as number) : undefined
      );

      setPostInterviewEvaluation(updatedCandidate.post_interview_evaluation || null);
      onCandidateUpdated?.(updatedCandidate);

      if (proceedToOffer) {
        toast.success("AI interview synthesis completed! Opening offer...");
        onProceedToOffer?.(updatedCandidate);
      } else {
        toast.success("Interview rubric saved & analyzed by AI!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save rubric or analyze with AI.");
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("interview-rubric-pdf-document");
    if (!element) {
      toast.error("Rubric document element not found.");
      return;
    }

    setIsExportingPdf(true);
    const toastId = toast.loading("Generating interview rubric PDF...");

    try {
      // Small pause to ensure layout and image rendering
      await new Promise((resolve) => setTimeout(resolve, 200));

      const dataUrl = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
          boxShadow: "none",
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [element.offsetWidth, element.offsetHeight],
      });

      pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);

      const safeName = (applicantName || candidate?.name || "Candidate")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      pdf.save(`Interview_Rubric_${safeName}.pdf`);
      toast.success("Interview rubric PDF downloaded successfully.", { id: toastId });
    } catch (err) {
      console.error("Failed to generate rubric PDF:", err);
      toast.error("Failed to generate rubric PDF.", { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!candidate) return null;

  const assessmentItems: Array<{
    key: keyof typeof scores;
    label: string;
    max: number;
    aiSuggest?: number;
  }> = [
    { key: "cultural_fit", label: "Cultural Fit", max: 5 },
    { key: "career_motivation", label: "Career Motivation", max: 5 },
    { key: "teamwork", label: "Teamwork", max: 5, aiSuggest: aiSuggestions.teamwork },
    { key: "technical_skills", label: "Technical Skills", max: 5, aiSuggest: aiSuggestions.technical_skills },
    { key: "leadership_capabilities", label: "Leadership Capabilities", max: 5, aiSuggest: aiSuggestions.leadership_capabilities },
    { key: "self_awareness", label: "Self-awareness", max: 5 },
    { key: "critical_thinking", label: "Critical Thinking & Problem Solving", max: 5, aiSuggest: aiSuggestions.critical_thinking_problem_solving },
    { key: "social_skills", label: "Social Skills", max: 5 },
    { key: "communication", label: "Communication", max: 5 }, // Manual, no AI suggestion
    { key: "test_score", label: "Assessment Test Score", max: 10 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[1000px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8">
        {/* =========================================================================
            SCREEN VIEW: Modern, spacious, easy-to-fill form
           ========================================================================= */}
        <div className="space-y-6 w-full overflow-x-hidden">
          {/* Header */}
          <DialogHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Interview Rubric Form
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Evaluate <strong className="text-foreground">{candidate.name}</strong> for the position of{" "}
                  <strong className="text-foreground">{roleTitle}</strong>.
                </DialogDescription>
              </div>

              {/* Total Score Badge */}
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg shrink-0">
                <span className="text-xs text-muted-foreground font-medium">Total Score:</span>
                <span className="text-lg font-bold text-primary">{totalScore}</span>
                <span className="text-xs text-muted-foreground">/ 55</span>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Section 1: Applicant & Reviewer Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                1. Candidate & Reviewer Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-lg border">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="applicant_name" className="text-xs">Candidate Name</Label>
                  <Input
                    id="applicant_name"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Candidate full name"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="applicant_age" className="text-xs">Age</Label>
                  <Input
                    id="applicant_age"
                    value={applicantAge}
                    onChange={(e) => setApplicantAge(e.target.value)}
                    placeholder="Age in years"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="role_applied" className="text-xs">Role Applied For</Label>
                  <Input
                    id="role_applied"
                    value={roleAppliedFor}
                    onChange={(e) => setRoleAppliedFor(e.target.value)}
                    placeholder="Role applied for"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="applicant_address" className="text-xs">Address / Location</Label>
                  <Input
                    id="applicant_address"
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="Residential address or location"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reviewer_name" className="text-xs">Reviewer(s)</Label>
                  <Input
                    id="reviewer_name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Interviewer name(s)"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reviewer_designation" className="text-xs">Designation</Label>
                  <Input
                    id="reviewer_designation"
                    value={reviewerDesignation}
                    onChange={(e) => setReviewerDesignation(e.target.value)}
                    placeholder="Reviewer designation"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Assessment Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  2. Assessment Scoring (Total: 55 Marks)
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Rate from 1 to max mark
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {assessmentItems.map((item) => {
                  const currentVal = scores[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2.5 bg-card border rounded-lg hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (Max {item.max})
                          </span>
                        </div>
                        {item.aiSuggest !== undefined && (
                          <div className="flex items-center gap-1 text-[10px] text-primary">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>AI suggested: {item.aiSuggest}</span>
                          </div>
                        )}
                      </div>

                      {/* Clickable Score Buttons for 1-5, or Input for Test Score */}
                      {item.max === 5 ? (
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleScoreChange(item.key, val)}
                              className={`w-7 h-7 rounded text-xs font-semibold transition-all ${
                                currentVal === val
                                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={item.max}
                            value={currentVal}
                            onChange={(e) => handleScoreChange(item.key, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Qualitative Feedback (User Requested Strengths & Weaknesses) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                3. Qualitative Assessment & Interview Notes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="strengths" className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Key Strength Areas Noticed from Interview
                  </Label>
                  <Textarea
                    id="strengths"
                    value={keyStrengths}
                    onChange={(e) => setKeyStrengths(e.target.value)}
                    placeholder="Key candidate strengths observed during the interview..."
                    className="text-xs min-h-[70px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weaknesses" className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Weakness Areas Noticed from Interview
                  </Label>
                  <Textarea
                    id="weaknesses"
                    value={weaknessAreas}
                    onChange={(e) => setWeaknessAreas(e.target.value)}
                    placeholder="Areas for improvement or potential concerns..."
                    className="text-xs min-h-[70px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interview_comments" className="text-xs font-medium">
                  Comments from Interview
                </Label>
                <Textarea
                  id="interview_comments"
                  value={interviewComments}
                  onChange={(e) => setInterviewComments(e.target.value)}
                  placeholder="General interview notes and panel feedback..."
                  className="text-xs min-h-[75px]"
                />
              </div>
            </div>

            {/* Section 4: Terms & Employment Logistics */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                4. Terms, Logistics & Final Recommendation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="availability" className="text-xs">Availability to Resume</Label>
                  <Input
                    id="availability"
                    value={availabilityToResume}
                    onChange={(e) => setAvailabilityToResume(e.target.value)}
                    placeholder="e.g. Immediate, 2 weeks, 1 month"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="salary_exp" className="text-xs">Salary Expectation</Label>
                  <Input
                    id="salary_exp"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    placeholder="e.g. Expected gross salary"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rec_salary" className="text-xs font-semibold text-primary">
                    Recommended Salary (Gross)
                  </Label>
                  <Input
                    id="rec_salary"
                    value={recommendedSalary}
                    onChange={(e) => setRecommendedSalary(e.target.value)}
                    placeholder="e.g. Recommended gross salary"
                    className="h-8 text-xs bg-background font-semibold border-primary/30"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="recommendation_status" className="text-xs font-semibold">
                    Final Recommendation
                  </Label>
                  <Select value={recommendation} onValueChange={setRecommendation}>
                    <SelectTrigger id="recommendation_status" className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECOMMEND FOR OFFER" className="text-xs font-medium text-emerald-600">
                        RECOMMEND FOR OFFER
                      </SelectItem>
                      <SelectItem value="KEEP IN VIEW" className="text-xs font-medium text-amber-600">
                        KEEP IN VIEW
                      </SelectItem>
                      <SelectItem value="REJECT" className="text-xs font-medium text-rose-600">
                        REJECT
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nysc" className="text-xs">NYSC Status</Label>
                  <Input
                    id="nysc"
                    value={nyscStatus}
                    onChange={(e) => setNyscStatus(e.target.value)}
                    placeholder="e.g. Completed, Exempted, N/A"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="accommodation_status" className="text-xs">Accommodation</Label>
                  <Select value={accommodation} onValueChange={setAccommodation}>
                    <SelectTrigger id="accommodation_status" className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT NEEDED" className="text-xs">
                        NOT NEEDED
                      </SelectItem>
                      <SelectItem value="NEEDED" className="text-xs">
                        NEEDED
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 5: Post-Interview AI Synthesis & Debrief */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  5. AI Post-Interview Debrief & Synthesis
                </h3>
                {postInterviewEvaluation && !analyzing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSaveAndAnalyze(false)}
                    disabled={saving || analyzing}
                  >
                    <RotateCw className="h-3 w-3" />
                    Re-analyze
                  </Button>
                )}
              </div>

              {analyzing ? (
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 flex items-center gap-3 text-xs text-primary font-medium animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">AI is analyzing interview performance...</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Synthesizing initial CV match, 10 rubric competency scores, qualitative notes, CV gap resolutions, and recommended salary.
                    </p>
                  </div>
                </div>
              ) : postInterviewEvaluation ? (
                <div className="space-y-3 rounded-lg border-2 border-primary/30 bg-primary/[0.03] p-4 text-xs">
                  {/* Verdict & Score Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs font-bold px-2.5 py-1 ${
                          postInterviewEvaluation.verdict === "Strong Hire"
                            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                            : postInterviewEvaluation.verdict === "Recommend for Offer"
                            ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                            : postInterviewEvaluation.verdict === "Hire with Reservations"
                            ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                        }`}
                      >
                        {postInterviewEvaluation.verdict}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Combined Hiring Score:
                      </span>
                      <span className="text-sm font-bold text-foreground flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        {postInterviewEvaluation.combined_score}%
                      </span>
                    </div>

                    {postInterviewEvaluation.salary_alignment && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-background/80 px-2 py-1 rounded border border-border/50">
                        <span>Salary Match:</span>
                        <strong className="capitalize text-foreground">
                          {postInterviewEvaluation.salary_alignment.status.replace("_", " ")}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-background/70 p-3 rounded-md border border-border/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Executive Summary & Assessment Debrief
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">
                      {postInterviewEvaluation.executive_summary}
                    </p>
                  </div>

                  {/* Red Flag & CV Gap Resolution */}
                  {postInterviewEvaluation.gap_resolution && postInterviewEvaluation.gap_resolution.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3 text-primary" />
                        CV Gap & Red Flag Resolution
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {postInterviewEvaluation.gap_resolution.map((item, gIdx) => (
                          <div
                            key={gIdx}
                            className="p-2.5 rounded bg-background/80 border border-border/50 flex items-start gap-2 text-xs"
                          >
                            {item.status === "resolved" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : item.status === "partially_resolved" ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-semibold text-foreground text-[11px]">
                                {item.gap}
                              </div>
                              <div className="text-[11px] text-muted-foreground leading-snug">
                                {item.explanation}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Probation Watchlist */}
                  {postInterviewEvaluation.probation_focus_areas && postInterviewEvaluation.probation_focus_areas.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                        Recommended Probation Focus Areas
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {postInterviewEvaluation.probation_focus_areas.map((area, aIdx) => (
                          <span
                            key={aIdx}
                            className="bg-background/80 border border-border/50 px-2 py-0.5 rounded text-[11px] text-foreground font-medium"
                          >
                            • {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="font-medium text-foreground">AI Post-Interview Analysis Not Run Yet</p>
                    <p className="text-muted-foreground text-[11px]">
                      Click "Save & Analyze with AI" below to synthesize interview scores, evaluate CV gap resolutions, and verify hiring readiness.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleSaveAndAnalyze(false)}
                    disabled={saving || analyzing}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Analyze with AI
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium"
                disabled={isExportingPdf || saving || analyzing}
                onClick={handleDownloadPdf}
              >
                {isExportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {isExportingPdf ? "Generating PDF..." : "Download Rubric PDF"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                disabled={saving || analyzing}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
                disabled={saving || analyzing}
                onClick={handleSaveRubricOnly}
              >
                {saving && !analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Only
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 text-xs gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                disabled={saving || analyzing}
                onClick={() => handleSaveAndAnalyze(false)}
              >
                {analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {analyzing ? "Analyzing..." : "Save & Analyze with AI"}
              </Button>

              {onProceedToOffer && recommendation === "RECOMMEND FOR OFFER" && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                  disabled={saving || analyzing}
                  onClick={() => handleSaveAndAnalyze(true)}
                >
                  {saving || analyzing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {saving || analyzing ? "Analyzing with AI..." : "Proceed to Offer"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            OFF-SCREEN PDF TEMPLATE: Styled strictly according to the official Aspom Rubric PDF.
            Rendered offscreen so that html-to-image and jsPDF can measure and capture
            at full fidelity without cluttering the screen or relying on the print dialog.
           ========================================================================= */}
        <div
          aria-hidden="true"
          className="fixed pointer-events-none overflow-hidden"
          style={{ top: 0, left: "-9999px", width: "800px", zIndex: -100 }}
        >
          <div
            id="interview-rubric-pdf-document"
            style={{ width: "800px", backgroundColor: "#ffffff", color: "#000000" }}
            className="bg-white text-black p-8 font-sans"
          >
            {/* Branded Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
              <div className="w-40 h-14 flex items-center">
                <img
                  src="/aspom-logo.png"
                  alt="Aspom Travels"
                  className="h-12 w-auto object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold uppercase tracking-wider font-serif text-black">
                  Interview Rubric
                </h1>
                <p className="text-xs text-gray-700 uppercase">
                  Candidate Assessment & Logistics
                </p>
              </div>
            </div>

            {/* Section 1: APPLICANT'S INFORMATION */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase mb-1 text-black">Applicant's Information</div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Name</td>
                    <td className="border border-black p-2 uppercase font-medium">{applicantName || candidate.name}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Age</td>
                    <td className="border border-black p-2 uppercase">{applicantAge || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Address</td>
                    <td className="border border-black p-2 uppercase">{applicantAddress || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Role Applied For</td>
                    <td className="border border-black p-2 uppercase">{roleAppliedFor || roleTitle}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: REVIEWER'S INFORMATION */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase mb-1 text-black">Reviewer's Information</div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Name</td>
                    <td className="border border-black p-2 uppercase">{reviewerName || "HR Reviewer"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Designation</td>
                    <td className="border border-black p-2 uppercase">{reviewerDesignation || "HR Officer"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Date</td>
                    <td className="border border-black p-2 uppercase">{interviewDate || format(new Date(), "do MMMM yyyy")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: ASSESSMENT */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase mb-1 text-black">Assessment</div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left font-bold uppercase">Assessment Areas</th>
                    <th className="border border-black p-2 text-center font-bold uppercase w-28">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2">Cultural Fit (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.cultural_fit}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Career Motivation (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.career_motivation}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Teamwork (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.teamwork}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Technical Skills (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.technical_skills}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Leadership Capabilities (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.leadership_capabilities}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Self-awareness (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.self_awareness}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Critical Thinking/Problem Solving (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.critical_thinking}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Social Skills (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.social_skills}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Communication (5)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.communication}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Test Score (10)</td>
                    <td className="border border-black p-2 text-center font-bold">{scores.test_score}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-black p-2 uppercase">Total Score (out of 55)</td>
                    <td className="border border-black p-2 text-center text-sm">{totalScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: QUALITATIVE ASSESSMENT */}
            <div className="mb-4">
              <div className="font-bold text-xs uppercase mb-1 text-black">Qualitative Assessment</div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">
                      Key Strengths Noticed
                    </td>
                    <td className="border border-black p-2 uppercase whitespace-pre-line">{keyStrengths || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">
                      Weakness Areas
                    </td>
                    <td className="border border-black p-2 uppercase whitespace-pre-line">{weaknessAreas || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 5: LOGISTICS & RECOMMENDATION */}
            <div>
              <div className="font-bold text-xs uppercase mb-1 text-black">Logistics & Recommendation</div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Availability to Resume</td>
                    <td className="border border-black p-2 uppercase font-medium">{availabilityToResume || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Salary Expectation</td>
                    <td className="border border-black p-2 uppercase font-medium">{salaryExpectation || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Recommended Salary</td>
                    <td className="border border-black p-2 uppercase font-bold">{recommendedSalary || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Comments from Interview</td>
                    <td className="border border-black p-2 uppercase leading-relaxed whitespace-pre-line">
                      {interviewComments || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Recommendation</td>
                    <td className="border border-black p-2 uppercase font-bold">{recommendation}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">NYSC</td>
                    <td className="border border-black p-2 uppercase">{nyscStatus || "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/4 uppercase">Accommodation</td>
                    <td className="border border-black p-2 uppercase">{accommodation}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

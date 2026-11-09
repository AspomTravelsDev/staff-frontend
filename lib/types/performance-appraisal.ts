import type { PeriodCriterion, ReviewerRoute } from "./performance-period";

export type AppraisalStatus = "awaiting_self" | "awaiting_reviewer" | "awaiting_mp" | "completed";
export type Rating = 1 | 2 | 3 | 4 | 5;
export type AppraisalType = "monthly_kpi" | "appraisal";

export interface AppraisalSectionComments {
  job_achievements?: string;
  initiatives_achieved?: string;
  improvement_areas?: string;
  recommendation?: string;
  justification?: string;
  management_comment?: string;
}

export interface AppraisalAnswer {
  criterion_id: string;
  rating: Rating | null;
  comment: string | null;
  evidence: string | null;
}

export interface SelfAssessmentInput {
  version: number;
  comment: string | null;
  section_comments?: AppraisalSectionComments;
  answers: AppraisalAnswer[];
}

export interface AppraisalAssessment extends SelfAssessmentInput {
  id: string;
  assessor_name: string | null;
  stage: "self" | "reviewer" | "supervisor" | "hr" | "compliance" | "mp";
  status: "draft" | "submitted";
  submitted_at: string | null;
  updated_at: string | null;
}

export interface AppraisalSummary {
  id: string;
  employee_name: string;
  employee_staff_id: string;
  department: string;
  is_supervisor: boolean;
  month: string;
  type: AppraisalType;
  submission_deadline: string;
  status: AppraisalStatus;
  reviewer_route: ReviewerRoute;
  reviewer_name: string | null;
  hr_reviewer_name: string | null;
  compliance_reviewer_name: string | null;
  mp_reviewer_name: string;
  self_status: "not_started" | "draft" | "submitted";
  self_version: number;
  self_submitted_at: string | null;
  self_updated_at: string | null;
  can_edit_self: boolean;
  blocked_reason: string | null;
  final_score: string | null;
  total_score: number | null;
  total_max_score: number | null;
}

export interface PerformanceAppraisal extends AppraisalSummary {
  criteria: PeriodCriterion[];
  self_assessment: AppraisalAssessment | null;
  submitted_feedback: AppraisalAssessment[];
}

export interface AppraisalStats {
  total_appraisals: number;
  pending_self_appraisal: number;
  completed_appraisals: number;
  average_rating: number | null;
  last_review_date: string | null;
}

export interface AppraisalAvailability {
  is_open: boolean;
  can_start: boolean;
  month: string | null;
  type?: AppraisalType | null;
  submission_deadline: string | null;
  periods?: { type: AppraisalType; month: string; submission_deadline: string; can_start: boolean }[];
}

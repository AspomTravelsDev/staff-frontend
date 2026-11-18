import type { AppraisalAssessment, AppraisalStatus, AppraisalType } from "./performance-appraisal";
import type { PeriodCriterion, ReviewerRoute } from "./performance-period";

export interface ReviewSummary {
  id: string;
  period_id?: string;
  employee_name: string;
  employee_staff_id: string;
  department: string;
  month: string;
  type: AppraisalType;
  submission_deadline: string;
  reviewer_route: ReviewerRoute;
  reviewer_name: string | null;
  hr_reviewer_name: string | null;
  compliance_reviewer_name: string | null;
  mp_reviewer_name: string;
  status: AppraisalStatus;
  stage: "reviewer" | "supervisor" | "hr" | "compliance" | "mp" | null;
  current_stage: "reviewer" | "supervisor" | "hr" | "compliance" | "mp" | null;
  review_progress: { stage: "self" | "reviewer" | "supervisor" | "hr" | "compliance" | "mp"; status: "waiting" | "ready" | "completed" }[];
  assessment_status: "not_started" | "draft" | "submitted";
  is_assigned: boolean;
  version: number;
  can_review: boolean;
  blocked_reason: string | null;
  final_score: string | null;
  total_score: number | null;
  total_max_score: number | null;
}

export interface ReviewDetail extends ReviewSummary {
  stage: "reviewer" | "supervisor" | "hr" | "compliance" | "mp";
  criteria: PeriodCriterion[];
  assessment: AppraisalAssessment | null;
  preceding_assessments: AppraisalAssessment[];
}

export interface ReviewQueueFilters {
  search: string;
  status: "all" | "in_progress" | "awaiting_reviewer" | "awaiting_mp" | "completed";
  type: "all" | "monthly_kpi" | "appraisal";
  period_id?: string;
  month: string;
  department: string;
  page: number;
}

export interface ReviewQueueResponse {
  items: ReviewSummary[];
  period?: {
    id: string;
    type: AppraisalType;
    month: string;
    status: "draft" | "open" | "closed";
    submission_deadline: string;
  } | null;
  pagination: { page: number; per_page: number; total: number; total_pages: number };
  counts: { ready: number; assigned: number; available: number; completed: number };
  filters: Pick<ReviewQueueFilters, "search" | "status" | "type" | "month" | "department">;
  options: { months: string[]; departments: string[] };
}

export interface ReviewPeriodSummary {
  id: string;
  type: AppraisalType;
  month: string;
  status: "draft" | "open" | "closed";
  submission_deadline: string;
  opened_at: string | null;
  total_submitted: number;
  ready_count: number;
  assigned_count: number;
  completed_count: number;
  in_progress_count: number;
}

export interface ReviewPeriodQueueFilters {
  type: "all" | "monthly_kpi" | "appraisal";
  status: "all" | "open" | "closed" | "draft";
  search: string;
}

export interface ReviewPeriodQueueResponse {
  items: ReviewPeriodSummary[];
  counts: { ready: number; assigned: number; available: number; completed: number };
  filters: ReviewPeriodQueueFilters;
}

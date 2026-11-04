export type ReviewerRoute = "supervisor" | "compliance" | "direct_mp";

export interface PeriodStaff {
  id: string;
  name: string;
  staff_id: string;
  department: string | null;
  is_supervisor: boolean;
  reviewer_route: ReviewerRoute;
  can_review_compliance: boolean;
  can_review_mp: boolean;
}

export interface PeriodAssignment {
  employee_id: string;
  reviewer_id: string | null;
  mp_reviewer_id: string | null;
}

export interface PeriodInput {
  month: string;
  submission_deadline: string;
  assignments: PeriodAssignment[];
  version?: number;
}

export interface PerformancePeriod extends PeriodInput {
  id: string;
  status: "draft" | "open" | "closed";
  version: number;
  opened_at: string | null;
}

export interface PeriodCriterion {
  id: string;
  name: string;
  description: string;
  expectation: string;
  applies_to: "all_staff" | "supervisors";
}

export interface PeriodPreviewItem {
  employee_id: string;
  employee_name: string;
  employee_staff_id: string | null;
  department: string | null;
  is_supervisor: boolean;
  reviewer_route: ReviewerRoute;
  reviewer_id: string | null;
  reviewer_name: string | null;
  mp_reviewer_id: string | null;
  mp_reviewer_name: string | null;
  criteria: PeriodCriterion[];
  issues: string[];
}

export interface PeriodPreview {
  ready: boolean;
  preview_token: string;
  errors: string[];
  items: PeriodPreviewItem[];
}

export interface PeriodDetail {
  period: PerformancePeriod;
  appraisals: Omit<PeriodPreviewItem, "issues">[];
}

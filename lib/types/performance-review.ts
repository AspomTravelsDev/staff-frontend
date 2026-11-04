import type { AppraisalAssessment, AppraisalStatus } from "./performance-appraisal";
import type { PeriodCriterion, ReviewerRoute } from "./performance-period";

export interface ReviewSummary {
  id: string;
  employee_name: string;
  employee_staff_id: string;
  department: string;
  month: string;
  submission_deadline: string;
  reviewer_route: ReviewerRoute;
  reviewer_name: string | null;
  mp_reviewer_name: string;
  status: AppraisalStatus;
  stage: "reviewer" | "mp";
  assessment_status: "not_started" | "draft" | "submitted";
  version: number;
  can_review: boolean;
  blocked_reason: string | null;
  final_score: string | null;
}

export interface ReviewDetail extends ReviewSummary {
  criteria: PeriodCriterion[];
  assessment: AppraisalAssessment | null;
  preceding_assessments: AppraisalAssessment[];
}

import type { AppraisalAssessment, AppraisalType } from "./performance-appraisal";
import type { PeriodCriterion, ReviewerRoute } from "./performance-period";

export interface PerformanceResult {
  id: string;
  employee_name: string;
  employee_staff_id: string;
  department: string;
  is_supervisor: boolean;
  reviewer_route: ReviewerRoute;
  reviewer_name: string | null;
  hr_reviewer_name: string | null;
  compliance_reviewer_name: string | null;
  mp_reviewer_name: string;
  month: string;
  type: AppraisalType;
  final_score: string;
  total_score: number | null;
  total_max_score: number | null;
  completed_at: string;
}

export interface PerformanceResultDetail extends PerformanceResult {
  criteria: PeriodCriterion[];
  assessments: AppraisalAssessment[];
}

export interface PerformanceResultFilters {
  search?: string;
  department?: string;
  type?: "monthly_kpi" | "appraisal";
  month?: string;
  page?: number;
}

export interface PerformanceResultStats {
  completed: number;
  average_score: number | null;
  departments: number;
}

export interface PerformanceResults {
  items: PerformanceResult[];
  pagination: { page: number; per_page: number; total: number; total_pages: number };
  stats: PerformanceResultStats;
  departments: string[];
  months: string[];
}

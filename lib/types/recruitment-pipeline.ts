import type { RecruitmentCandidate, RecruitmentRole } from "./recruitment";
import type {
  PracticalModule,
  AssessmentQuestion,
} from "./applicant-assessment";

export const pipelineStages = [
  "cv_screening",
  "call_screening",
  "oral_interview",
  "written_exam",
  "practical",
  "management_review",
  "offer_preparation",
] as const;
export type PipelineStage = (typeof pipelineStages)[number];
export const pipelineLabels: Record<PipelineStage, string> = {
  cv_screening: "CV screening",
  call_screening: "Call screening",
  oral_interview: "Oral interview",
  written_exam: "Written exam",
  practical: "Practical exercise",
  management_review: "Ready for management review",
  offer_preparation: "Offer & onboarding",
};
export interface PipelineSettings {
  track: string;
  custom_questions: string[];
  thresholds: {
    oral_interview: number;
    written_exam: number;
    practical: number;
  };
  statuses?: Partial<Record<PipelineStage, string[]>>;
}
export interface PipelineDefinition extends PipelineSettings {
  version: string;
  track_name: string;
  weights: { oral_interview: number; written_exam: number; practical: number };
  statuses: Record<PipelineStage, string[]>;
  oral_questions: AssessmentQuestion[];
  written_questions: { id: string; text: string; guide: string }[];
  computer_criteria: { id: string; label: string; guide: string }[];
  practical_modules: PracticalModule[];
  graduate: boolean;
}
export interface PipelinePayload {
  manual_review?: boolean;
  review_note?: string;
  grades?: Record<string, number | null>;
  notes?: string;
  custom_status?: string;
  scheduled_at?: string | null;
  interview_mode?: "Virtual" | "Physical" | null;
  reviewed?: boolean;
  salary_expectation?: number | null;
  location?: string;
  age?: number | null;
  nysc_status?: string;
  accommodation?: string;
  notice_period?: string;
  compatibility?: "Compatible" | "Needs discussion" | "Not compatible";
  recommendation?: string;
  advancement_note?: string;
  strengths?: string;
  concerns?: string;
}
export interface PipelineResults {
  manual_review?: boolean;
  score_100: number | null;
  threshold: number | null;
  passed: boolean | null;
  missing: string[];
  checks: { label: string; passed: boolean }[];
  salary_advice: string | null;
}
export interface PipelineRecord {
  id: string;
  stage: PipelineStage;
  state: "draft" | "completed" | "skipped";
  definition: PipelineDefinition;
  payload: PipelinePayload;
  results: PipelineResults;
  updated_by: { id: string; name: string };
  updated_at: string;
}
export interface PipelineContext {
  candidate: RecruitmentCandidate;
  role: RecruitmentRole;
  definition: PipelineDefinition;
  records: PipelineRecord[];
  stages: Record<PipelineStage, string>;
  final_score: number | null;
  events: {
    id: string;
    event: string;
    from_stage: PipelineStage;
    to_stage: PipelineStage;
    reason: string | null;
    follow_up_date: string | null;
    actor: { name: string };
    created_at: string;
  }[];
}

export type ManagementDecisionType = "approve" | "hold" | "return" | "decline";
export interface ManagementDecision {
  decision: ManagementDecisionType;
  reason: string | null;
  follow_up_date: string | null;
  actor: { id: string; name: string };
  created_at: string;
}
export interface ManagementReview {
  offer_status?:string;
  review: {
    id: string;
    candidate_id: string;
    version: number;
    created_at: string;
    submitted_by: { id: string; name: string };
    snapshot: {
      candidate: Pick<
        RecruitmentCandidate,
        | "id"
        | "name"
        | "email"
        | "phone"
        | "ai_score"
        | "ai_summary"
        | "ai_evaluation"
      >;
      role: Pick<
        RecruitmentRole,
        | "id"
        | "title"
        | "department"
        | "salary_budget_min"
        | "salary_budget_max"
        | "job_description"
      >;
      records: PipelineRecord[];
      final_score: number | null;
      events: PipelineContext["events"];
    };
  };
  updated_since_submission: boolean;
  is_latest: boolean;
  can_decide: boolean;
  outcome: string;
  decision: ManagementDecision | null;
  history: {
    id: string;
    version: number;
    created_at: string;
    submitted_by: { name: string };
    decision: ManagementDecision | null;
  }[];
}
export interface ManagementShortlist {
  role: Pick<
    RecruitmentRole,
    "id" | "title" | "department" | "salary_budget_min" | "salary_budget_max"
  >;
  candidates: {
    id: string;
    name: string;
    email: string | null;
    overall: number | null;
    scores: Partial<Record<PipelineStage, number | null>>;
    recommendation: string;
    salary_expectation: number | null;
    notice_period: string | null;
    version: number;
    submitted_at: string;
    decision: ManagementDecision | null;
    outcome: string;
  }[];
}

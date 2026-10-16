export type AssessmentSection =
  | "general"
  | "interview"
  | "talent"
  | "role"
  | "practical"
  | "expectations"
  | "candidate_questions"
  | "closing";
export interface AssessmentQuestion {
  id: string;
  text: string;
  section: AssessmentSection;
  track: string | null;
  scored: boolean;
  competency: string | null;
  scoring_section?: AssessmentSection;
  custom?: boolean;
  anchors: Record<string, string> | null;
  follow_ups: string[];
}
export interface AssessmentTrack {
  id: string;
  name: string;
  recommended: { general: string[]; talent: string[]; role: string[] };
  practical_modules?: PracticalModule[];
  assessment_weights?: Partial<Record<AssessmentSection, number>>;
}
export interface PracticalCriterion {
  id: string;
  label: string;
  max: number;
  required?: boolean;
  minimum?: number;
  guide?: string;
}
export interface PracticalModule {
  id: string;
  name: string;
  duration_minutes: number;
  minimum_score: number;
  scenario: string;
  tasks: string[];
  criteria: PracticalCriterion[];
  assessor_guide: string;
}
export interface AssessmentBank {
  version: string;
  schema_version: number;
  competencies: Record<string, string>;
  tracks: AssessmentTrack[];
  questions: AssessmentQuestion[];
  intro: string;
  guidance: string;
}
export interface AssessmentDefinition {
  bank_version: string;
  schema_version: number;
  track: AssessmentTrack;
  competencies: Record<string, string>;
  weights: Partial<Record<AssessmentSection, number>>;
  decision_rules?: {
    score_bands: { strong_hire: number; hire: number; hold: number };
    critical_competencies: Record<string, number>;
  };
  practical_module?: {
    id: string;
    name: string;
    minimum_score: number;
    criteria: PracticalCriterion[];
  } | null;
  practical_modules?: PracticalModule[];
  questions: AssessmentQuestion[];
  intro: string;
  guidance: string;
}
export interface AssessmentPlan {
  id: string;
  recruitment_role_id: string;
  track: string;
  definition: AssessmentDefinition;
  revision: number;
  locked_at: string | null;
}
export interface CustomAssessmentQuestion {
  id: string;
  text: string;
  competency: string;
}
export interface AssessmentConfiguration {
  custom_questions?: CustomAssessmentQuestion[];
  track: string;
  question_ids: string[];
  practical: boolean;
}
export interface AssessmentAnswer {
  question_id: string;
  score: number | null;
  notes: string;
}
export interface HiringReview {
  reviewer_designation: string;
  availability_to_resume: string;
  salary_expectation: number | null;
  recommended_salary: number | null;
  nysc_status: string;
  accommodation: string;
}
export interface AssessmentDraft {
  answers: AssessmentAnswer[];
  practical_marks: Record<string, number | null>;
  unscored_responses: Record<string, string>;
  interviewer_name: string;
  interview_date: string;
  strengths: string;
  concerns: string;
  recommendation: string;
  rationale: string;
  hiring_review: HiringReview;
}
export interface AssessmentResults {
  practical_tasks?: {id: string; name: string; maximum: number; earned: number | null; complete: boolean}[];
  sections: Record<
    string,
    { weight: number; average: number | null; count: number }
  >;
  competencies: Record<
    string,
    { name: string; average: number | null; count: number }
  >;
  completed: number;
  total: number;
  missing: string[];
  overall: number | null;
  score_100: number | null;
  gates?: {
    passed: boolean | null;
    items: {
      type: "competency" | "practical";
      id: string;
      label: string;
      minimum: number;
      actual: number | null;
      passed: boolean;
    }[];
  };
  decision_guidance?: "Strong hire" | "Hire" | "Hold" | "Do not hire" | null;
}
export interface AssessmentActor {
  id: string | null;
  name: string;
}
export interface AssessmentRevision {
  id: string;
  revision: number;
  event: "submitted" | "reopened";
  reason: string | null;
  actor: AssessmentActor;
  created_at: string;
  snapshot?: ApplicantAssessment | null;
}
export interface ApplicantAssessment {
  id: string;
  candidate_id: string;
  plan_snapshot: AssessmentDefinition;
  state: "draft" | "submitted";
  answers: AssessmentAnswer[];
  practical_marks: Record<string, number | null>;
  unscored_responses: Record<string, string>;
  interviewer: AssessmentActor;
  interview_date: string;
  strengths: string | null;
  concerns: string | null;
  recommendation: string | null;
  rationale: string | null;
  hiring_review: HiringReview | null;
  results: AssessmentResults;
  revision: number;
  created_by: AssessmentActor;
  updated_by: AssessmentActor;
  submitted_by: AssessmentActor | null;
  submitted_at: string | null;
  updated_at: string;
  revisions?: AssessmentRevision[];
}
export interface AssessmentContext {
  assessment: ApplicantAssessment | null;
  candidate: {
    id: string;
    name: string;
    status: string;
    recruitment_role_id: string;
  };
  role: { id: string; title: string; department: string };
}
export type AssessmentActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode: string };
export const assessmentSectionNames: Record<AssessmentSection, string> = {
  interview: "Structured interview",
  general: "General",
  talent: "Universal talent",
  role: "Role-specific",
  practical: "Practical exercise",
  expectations: "Company & expectations",
  candidate_questions: "Candidate questions",
  closing: "Closing",
};

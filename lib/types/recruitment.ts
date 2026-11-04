export type CandidateStatus =
  | "reviewing"
  | "shortlisted"
  | "interviewing"
  | "offered"
  | "accepted"
  | "rejected";

export type RoleStatus = "active" | "paused" | "closed";

export interface InterviewProbe {
  category: string;
  cv_trigger: string;
  question: string;
  what_to_listen_for: string;
}

export interface PostInterviewEvaluation {
  verdict: "Strong Hire" | "Recommend for Offer" | "Hire with Reservations" | "Do Not Recommend" | string;
  combined_score: number; // 0-100
  gap_resolution: Array<{
    gap: string;
    status: "resolved" | "partially_resolved" | "unresolved" | string;
    explanation: string;
  }>;
  executive_summary: string;
  salary_alignment?: {
    status: "aligned" | "exceeds_expectation" | "below_expectation" | string;
    notes: string;
  };
  probation_focus_areas: string[];
  analyzed_at?: string;
}

export interface CandidateAiEvaluation {
  criteria?: { requirement: string; status: "met" | "not_shown" | "unclear"; evidence: string }[];
  analysis_version?: string;
  analyzed_at?: string;
  usage?: { input_tokens?: number; output_tokens?: number; reasoning_tokens?: number; elapsed_ms?: number; model?: string };
  failure_code?:string;
  status?: "not_requested" | "completed" | "failed" | "pending" | "processing";
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  years_of_experience?: number | null;
  skills: string[];
  match_score: number | null;
  recommendation: "Strong Match" | "Potential Match" | "Not Recommended" | string;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggested_interview_questions: string[];
  interview_probes?: InterviewProbe[];
  suggested_rubric_scores?: {
    technical_skills: number;
    teamwork: number;
    leadership_capabilities: number;
    critical_thinking_problem_solving: number;
  };
}

export interface RubricAssessmentScores {
  cultural_fit: number; // 1-5
  career_motivation: number; // 1-5
  teamwork: number; // 1-5
  technical_skills: number; // 1-5
  leadership_capabilities: number; // 1-5
  self_awareness: number; // 1-5
  critical_thinking: number; // 1-5
  social_skills: number; // 1-5
  communication: number; // 1-5
  test_score: number; // 1-10
  total_score: number; // calculated sum out of 55
}

export interface InterviewRubric {
  applicant_info: {
    name: string;
    age: string;
    address: string;
    role_applied_for: string;
  };
  reviewer_info: {
    name: string;
    designation: string;
    date: string;
  };
  scores: RubricAssessmentScores;
  qualitative: {
    key_strengths?: string;
    weakness_areas?: string;
    comments_from_interview?: string;
  };
  logistics: {
    availability_to_resume: string;
    salary_expectation: string;
    recommended_salary: string;
    recommendation: "RECOMMENDED" | "KEEP IN VIEW" | "NOT RECOMMENDED" | string;
    nysc_status: string;
    accommodation: string;
  };
  saved_at?: string;
  saved_by?: {
    id: string;
    name: string;
  };
}

export interface RecruitmentOfferApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  position_title: string;
  employment_terms: {
    gross_salary?: number;
    effective_date?: string;
    reporting_to?: string;
    is_tax_exempt?: boolean;
  };
  offer: { state?: string; sent_at?: string };
}

export interface RecruitmentCandidate {
  duplicate_email?: boolean;
  email_summary?: { pending: boolean; status: string | null; event_id: string | null };
  offer_application?: RecruitmentOfferApplication | null;
  management_review_summary?: {version:number;submitted_at:string;decision:"approve"|"hold"|"return"|"decline"|null}|null;
  pipeline_stage?: import("./recruitment-pipeline").PipelineStage | null;
  pipeline_outcome?: "active"|"hold"|"rejected"|"withdrawn";
  pipeline_revision?:number;
  pipeline_summary?: {
    salary_expectation?:number|null;
    score_100: number | null;
    stage_score: number | null;
    stage_scores?: Record<string, number | null>;
    status: string | null;
    state?: "draft" | "completed" | "skipped";
    passed?: boolean | null;
    started?: boolean;
    answered?: number;
    total?: number;
  };
  assessment_summary?: {
    state: "draft" | "submitted"; completed: number; total: number;
    score_100: number | null; recommendation: string | null; submitted_at: string | null;
    hiring_review?: {
      reviewer_designation: string; availability_to_resume: string;
      salary_expectation: number | null; recommended_salary: number | null;
      nysc_status: string; accommodation: string;
    } | null;
  } | null;
  id: string;
  recruitment_role_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cv_file_path: string;
  cv_original_name: string;
  cv_extracted_text: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  ai_evaluation: CandidateAiEvaluation | null;
  status: CandidateStatus;
  notes: string | null;
  interview_rubric?: InterviewRubric | null;
  post_interview_evaluation?: PostInterviewEvaluation | null;
  ai_suggested_rubric_scores?: {
    technical_skills: number;
    teamwork: number;
    leadership_capabilities: number;
    critical_thinking_problem_solving: number;
  };
  onboarding_application_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
  };
  onboarding_application?: {
    id: string;
    application_id: string;
    status: string;
  } | null;
}

export interface InterviewPreparation {
  status: "processing" | "completed" | "stale" | "failed";
  probes?: InterviewProbe[];
  generated_at?: string;
  reused?: boolean;
}

export interface RecruitmentRole {
  pipeline_config?: import("./recruitment-pipeline").PipelineDefinition | null;
  pipeline_locked_at?:string|null;
  salary_budget_min?:number|null;
  salary_budget_max?:number|null;
  assessment_plan_summary?: {
    track_name: string; question_count: number; general_count: number;
    practical: boolean; locked: boolean;
  } | null;
  id: string;
  hr_request_id: string | null;
  title: string;
  department: string;
  openings_count: number;
  employment_type: string;
  job_description: string | null;
  custom_instructions: string | null;
  status: RoleStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    role: string;
  };
  hr_request?: {
    id: string;
    request_type: string;
    department: string;
    quantity: number;
    status: string;
    reason: string;
  } | null;
  total_candidates?: number;
  pipeline_interview_count?:number;
  reviewing_count?: number;
  shortlisted_count?: number;
  interviewing_count?: number;
  offered_count?: number;
  accepted_count?: number;
  rejected_count?: number;
}

export interface RoleDetailResponse {
  pipeline_prefills?: Record<string, import("./recruitment-pipeline").PipelinePrefill>;
  management_only?: boolean;
  role: RecruitmentRole;
  candidates: RecruitmentCandidate[];
  stats: {
    total: number;
    reviewing?: number;
    shortlisted?: number;
    interviewing?: number;
    offered?: number;
    accepted?: number;
    rejected?: number;
    // Pipeline board stats
    active?: number;
    on_hold?: number;
    ready_for_review?: number;
    stage_counts?: Record<string, number>;
    avg_score?: number | null;
  };
}

export interface OnboardCandidatePayload {
  applicant_name: string;
  applicant_email: string;
  position_title: string;
  reporting_to?: string;
  effective_date: string;
  salary_gross: number;
  is_tax_exempt?: boolean;
  salary_breakdown: {
    basic_salary: number;
    housing_allowance: number;
    transport_allowance: number;
    utility_allowance: number;
    statutory_tax_deduction?: number;
    net_salary?: number;
    [key: string]: any;
  };
}

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
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  years_of_experience?: number | null;
  skills: string[];
  match_score: number;
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
    recommendation: "RECOMMEND FOR OFFER" | "KEEP IN VIEW" | "REJECT" | string;
    nysc_status: string;
    accommodation: string;
  };
  saved_at?: string;
  saved_by?: {
    id: string;
    name: string;
  };
}

export interface RecruitmentCandidate {
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

export interface RecruitmentRole {
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
  reviewing_count?: number;
  shortlisted_count?: number;
  interviewing_count?: number;
  offered_count?: number;
  accepted_count?: number;
  rejected_count?: number;
}

export interface RoleDetailResponse {
  role: RecruitmentRole;
  candidates: RecruitmentCandidate[];
  stats: {
    total: number;
    reviewing: number;
    shortlisted: number;
    interviewing: number;
    offered: number;
    accepted: number;
    rejected: number;
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

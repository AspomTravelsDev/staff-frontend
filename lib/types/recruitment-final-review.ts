export interface RecruitmentFinalReview {
  revision: number;
  ready: boolean;
  hr_comments: string;
  hr_updated_by: { id: string; name: string } | null;
  hr_updated_at: string | null;
  ai: null | {
    strengths: string[];
    weaknesses: string[];
    comments: string;
    missing_evidence: string[];
    generated_at: string;
    generated_by: { id: string; name: string };
    evidence_hash: string;
  };
  ai_stale: boolean;
}

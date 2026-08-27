"use server";

import { api } from "./client";

export interface FlaggedClaim {
  original_text: string;
  category?: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  suggested_rewording: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  error_type: string;
}

export interface VisualQuality {
  score: number;
  readability_feedback: string;
  contrast_feedback: string;
}

export interface ComplianceReport {
  overall_score: number;
  status: "COMPLIANT" | "NEEDS_REVISION" | "HIGH_RISK" | string;
  summary: string;
  detected_text: string;
  flagged_claims: FlaggedClaim[];
  grammar_and_spelling: GrammarCorrection[];
  visual_quality: VisualQuality;
}

export async function checkAdCompliance(formData: FormData): Promise<ComplianceReport> {
  const result = await api.post<{ success: boolean; data: ComplianceReport }>(
    "/api/social-media/compliance-check",
    formData
  );

  if (!result.success) {
    throw new Error(result.error.error || "Failed to analyze marketing compliance");
  }

  return result.data.data;
}

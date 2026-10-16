import type { RecruitmentCandidate } from "@/lib/types/recruitment";

export function cvAnalysisFailureMessage(
  candidate: RecruitmentCandidate,
): string {
  const code = candidate.ai_evaluation?.failure_code;
  if (code === "text_extraction_failed")
    return "No readable CV text was extracted. Scanned PDFs need OCR or a text-based PDF/DOCX. You can review the original CV manually.";
  if (code === "missing_api_key")
    return "AI screening is not configured. Ask the portal administrator to check the recruitment AI key, or review the CV manually.";
  if (code === "cv_text_too_long")
    return "This CV contains too much text for automatic screening. Review it manually or upload a shorter CV.";
  if (code === "provider_http_429")
    return "The AI provider's rate limit was reached. Retry later or review the CV manually.";
  if (code === "provider_http_401" || code === "provider_http_403")
    return "The AI provider rejected access. The portal administrator needs to check the key and permissions. You can review the CV manually.";
  return "AI analysis could not finish. Retry analysis or review the original CV manually.";
}

export function cvEvaluationFailed(candidate: RecruitmentCandidate): boolean {
  return (
    candidate.ai_evaluation?.status === "failed" ||
    candidate.ai_evaluation?.summary?.includes(
      "Automated AI scoring was unavailable",
    ) === true
  );
}
export function cvEvaluationScore(
  candidate: RecruitmentCandidate,
): number | null {
  return cvEvaluationFailed(candidate) ||
    ["pending", "processing"].includes(candidate.ai_evaluation?.status ?? "")
    ? null
    : candidate.ai_score;
}

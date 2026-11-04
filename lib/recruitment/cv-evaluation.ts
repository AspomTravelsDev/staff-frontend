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
  if (code === "analysis_timeout")
    return "AI analysis exceeded its time limit. Retry the analysis or review the original CV manually.";
  if (code === "provider_http_429")
    return "The AI provider's rate limit was reached. Retry later or review the CV manually.";
  if (code === "provider_http_401" || code === "provider_http_403")
    return "The AI provider rejected access. The portal administrator needs to check the key and permissions. You can review the CV manually.";
  if (code === "provider_dns")
    return "The portal server could not find the AI provider's address. Ask IT to check the server's internet and DNS connection, then retry.";
  if (code === "provider_tls")
    return "The portal server could not establish a secure connection to the AI provider. Ask IT to check its certificates, then retry.";
  if (code === "provider_timeout")
    return "The AI provider took too long to respond. Retry shortly or review the CV manually.";
  if (code === "provider_connection")
    return "The portal server could not connect to the AI provider. Ask IT to check the connection, then retry or review the CV manually.";
  if (code === "provider_http_404")
    return "The configured AI model or endpoint is unavailable. Ask the portal administrator to check the recruitment AI settings.";
  if (code === "provider_http_400" || code === "provider_http_422")
    return "The AI provider rejected the analysis request. Ask the portal administrator to check the model and request settings.";
  if (code && /^provider_http_5\d\d$/.test(code))
    return "The AI provider is temporarily unavailable. Retry shortly or review the CV manually.";
  if (code === "invalid_response")
    return "The AI provider returned an incomplete or unreadable analysis. No score was saved. Retry or review the CV manually.";
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

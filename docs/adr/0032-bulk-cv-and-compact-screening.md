# ADR-0032: Bulk CV intake and compact, reusable screening

Accepted, 2026-11-01. Extends ADR-0015 and ADR-0030.

## Decision

Keep the existing Laravel candidate upload and on-demand screening endpoints. The client accepts up to 20 CVs per intake session, uploads each in its own request (15 MB per file), and retains per-file successes/errors with retry of failed files only. Upload requests carry an idempotency UUID; a role lock serializes duplicate checks. Exact CV hashes and supplied email matches are flagged before creation, with an explicit Upload anyway choice. Extracted matching email addresses are flagged in the role table after screening; records are never silently merged.

HR selects applicants and runs Analyze selected through a bounded client queue. Individual backend analysis requests remain synchronous and independent of worker availability, as required by ADR-0015. Uploading pipeline CVs never starts AI. Existing assessment, decision and email flows remain unchanged.

A compact screening contract returns candidate contact information, a short summary, CV match score, up to three strengths/gaps and up to eight essential requirements with CV evidence or an explicit not-shown/unclear status. Detailed interview probes are generated separately on HR request. CV-based interview rubric suggestions are removed. Keep the configured provider/model; supported model-specific reasoning controls and bounded response sizes reduce generation work. Record provider token usage and elapsed time when available, without logging CVs or credentials.

Cache successful screening by the complete extracted CV text, relevant role requirements/instructions, provider/model and screening contract/settings version. A repeated unchanged request returns the saved result without provider work. Role changes invalidate reuse, including changes during a running request. Candidate locks prevent overlapping screening runs; generation checks prevent delayed responses overwriting newer evidence. Extraction is saved before a provider call and reused on retry. Cleanup removes whitespace/page markers/repeated contact footers conservatively and never silently truncates substantive CV content.

Interview preparation is stored separately with its evidence fingerprint and reused until the CV/role/screening changes. This new transfer is restricted to the previously approved Google Gemini HTTPS host and disallows redirects. Interrupted preparation becomes retryable after its processing deadline. The final AI review keeps its canonical full-evidence fingerprint while sending shared stage definitions once and compact CV analysis fields. This preserves historical definitions and original evidence while removing repeated payload content.

## Validation and rollout

Apply migration 2026_11_01_000004_add_recruitment_cv_intake_metadata.php. Verify duplicate confirmation and idempotent upload retries, partial batch failures, selection limits, cache hits/invalidation, overlap guards, short provider schemas/reasoning settings, conservative text cleanup, preparation freshness and unchanged recruitment gates. Compare input sizes and validate representative screening outputs; do not claim measured live-model cost or quality improvements without provider benchmarks.

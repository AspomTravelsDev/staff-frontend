# ADR-0015: On-demand CV analysis

## Status

Accepted, 2026-10-23. Supersedes the queued execution path in ADR-0006.

## Decision Drivers

- Queued recruitment analyses can remain pending when a worker is unavailable or misconfigured.
- HR should decide when an applicant's CV is sent for AI analysis.
- Failed requests must be visible and retryable without blocking manual HR review.
- Provider credentials and CV text must remain on the backend.

## Considered Options

1. Keep queue-based automatic analysis and improve worker monitoring.
2. Run analysis synchronously when HR explicitly selects Analyze CV.
3. Run analysis synchronously during upload.

## Decision Outcome

**Chosen option**: In the five-stage recruitment pipeline, run analysis synchronously only after an HR user selects Analyze CV. Uploading a CV saves the applicant and source file without starting AI work. Retry uses the same on-demand endpoint. Legacy recruitment roles retain their existing synchronous-on-upload flow. The backend keeps bounded provider request timeouts, persists extracted text before calling the provider, records failures, and allows manual review when no score exists.

### Positive Consequences

- No CV analysis depends on queue-worker availability.
- HR controls when provider requests are made and sees the result or failure in the same action.
- Pipeline CV upload remains fast and does not hold the request open during AI analysis.

### Negative Consequences

- HR waits for the provider request when explicitly starting an analysis.
- A hosting HTTP timeout can interrupt a slow request; the bounded provider timeout and persisted processing state limit the impact, and stale analyses are marked failed and can be retried.
- Pipeline analyses no longer start automatically on upload.

## Validation

Uploading a CV to a five-stage role leaves analysis in `not_requested`. Selecting Analyze CV runs extraction and analysis in the request, then returns a completed or failed result. A request exceeding its processing deadline becomes failed rather than pending indefinitely. Retry and manual-review flows remain available. Legacy role uploads retain their existing synchronous analysis behavior.

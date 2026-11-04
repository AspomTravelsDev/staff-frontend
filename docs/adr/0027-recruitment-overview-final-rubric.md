# ADR-0027: Candidate overview, document library and final rubric

Accepted, 2026-11-01.

## Decision

Candidate names and View actions open a complete overview with contact details, saved stage results, explicit pass/fail or draft state, evidence, decision history, CV analysis and final review. CV score links still open the detailed CV analysis. Advancing by exception preserves the failed assessment result. Call screening remains unscored and uses HR's saved compatibility assessment.

Active assessment forms expose Reject & review email. This flushes autosaved evidence before opening the existing decision dialog with rejection selected. HR records a reason, the backend saves the rejection, and the existing candidate email review opens. Rejection never requires an advancement exception note, completes an unfinished assessment or sends an email automatically.

The document dialog lists every stage with Filled and Blank columns. Saved reports require available evidence; draft reports are labelled incomplete. Written question papers remain distinct from HR marking guides. A final recruitment rubric consolidates stage results, any previously recorded interview competency marks, separately attributed AI findings and HR final comments. Missing competency marks are never derived from stage scores. Blank documents omit saved private evidence. Official offers remain in the approved offer workflow.

An optional candidate final_review JSON value stores a separate revision, HR comments with author/time, and AI findings with author/time and an evidence fingerprint. Saving comments never overwrites AI findings, and generation never overwrites HR comments. Concurrent writes and changed evidence during generation return a conflict. Changed source evidence marks saved AI findings outdated, including on exports. Final-review comments are supplemental material; they do not alter existing immutable management submissions, stage scores, management approvals or hiring outcomes.

The user explicitly approved sending CV text, recorded stage scores/notes, rubric and recruitment decisions to Google Gemini at generativelanguage.googleapis.com on 2026-11-01. Transfer occurs only when HR requests Generate AI review. The feature accepts only HTTPS on that hostname, refuses redirects and has no alternative-provider fallback. It reuses the configured recruitment AI credentials, model and bounded request/retry transport. Findings contain strengths, weaknesses, comments and missing evidence; no AI scores or hire/reject decisions are accepted. Provider failure preserves the previous review and HR comments instead of fabricating findings. Source evidence is bounded, and prompt text treats candidate content as data.

## Deployment and validation

Apply backend migration 2026_11_01_000002_add_final_review_to_recruitment_candidates.php. No queue or new third-party dependency is required. Tests cover document availability and blank privacy, unrecorded marks, independent comments, approved destination, malformed AI responses, in-flight evidence changes, permissions, rejection autosave and email handoff, and overview result semantics. Synthetic final PDFs are rendered and inspected before completion.

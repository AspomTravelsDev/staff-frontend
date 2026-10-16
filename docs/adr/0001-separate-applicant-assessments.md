# ADR-0001: Separate applicant assessments within recruitment

Date: 2026-10-13

## Status

Accepted and implemented. The user requested separation from the rubric, confirmed HR/leadership access, and authorized implementation. Local verification and migration completed on 2026-10-13.

## Context

The existing Laravel/Next.js recruitment feature stores a fixed /55 rubric and a related AI debrief. The supplied interview guide requires question-level evidence, weighted section scores, competency summaries, and stable historical results. Changing the rubric schema would also change its existing UI, exports, and AI interpretation.

## Decision

Add Applicant Assessment as a separate feature owned by recruitment. Use existing Laravel/Eloquent/REST and Next.js server-action patterns. Persist vacancy plans, candidate assessments, and submission/reopen history in separate tables; use validated JSON for bounded question definitions and answers. Freeze the vacancy plan on first use and snapshot it into each assessment. Calculate results on the server, with revision checks and transactional transitions. Reuse `manage-recruitment` for HR and leadership access. Keep one shared assessment per candidate in the first release.

The assessment does not write to `interview_rubric`, `post_interview_evaluation`, or `ai_score`, and does not trigger candidate status changes. Full implementation details and release defaults are in [the plan](../plans/applicant-assessment.md).

Role creation now optionally accepts assessment configuration in the same REST request. The portal uses a two-step form and supplies it for every new vacancy; role and plan persistence share one transaction. Other existing callers may omit assessment configuration for compatibility. Both creation and later editing use the same validation, definition builder, and plan persistence service.

All six General questions are mandatory in new or updated question sets. An unused legacy plan adds any missing General questions transactionally on first assessment start. Locked plans and existing assessment snapshots are preserved. Question bank version 2026-10-13.2 records the new default selection policy. No schema migration is required for these changes.

## Alternatives and trade-offs

- Extend rubric JSON: less initial storage work but couples two score systems and risks changing historical meaning. Rejected for this release and contrary to the user's separation requirement.
- Add another single candidate JSON attribute: simple persistence, but ownership, concurrent draft saves, immutable results, and future interview rounds become harder to manage. Dedicated records provide explicit lifecycle boundaries.
- Normalize every question/answer into tables: useful for future analytics, but unnecessary joins and schema surface for the current bounded documents. Defer until reporting requirements justify it.

Costs: three additive tables, dedicated validation/scoring/lifecycle code, and new content-calibration work. Frozen vacancy plans deliberately limit mid-campaign customization to preserve comparability. Benefits: independent rollout, no rubric migration, reproducible scores, and a path to future panel/round features.

## Validation and enforcement

Feature tests verify gate coverage, interviewing-only writes, snapshot stability, immutable submission history, revision conflicts, and rubric isolation. Scoring tests use fixed expected results and missing-data cases. Existing recruitment regression tests guard offers/onboarding and AI/rubric behaviour. Review new code against this boundary; reject cross-writes and move assessment-specific logic into the assessment service if violations appear.

## Interview workflow refinements (2026-10-13)

New setups enable the first practical task by default. General questions remain mandatory and are summarized without a selector. HR can add up to 20 custom role questions, each with a stable custom ID and one existing competency; all scored questions together remain capped at 80. Custom definitions are validated and stored in the existing plan JSON, frozen and snapshotted with the bank questions. They share the role section weight; no new database tables or bank mutation are needed.

Question notes are optional in drafts and submissions. Completion and overall scores depend on ratings only; recommendation and overall rationale remain required at final submission. HR can add notes before submission or use the existing audited reopen flow afterward. The common scoring scale is shown once beside the interview; distinct question-specific anchors remain available on demand.

Failed initial CV evaluations use the existing evaluation JSON with status `failed` and null score. Malformed provider responses and absent CV text also fail without invented grades. Successful retries replace the failed evaluation. Recognizable historical fallback results are exposed without their synthetic 60% score; genuine 60% results remain intact. This is independent of Applicant Assessment and the existing post-interview rubric.

## Unified interview and hiring review (2026-10-13)

New Applicant Assessments are the single record for an interview and its hiring decision. The question scores replace the legacy `/55` rubric scores. Existing assessment fields retain strengths, concerns, recommendation, rationale, interviewer, and interview date. A bounded `hiring_review` document records only offer-relevant logistics: reviewer designation, availability, salary expectation, recommended salary, NYSC status, and accommodation requirement.

Submitted assessments provide the source for the post-interview AI debrief and for pre-filling an offer. A candidate with a configured assessment plan must submit it before an offer can be started. Historical rubric-only candidates remain readable, analyzable, and offerable through the legacy path; they are not migrated or rewritten. This supersedes the earlier independence rule only for new assessment-plan candidates, and avoids asking HR to enter equivalent interview information twice.

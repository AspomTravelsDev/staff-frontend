# ADR-0005: Submitted management review briefs

## Status

Offer preparation and dispatch are subsequently enabled by ADR-0007; approval now hands the applicant back to HR in Offer & onboarding.

Accepted, 2026-10-15. Extends ADR-0004 beyond the deferred management-review boundary; offer generation remains deferred.

## Decision

HR prepares a brief at the existing management-review stage, using its recommendation, optional strengths/concerns and overall interview notes. Submission atomically completes that stage and creates an immutable numbered copy of the role requirements/budget, CV analysis, stage definitions, marks, recorded notes, assessors, weighted score and progression history. All preceding stages must be completed or explicitly skipped; missing scores are not replaced or renormalised.

A separate management-review service owns submission snapshots and management decisions. It uses the existing pipeline service for evidence and score calculation. The workflow service remains responsible for HR grading and stage progression. All writes lock role then candidate, matching existing recruitment writes.

Management sees submitted candidates in the same role workspace, through a shortlist view and a wide sheet with Summary, Assessments, CV and History tabs. HR can view the same submitted evidence. Existing optional notes are presented as recorded evidence, not transcripts. External written/practical submissions remain outside the portal. AI screening remains advisory; this release does not generate new narrative summaries.

New permissions distinguish `edit-recruitment-assessments` (HR/Super) from `review-recruitment` (MP/MD/Super), including secondary roles. Existing recruitment access remains the entry gate. New-flow leadership views expose submitted candidates and do not expose editable HR stage endpoints. Standalone rubric generation remains available.

Management can approve for offer preparation, hold with a reason/follow-up date, return to HR with next steps, or decline with a reason. One decision is recorded per submitted version, with actor/time. Approval does not create an offer or onboarding application. Holds and declines update the applicant outcome; returning reopens HR's brief. Resuming a held final review reopens the brief for resubmission. Earlier versions and their decisions remain accessible.

An evidence fingerprint detects changes to stage content, definitions, CV analysis or role requirements/budget after submission. Changed, historical, inactive or already-decided submissions cannot receive new decisions. HR must reopen/update and resubmit; a stale review identifier is rejected. Candidate revision increments and review decisions themselves are excluded from the evidence fingerprint.

## Migration and validation

Apply backend migration `2026_10_15_000001_create_recruitment_management_reviews.php` before deploying these screens. Existing final-stage records are not silently submitted; HR must confirm a new brief. Tests cover submission evidence, read-only management access, HR decision restrictions, duplicate/stale decisions, changed evidence, return/resubmission, historical versions, hold/resume, incomplete evidence and preservation of grades.

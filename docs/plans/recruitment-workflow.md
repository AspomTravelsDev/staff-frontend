# Recruitment workflow

## Agreed flow

CV screening → Call screening → Oral interview → Written exam → Practical exercise → Management review → Offer & onboarding (after approval).

HR explicitly advances, holds, rejects, withdraws, reopens or returns applicants to an earlier stage. Within-stage status and scheduling are removed as not needed. Failed standards require a recorded exception to advance; no result is overwritten by the exception. Holds require a reason and follow-up date. Returning or reopening invalidates downstream completion and preserves prior data in the decision log.

## Assessment

Fixed department questions and tasks come from checked-in configuration. Optional custom oral questions contribute equally and lock with the role's assessment standards when assessment work begins.

- Oral: 35% of the final score, questions graded 1–5.
- Written: 25%, three general prompts and two role prompts. Graduates are exempt from the role prompts. Written answers are 60% of this stage; observed computer skills are 40%. The same Word instructions and grading guides apply to every applicant.
- Practical: 40%, marks against department criteria, with separate required checks.
- CV screening uses the AI score with a fixed 50% pass mark. HR can advance a lower score with a recorded note. Pending/failed analysis cannot be treated as a score. CV screening does not alter the final oral/written/practical weights; call compatibility remains unscored. Salary comparison uses the vacancy budget and remains advisory. HR decides all other compatibility requirements.

Written/practical files remain outside the portal. The portal supplies instructions and guides and records HR's marks. HR submits a versioned brief for management review. Management can approve for offer preparation, hold, return to HR or decline; approval hands the candidate back to HR to prepare and send the offer from recruitment. See ADR-0005 and ADR-0007 for review and offer rules.

## Implemented screens

- Create recruitment role: vacancy, monthly NGN salary budget, a single department-assessment selector, pass marks and optional custom oral questions. The selected assessment also sets the vacancy department; changing it preserves entered pass marks and custom questions.
- Vacancy pipeline: all applicants by default, visible stage/outcome columns, search, stage and outcome filters, background-analysis state and finalists sorted by final score. Names and CV scores open a sheet. Failed analysis has a direct Retry button and no score. The Actions column offers a visible stage button plus a menu for CV analysis, the current assessment, reanalysing and downloading the CV. Below-standard moves require a note. Changes update the row without resetting filters.
- Stage forms stay on the recruitment table: CV analysis in a sheet; call screening, written grading, practical grading and the final HR recommendation in form modals; oral interviewing in a wide sheet. Each overlay contains only its stage. Drafts autosave and dismissal waits for pending saves; failed saves retain edits and prevent accidental dismissal.
- Status/history modal: holds, rejection, withdrawal, reopening, returning or exceptional skips with the existing reason/follow-up rules. Previous stage assessments open as read-only overlays.
- Vacancy settings modal: role requirements, CV screening instructions, budget, and assessment standards until locked. Unsaved settings are protected on dismissal.

The role page contains a compact header, filters and the applicant table, with no stat cards. The new flow uses the platform's shared shadcn controls and compact spacing. Tables scroll within their containers on small screens. Written/practical marks use compact rows with guides available from their labels; oral questions use quick 1–5 scoring. There is no scoring sidebar or sticky footer. Previous applicant/settings URLs redirect to the role workspace and open the appropriate overlay.

Each row has a visible Start/Continue or Move to next-stage button beside its menu. Incomplete stages open their form; completed stages offer to move to the next stage and open its form automatically after advancement. A stage form’s Move to button saves grading and advances atomically, keeping required score/exception checks and decision history. Below-standard progression requires a draft-saved HR note. Held or closed applicants show Manage status instead. CV progression is disabled until a genuine score is available.

## Local setup and deployment

CV reliability update (2026-10-16): failed/pending/unscored AI analysis permits an explicit manual HR review with a required reason; scores remain blank and management sees the exception. Extraction is saved before AI and reused. Provider requests have bounded transient retries, distinct failure diagnostics and configurable Groq support. See ADR-0006 for setup and limits.

Management review adds migration `2026_10_15_000001_create_recruitment_management_reviews.php`. HR uses Prepare review brief and Submit for management review. The role's Management shortlist view shows submitted candidates and opens their read-only evidence in a sheet. MP/MD see this view directly and cannot change new-flow stage marks. Summary, Assessments, CV and History expose the submitted evidence and previous versions. A changed assessment requires HR to submit a new version before another decision.

Apply backend migration `2026_10_14_000004_create_recruitment_pipeline.php` before opening the new flow. The migration adds fields and tables without removing existing assessment data.

CV extraction and AI analysis use the `recruitment` queue. Run a worker for it, or include it in the existing worker's queues:

```text
php artisan queue:work database --queue=recruitment --tries=1 --timeout=75
```

`composer dev` now listens on `default,recruitment`. Deployment supervisors must also consume the recruitment queue and restart workers after deployment. Jobs use generation tokens; an older retry cannot overwrite a newer result. Pending/processing/failed analysis has no CV score. Queue-dispatch failure preserves the CV and applicant and allows retry.

Existing roles retain the historical interface. New roles use the five-stage workflow. An empty historical role can enable it through `/hr/recruitment/<role-id>/pipeline-settings`. Roles with historical applicants require an explicit migration rather than automatic stage inference.

## Validation

Recruitment backend tests cover stage order, threshold exceptions, weighted results, graduate exemptions, fixed definitions, locked settings, status-label independence, draft revisions, holds/reopening, queue jobs, stale generations, failures and access control. Frontend tests cover atomic vacancy creation with salary/settings, invalid budgets, custom questions, action errors and historical assessment compatibility.

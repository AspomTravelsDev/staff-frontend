# ADR-0014: Department KPI snapshots and staged appraisals

## Status

Accepted for the monthly appraisal implementation, including completed-only HR results.

## Date

2026-10-21

## Context

The portal has mock-backed personal and HR performance screens with different review shapes, fixed KRA arrays, and no corresponding Laravel performance persistence. Department criteria must be maintained by Compliance while assessments follow separate role-specific stages. Editing a KPI must not rewrite an appraisal already opened.

## Decision

Implement one performance domain in the existing Laravel application using Eloquent and REST. Adapt the existing Next.js server-action/query-hook approach and replace the two frontend review shapes with one appraisal contract.

Maintain mutable department KPIs and copy applicable criteria into each appraisal when its period opens. Preserve assigned reviewers and separate stage answers. Backend-controlled transitions route ordinary staff from self to supervisor to MP, supervisors from self to Compliance to MP, and the Compliance supervisor directly from self to MP. Use the same routes for six-monthly reviews when introduced. This supersedes the initial six-monthly-only restriction on Compliance assessment. HR reads completed results. KPI administration alone does not grant assessment access; Compliance assesses assigned supervisors only and never themselves. Snapshot subject classification and assignments at opening. Enforce access, snapshot creation and workflow transitions on the backend.

Start with manual monthly periods, equal criterion weights and one 1–5 scale. Defer weekly reports, six-monthly routing and custom initiation until the monthly path works. No new standalone workflow service or configurable workflow builder is needed.

Monthly setup is owned by active individual HR staff (including an explicit secondary HR role). One period exists per calendar month. Drafts store participant/reviewer assignments and use version checks to prevent overwriting another HR user's edits. Preview resolves eligibility and criteria without creating appraisals; opening revalidates and locks the period, users and KPIs in one transaction. A preview fingerprint blocks opening after relevant data changes. Each employee appears once per period, enforced by a database constraint. Opened periods cannot be edited. HR setup endpoints expose assignment metadata and criterion copies only, never assessment answers.

Use the stored canonical department when present, falling back to the backend's primary-role department mapping only for legacy empty departments. Secondary roles do not reclassify a participant as the Compliance supervisor. Ordinary staff require an explicitly assigned supervisor from their department; supervisors require a Compliance reviewer; the Compliance supervisor has no intermediate reviewer. All reviewers must be active individual users, different from the subject; intermediate and MP reviewers must also be different. Preserve the participant identity, department, classification, reviewer names/IDs and applicable active KPI text at opening. Stage assessments are created when their assigned authors first save or submit, under the shared contract below.

Self-assessments use stage-specific assessment and answer records in Laravel. Staff can access only their own assigned appraisals; no personal creation endpoint exists. A missing self-assessment has version 0 and unanswered ratings. Saving replaces the draft answer set under a period/appraisal lock and increments its version. Submitting requires one explicit integer rating from 1 to 5 for every saved criterion, records a workflow event, and advances once to the snapshot's assigned reviewer stage (or directly to MP). Both draft saving and submission require an open period whose Lagos calendar submission deadline has not passed. Past-deadline and submitted records stay readable. Draft comments and evidence are plain text; no attachment uploads in this release. Only the author sees a draft; personal feedback includes submitted stages only, and HR setup never loads assessment relations.

Detailed scope, proposed setup ownership, final-score rule, role-specific reviewer routing, implementation sequence and acceptance checks are in [the implementation plan](../plans/performance-appraisals.md).

Assigned review endpoints remain separate from personal endpoints. Review queues exclude appraisals whose self-assessment is still unfinished. Reviewers retain access to their assigned review history, but can write only the current stage in an open period before its submission deadline. They must still be active individual accounts and eligible for their assigned role: department supervisor, Compliance reviewer for a snapshot supervisor, or MP. No HR, management or Compliance-wide fallback grants access. Review detail returns earlier submitted stages and only the current actor's stage draft; later-stage answers and other authors' drafts are excluded. A shared assessment-content component validates and persists answers consistently across self/reviewer/MP stages. Period-before-appraisal locks, draft version checks and one assessment per stage enforce one-time progression. MP requires a final comment and its own full KPI ratings; completion saves their equally weighted mean to two decimal places, a completion timestamp and an audit event. Self and intermediate scores never enter the final mean.

## Consequences

HR results require an explicit HR role on an active individual account, including a secondary HR role. The result scope requires completed status, final score, completion timestamp and a submitted MP assessment. Apply that scope before list/detail, filtering, pagination, statistics and available-filter metadata; no unfinished appraisal contributes to those responses. Detail returns only submitted stages, saved staff/reviewer identities and criterion snapshots. No HR results endpoint writes assessments. Personal and assigned-review access remain separate. The legacy mock HR review contract is replaced with these records and its disabled navigation becomes an explicit HR results link.

Historical criteria and reviewer contributions remain stable. One record powers personal history, reviewer queues and HR results. Snapshot records duplicate a small amount of text, and the mock form/contracts require replacement. Actual deployed data must be checked before migrations; existing demonstrations are not production history.

## Validation

Backend feature tests cover permissions, reviewer identity, snapshots, duplicate opening, all three routing paths, valid transitions, draft privacy, final scoring and immutable completed records. A real-data UI walkthrough verifies staff submission, the appropriate intermediate reviewer or direct-to-MP exception, MP completion and completed-only HR visibility.

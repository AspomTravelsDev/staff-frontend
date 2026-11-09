# Department KPIs and monthly appraisals

Date: 2026-10-21. Updated: 2026-10-28. Status: all five monthly appraisal slices implemented and validated, including completed-only HR results and the full three-route journey.

Updated 2026-11-06: the shared system now supports a second `appraisal` period type for June/December Appraisals. See [ADR-0035](../adr/0035-shared-performance-appraisal-cycles.md). The Appraisal uses the supplied 49-item rubric, a self → supervisor/Compliance → Management rating flow, structured comments, management-derived total and average scores, and HR read-only completed results. Monthly KPI periods retain their own type and behavior.

Updated 2026-11-06: HR and Super Admin manage one official supervisor per department at `/hr/department-supervisors` by choosing from that department’s active staff. Saving also sets the selected user’s `is_supervisor` flag for tool access. New appraisals route ordinary staff to the explicit department assignment; that assignment is snapshotted when an appraisal starts, so reassignment does not change an in-flight review.

## First release

Deliver one complete monthly flow: Compliance maintains department KPIs; staff self-assess; an assigned supervisor assesses; MP assesses and completes; HR sees completed results. Use equal KPI weighting and a shared 1–5 scale. Create periods manually. Weekly reports, six-monthly reviews, custom requests, scheduling, notifications, and advanced analytics follow later.

Updated reviewer routing for monthly and six-monthly appraisals:

- Ordinary staff: self → assigned supervisor → MP.
- Supervisors: self → assigned Compliance reviewer → MP.
- Compliance supervisor: self → MP directly. Apply this exception before the general supervisor rule.

This supersedes the earlier six-monthly-only restriction on Compliance assessment. Compliance assesses assigned supervisors only, never themselves. KPI management alone does not grant assessment access. HR's final-results access does not grant access to unfinished assessments.

## Original implementation baseline (before these slices)

- Frontend: Next.js 16 / React 19, server actions wrapping REST requests, TanStack Query hooks, existing shared form and table components.
- Backend: Laravel 12 / Eloquent / Sanctum. No performance routes, models, or migrations were found in routes, app, or database.
- `lib/api/performance-appraisal.actions.ts` defines self, supervisor, and MP submissions against currently absent endpoints. Its fixed KRA score arrays and 1–10 final rating do not support department KPI records.
- `app/(admin)/my/performance` contains history and a fixed-category self-appraisal form. Scores currently default to 3; replace that with explicitly unanswered criteria.
- `lib/api/performance.ts` and `app/(admin)/hr/performance` use a separate mock review shape. Replace this with the same completed-appraisal records used by staff and reviewers.
- `lib/navigation.ts` disables both personal appraisals and performance reviews. Enable links only once their backend and access checks work.
- `User` has department, primary/secondary roles, is_supervisor, is_active, and is_department_account. `/roles/metadata` supplies role-to-department mappings. Do not derive department from an uppercased role as the current form does.
- There is no explicit supervisor relationship in the inspected User model. Resolve reviewer assignments explicitly when opening appraisals rather than guessing from the first department supervisor.

## Screens

1. **Department KPIs**: Compliance selects a department; adds, edits, or deactivates KPIs. Fields: name, description, target/expectation, applies to all staff or supervisors only, active status. No hard deletion of used criteria.
2. **Monthly periods**: proposed administrative responsibility is HR. HR chooses month, participating staff, submission deadline, appropriate supervisor or Compliance reviewer, and MP reviewer. The Compliance supervisor needs only an MP reviewer. A preview identifies missing criteria or reviewers before opening the period. This setup permission is separate from access to unfinished answers.
3. **My Performance**: assigned appraisals, saved drafts, submission, and history. The server supplies identity, dates, and criteria; staff cannot freely create official monthly periods or substitute employee IDs.
4. **Reviews to Complete**: supervisor, Compliance and MP queues with assigned appraisals, previous submitted assessments, and the current assessor's form.
5. **HR Results**: completed appraisals only, searchable by staff, department, and period; detail shows separate assessor ratings and MP's final result.

## Records and ownership

Keep persistence and workflow decisions in the existing Laravel API. Continue the frontend's server-action and query-hook conventions; introduce no new ORM, state library, or standalone service.

| Record | Responsibility |
| --- | --- |
| Department KPI | Mutable department criteria and applicability |
| Appraisal period | Type, dates, deadline, draft/open/closed lifecycle |
| Appraisal | Employee, department/supervisor status snapshot, period, workflow state, final result |
| Appraisal criterion | Copy of applicable KPI name, description, expectation and source ID at opening |
| Assessment | Appraisal, stage, assigned reviewer, draft/submitted state, comments and timestamps |
| Assessment answer | Criterion, explicit 1–5 rating, comment and optional evidence note/link |
| Workflow event | Actor, transition and timestamp; retain return reasons if revision support is added |

Snapshot criteria and assignments atomically when opening a period. Reject missing criteria, inactive or department accounts, invalid reviewers, self-review assignments, and duplicate employee/period appraisals. Reassignment, if supported, must be audited and cannot rewrite a submitted assessment. Department transfers and KPI edits must not change open or historical appraisals.

## Assessment rules

- Scale: 1 = well below expectations; 2 = below expectations; 3 = meets expectations; 4 = exceeds expectations; 5 = substantially exceeds expectations. Show these definitions in each form.
- Every applicable criterion needs an explicit rating before submission. Comments and evidence are text/link fields initially; file uploads are deferred.
- Preserve each assessor's answers separately. MP supplies their own KPI ratings and a final comment; the proposed final result is the equally weighted mean of MP ratings, displayed to two decimal places. Do not average staff and reviewer scores together or introduce a second 1–10 scale.
- Sequence: awaiting self → awaiting reviewer → awaiting MP → completed. The intermediate reviewer is the assigned supervisor for ordinary staff or Compliance for supervisors. The Compliance supervisor skips that stage, advancing from self-submission directly to awaiting MP. Draft saving does not advance the appraisal. Only the currently assigned assessor may submit the current stage.
- Submit and advance in one database transaction with locking or equivalent concurrency checks. Repeated/stale submissions cannot duplicate assessments or advance twice.
- Submitted answers and completed appraisals are read-only in this release. Returns, reopening, acknowledgement and appeals require a subsequent explicit workflow design.
- Staff can read their own appraisal and submitted feedback. Reviewers can read assigned appraisals and preceding submitted stages; unfinished draft answers remain private to their author. HR can read answers only after completion. Check permissions on every API request, including list, detail and statistics; use primary and secondary role helpers consistently.
- Snapshot supervisor status and Compliance-supervisor classification at opening using canonical department identity, not display text or a secondary role alone. Validate reviewer eligibility against the applicable route. Missing eligible reviewers block opening; self-review and silent fallback are prohibited.

## API outline

Use the project's existing response envelopes and validation conventions. Proposed resources under `/performance`:

- Department KPI list/create/update/deactivate.
- Period list/create/preview/open with validated participant and reviewer assignments.
- Personal appraisal list, assigned-review list, and HR completed-result list.
- Authorized appraisal detail and scoped statistics.
- Save current assessment draft and submit current assessment. Backend derives employee, assessor and stage; clients supply answers and comments only.

Replace the legacy fixed-KRA contracts rather than maintaining two competing review models. Check deployed schema/data before migration; mock JSON is demonstration data, not a historical-data migration source.

## Build order and completion checks

1. **KPI foundation**: migrations, Eloquent models, policies/permission checks, validation and endpoints; then Compliance's KPI screen. Verify non-Compliance writes fail and department/applicability filtering works.
2. **Manual monthly setup**: periods, snapshots and explicit reviewer assignments; setup screen and preview. Verify empty KPIs, duplicate appraisals, invalid reviewers and self-review are blocked. KPI changes after opening leave snapshots intact.
3. **Self-assessment**: replace fixed categories with snapshot criteria; save draft and submit. Verify persistence, required ratings, ownership and repeat submissions.
4. **Reviewer flow**: supervisor/Compliance/MP inboxes and assessment detail, transactional advancement and completion. Verify all three routes, including direct-to-MP for the Compliance supervisor; out-of-order and unauthorized submissions fail; separate scores are retained and final result is correct.
5. **HR results and integration**: replace mock HR records, enforce completed-only access across all endpoints, connect navigation and scoped statistics. Validate a complete real-data journey plus frontend type/lint checks and backend feature tests.

Backend feature tests should exercise primary/secondary roles, cross-department access, draft privacy, snapshot stability, stale submissions and completed-record immutability. UI checks should cover unanswered criteria, draft restoration, stage labels, empty states and readable results. Keep unrelated working-tree changes intact.

## Later releases

- Six-monthly: use the same three routes as monthly, including self → MP for the Compliance supervisor. HR sees completed results.
- Custom: supervisor, Compliance or HR can initiate within authorized scope. Initiation is separate from assessment authority; define assigned assessors and finalization before implementation, preserving Compliance's supervisor-only assessment scope and the Compliance supervisor's direct-to-MP route.
- Weekly: a short department report from the supervisor, separate from individual scores.
- Scheduling, reminders, revision/return flows, weighted KPIs and analytics are optional follow-ups.

## KPI foundation implementation status (2026-10-21)

The department KPI slice is implemented: Compliance can select a department, filter by status, search criteria, and add or edit a KPI in an inline editor. The responsive list shows descriptions, expectations, applicability and inactive status. The route includes access checks and a loading state. Monthly periods, appraisal snapshots, assessments, reviewer workflows and HR results are not implemented.

Visual consistency was checked against `PRODUCT.md`, `app/(admin)/compliance/page.tsx`, the existing shared `Button`, `Input`, `Textarea`, `Badge` and `Label` components, and the new `app/(admin)/compliance/kpis/page.tsx`, `kpi-manager.tsx` and `loading.tsx`. The Operate direction extends the portal's existing headings, muted supporting text, bordered surfaces and form controls. No visual-system change was approved; no `DESIGN.md`, sidecar or global-token change is part of this slice.

Validation reported for this slice: backend feature tests passed (4 tests, 61 assertions); frontend access and action tests passed (2 tests); frontend type checking passed with the loading-state and navigation changes; targeted lint passed for the KPI implementation. The KPI migration was applied to the local database. Authenticated desktop and mobile visual verification has not yet been completed.

## Manual monthly setup implementation status (2026-10-28)

Step 2 is implemented at `/hr/performance/periods`, available through **Monthly Appraisal Setup** to active individual HR staff with an explicit primary or secondary HR role. The legacy personal appraisal and HR results links remain disabled until their real assessment workflows are implemented.

HR can create one draft per month, choose a submission deadline, search/filter and select staff, assign the appropriate intermediate and MP reviewers, apply an MP reviewer to all selected staff, save incomplete drafts, and preview readiness. Preview shows each person's route, applicable criteria, reviewer names and actionable issues. Opening requires confirmation and a current preview; it creates all appraisal records, criterion copies and opening audit events in one transaction. Opened setup is read-only and exposes no assessment answers.

The backend validates canonical departments, active individual participants/reviewers, same-department supervisors for ordinary staff, Compliance reviewers for supervisors, the Compliance supervisor's direct-to-MP exception, distinct reviewers and no self-review. Missing KPIs, empty selections, expired deadlines and invalid assignments block opening. Database uniqueness and period locks prevent duplicate opening; version checks reject stale draft edits, and preview fingerprints reject changed setup, staff or criteria. Staff identities, classifications, reviewer identities/names and KPI text are copied at opening. Later department transfers and KPI edits do not rewrite those records.

Validation: the KPI and monthly setup backend suites passed together (12 tests, 202 assertions); frontend KPI/setup access and action suites passed (5 tests); frontend type checking and targeted lint passed. Existing PHPUnit doc-comment deprecation notices come from unrelated test files. The new migration was applied only to the confirmed local MySQL development database. No real appraisal period was created or opened during verification.

Visual-system evidence: `PRODUCT.md`, the existing Compliance KPI screen, HR performance page, shared Button/Input/Label/Badge/AlertDialog components, and the new period manager/editor. This extends the existing Operate interface with its current typography, borders, controls and responsive form layouts; no global design tokens or visual-system files changed. Authenticated desktop/mobile visual verification remains pending. The user requested the full end-to-end test after all appraisal stages are complete.

Next at the end of this slice was step 3 (self-assessment); its implementation is recorded below.

## Staff self-assessment implementation status (2026-10-28)

Step 3 is implemented. **My Performance** is enabled for individual staff and uses real, owner-scoped appraisal records. The personal list shows assigned monthly periods, draft/review progress, deadlines and completed final scores on the 1–5 scale. Search and status filters distinguish appraisals needing self-assessment from history. HR-created appraisals are the only entry point; the former `/my/performance/new` screen redirects to the assigned list.

The detail route loads saved employee identity, department, reviewer route/names and KPI copies. Each rating starts unanswered. Staff can restore/save incomplete drafts, add optional criterion comments/evidence notes or links and an overall comment, then submit after explicitly rating every criterion. Submission writes answers and advances to `awaiting_reviewer` for ordinary staff/supervisors or `awaiting_mp` for the Compliance supervisor. Submitted answers are read-only. Closed periods and passed Lagos calendar deadlines block both saving and submission while preserving read access. Draft versions prevent overwriting another session, and locked transactions prevent repeated submissions or duplicate advancement. Unsaved changes are identified, with confirmation before leaving through the page's Back action.

Only an active individual subject can read/write their personal appraisal. Personal lists/statistics cannot include another employee's records. Assigned reviewers, HR and management cannot use these personal endpoints to read someone else's draft. HR setup continues to return no answers, and personal feedback only includes submitted reviewer/MP assessments. Assessor identity, stage and workflow state are derived by the server. The old mock-backed personal API and fixed-KRA form implementation have been replaced; the separate HR mock results screen remains for replacement in step 5.

Validation: focused backend KPI/setup/self-assessment suites passed (21 tests, 340 assertions). Frontend KPI/setup/self-assessment and shared action-result suites passed (27 tests). Type checking, targeted frontend lint and formatting checks on the self-assessment backend files passed. Existing PHPUnit doc-comment deprecation notices remain unrelated to this slice. Assessment/answer tables were migrated only on the confirmed local MySQL development database. No real staff appraisal was submitted during verification.

Visual-system evidence: the current personal performance screens, preceding monthly setup/KPI interfaces, shared form controls, badges and confirmation dialog, plus the new personal list/detail/loading states. The existing Operate styling is preserved with responsive layouts and readable saved results. Authenticated desktop/mobile visual verification and the full end-to-end journey remain pending, as requested until all stages are complete.

Next at the end of this slice was step 4 (assigned reviewer workflow); its implementation is recorded below.

## Assigned reviewer workflow implementation status (2026-10-28)

Step 4 is implemented at `/performance/reviews` as the shared **Performance Reviews** department workspace. Individual supervisors and staff with an explicit primary/secondary HR, Compliance or MP role see all appraisals with a submitted self-assessment. The queue shows current stage and each stage's progress, while review actions and detail access remain limited to the assigned reviewers. It supports search, ready/waiting/submitted views, draft continuation and read-only history. MP can see an assigned appraisal while waiting for its intermediate reviewer, but cannot write until the preceding stage is submitted. The former `/my/performance/reviews` paths redirect to the shared workspace.

Review detail shows saved staff/period metadata, the full 1–5 scale, earlier submitted assessments in disclosures, saved KPI criteria, the assessor's own draft, optional criterion comments/evidence, and an overall comment. All ratings begin unanswered. MP must give a final comment and independent ratings; the interface previews their equally weighted mean. Confirmation submits the current answers and locks the assessment. Intermediate submission advances to MP; MP submission saves the final score to two decimal places, completion time and workflow event. Existing self/intermediate ratings remain separate.

Backend assignment checks cover list/detail/draft/submission. The actor must remain an active individual with the assigned role: a supervisor in the snapshot department for ordinary staff, Compliance for a snapshot supervisor, or MP. Privileged roles do not override assignment, and self-review is excluded. Earlier drafts and later-stage answers are not exposed through review detail; only the author's current draft and earlier submitted stages are returned. The personal staff view continues to show submitted feedback only, and HR setup returns no assessment answers. Closed periods and passed submission deadlines keep review history readable but block writes. Version checks and period-before-appraisal locks prevent stale overwrites, out-of-order progression and repeat completion. Shared assessment-content validation/persistence now serves self, intermediate and MP stages.

Validation: focused backend KPI/setup/self/reviewer suites passed (31 tests, 456 assertions). Frontend KPI/setup/self/review and shared action-result suites passed (32 tests). Type checking, targeted frontend lint and formatting checks on the changed backend files passed. Existing PHPUnit doc-comment deprecation notices remain unrelated to these changes. No additional migration was required; the prior assessment schema supports these stages. No real staff assessment was submitted or completed during verification.

Visual-system evidence: the current self-assessment and monthly setup interfaces, shared Button/Badge/Label/Textarea/AlertDialog components, the extracted shared read-only assessment renderer, and the new review queue/editor/loading states. The existing Operate styling is retained, including responsive forms, keyboard focus, draft/error/empty states and readable saved results. Authenticated desktop/mobile visual verification and the full end-to-end journey remain pending until the final stage is implemented, as requested.

Next at the end of this slice was step 5 (HR completed results and integration); implementation and final validation are recorded below.

## HR results and final monthly-flow validation (2026-10-28)

Step 5 is implemented at `/hr/performance`, with the enabled **Appraisal Results** link restricted to explicit individual HR staff (primary or secondary HR role). The mock HR API/screens have been replaced. Staff name/ID, saved department and appraisal month filters apply to a paginated completed-results list and its summary counts/average. Available departments and months also come only from completed results. Detail is read-only and shows saved criterion text, staff self-ratings, the supervisor/Compliance ratings where applicable, and MP's independent ratings/final comment and score.

The backend scope requires completed status, a non-null final score/completion time, and a submitted MP assessment before list/detail/statistics/filter options are evaluated. Unfinished IDs return not found to HR; assessment loading includes submitted stages only. No HR results write endpoint exists, and broad management/Compliance access does not grant HR results access.

Final automated validation passed: 37 backend tests with 606 assertions across KPI, period setup, self-assessment, reviewer workflow, HR results and a complete API journey; 35 frontend tests across access/actions/draft restoration/score previews and shared action results. Frontend type checking and targeted lint passed. Changed backend files pass formatting checks. The existing unrelated PHPUnit doc-comment deprecation notices remain.

A separate loopback frontend/API pair and disposable SQLite database with synthetic accounts were used for the browser walkthrough. The browser exercised KPI creation, HR period opening with all three routes, initially blank ratings, missing-rating validation, saved draft restoration after reload, self-submission locking, supervisor/Compliance review, direct-to-MP routing, required MP final comments, completion, HR list/detail and staff/department/month filters. All three appraisals were completed through the UI. Synthetic final scores 5, 4 and 3 produced a global average of 4.00; filtering to the two Visa results produced 4.50. The staff result retained self=3, supervisor=2 and MP=5 separately, with final score 5.00.

HR results list/detail were visually checked at the default desktop viewport and at 390×844; both mobile pages had content width equal to viewport width (390px). The minimal disposable database omitted unrelated attendance/chat/notification tables, so existing shared widgets could show retry/error indicators; these endpoints were outside the appraisal journey. No real staff data or appraisals were changed. Temporary test servers were stopped; the user's existing development server was left running.

All first-release monthly flow work is complete. Later-release weekly reports, six-monthly/custom reviews, notifications, scheduling, revision/appeal flows and advanced analytics remain out of scope. See [validation notes](../testing/performance-appraisal-validation.md) for repeatable checks.

# Applicant Assessment implementation plan

Date: 2026-10-13. Status: implemented and verified locally. The additive assessment migration has been applied to the local database.

## Outcome and scope

HR and leadership conduct structured interviews in recruitment, score individual answers, and review section, competency, and overall results. The user confirmed that existing HR and leadership users record assessments. Keep Applicant Assessment separate from Interview Rubric, CV AI scores, post-interview AI analysis, and offer/onboarding decisions.

First release includes all eight question-bank tracks from the supplied guide, vacancy-level question selection, one assessment per candidate, autosaved drafts, submission, correction history, and a printable result. It does not include panel scoring, delegated department access, automatic hiring decisions, AI grading, custom question-authoring tools, or multiple interview rounds.

## Current implementation and integration

- Frontend: Next.js/React/TypeScript, existing recruitment server actions through `lib/api/client.ts`, recruitment types, shared form components, and candidate table/evaluation sheet.
- Backend: Laravel, Eloquent UUID models, REST endpoints, Sanctum authentication, and the `manage-recruitment` gate. Existing permission tests cover primary and secondary HR/leadership roles (`hr`, `super`, `mp`, `md`). Reuse that gate for every assessment operation.
- Current rubric is a JSON attribute on RecruitmentCandidate. Its UI and AI analysis assume the existing /55 scores. New assessment data must not enter those attributes or existing AI prompts.
- Add cohesive assessment controllers, requests, models, and a service inside the existing application. Use Eloquent and the current API client; introduce no new database, state framework, or external service.

## Interview content and vacancy setup

Store the supplied guide as a durable source file with the feature. Seed a versioned, server-owned question bank with stable IDs, original wording, section, track, scored/unscored type, primary competency, follow-up prompts, and question-specific 1/3/5 anchors. Intermediate scores 2 and 4 interpolate between anchors. Preserve all original questions, including those omitted from recommended shortlists.

Tracks: HR/Admin, Office Operations/Admin, Sales & Social Media, Visa, Accounts, IT & Web, Compliance, and Entry Level/Graduate Trainees. Graduate is a selectable track independent of department. Suggest a track from department but require explicit selection when mapping is ambiguous; never silently select a different department. Role-specific selection supports, for example, sales versus social media within the same track.

Add Assessment setup to the vacancy. HR chooses a track and core questions from recommended selections. Default target: 6 general, 4 universal talent, and 6 role-specific scored questions, with room for follow-ups. Graduate default: 6 general, 4 universal, and 6 graduate questions, removing overlapping wording. This is a proposed starting selection, not a requirement to ask the entire bank. Show estimated time and selected counts.

Use the guide's interview order: intro; general; role-specific and universal talent; expectations; candidate questions; closing. Keep universal talent separately scored even when asked alongside role questions. Unscored prompts collect salary, notice period, schedule/location constraints, candidate questions, and closing notes. Do not collect age in this feature.

Each selected scored question is required for submission. Optional follow-up questions and free notes carry no extra points. Practical exercises are enabled for the whole vacancy before the first assessment; each chosen exercise has a prompt, evaluation anchors, notes, and a 1–5 grade. Drafting question-specific anchors and reviewing selections against the supplied guide is an explicit implementation task, not an AI activity during interviews.

Freeze the vacancy plan on first assessment creation, in the same transaction as creation. All candidates in that vacancy then use the same question set, weights, and guidance. Later bank releases affect only newly configured vacancies. V1 does not allow editing a frozen plan; a different interview process requires a new vacancy. Revisit plan revisions if operations needs them later.

## Scoring contract

| Area | Default | With practical exercise |
| --- | ---: | ---: |
| General assessment | 20% | 20% |
| Universal talent | 40% | 35% |
| Role-specific assessment | 40% | 35% |
| Practical exercise | Disabled | 10% |

These are proposed release defaults. HR selects practical mode at vacancy setup; custom weight editing is deferred.

- Every scored answer starts null and accepts integer 1–5. No CV-derived defaults and no automatic recommended verdict.
- Section score = arithmetic mean of its selected questions. Overall /5 = sum(section mean × section weight); /100 = overall × 20. Thus 4, 3.5, 4 with default weights yields 3.8/5 and 76/100. A score of 1/5 is 20/100; this is earned points, not a percentile or probability of success.
- Each question has one primary competency. Competency mean uses answers mapped to that competency across sections; display evidence count. An unmeasured competency displays Not assessed. Competency summaries do not contribute a second time to the overall score.
- Require coverage of reasoning, initiative, problem identification, and solution quality in the selected universal set. Validate the other competency mappings against the guide. Use the practical task's primary competency the same way.
- Drafts show completion and provisional section/competency averages over answered questions; do not show a final overall score until all required scored questions have scores and evidence notes. Never treat missing answers as zero or renormalize the overall weights around missing sections.
- Require a short evidence note for each scored answer, and a human-selected recommendation (Strong hire / Hire / Hold / Do not hire) plus rationale at submission. Strengths and concerns are separate optional fields.
- Laravel calculates authoritative results from the frozen plan and validated answers. Reject unknown question IDs, duplicate IDs, invalid scores, and mismatched plan data. Client-supplied totals are ignored. Preserve full calculation precision; round only displays, to two decimals /5 and one decimal /100.
- There is no automatic pass threshold, rejection, candidate ranking, or status transition.

## Lifecycle and access

UI states: Not started, Draft, Submitted. New drafts and answer edits/submission require candidate status `interviewing`, enforced on the server. Existing records remain readable in all later candidate states. Moving away from interviewing preserves a draft as read-only; moving back allows continuation. Existing status transitions remain available without making assessment completion an offer prerequisite in v1.

One assessment per candidate, shared by authorized recruitment users. Capture creator, interview date, interviewer identity, last editor, submission author, and timestamps. Concurrent saves use an integer revision: stale writes return 409 with instructions to reload, not silent overwrite. Starting twice returns the existing assessment using a unique candidate constraint. Submission is transactional, flushes pending edits, and retries safely without duplicate history entries.

Submitted results are read-only. While the candidate is interviewing, authorized users can reopen with a required reason. Preserve the submitted snapshot as an immutable revision, audit the reopening, and create a new draft revision from it. Each resubmission preserves a complete snapshot of answers, scores, recommendation, and attribution. Candidate/role deletion follows existing authorized deletion semantics and cascades assessment records; immutable means no ordinary in-place result editing, not a new retention policy.

## Storage proposal

1. `recruitment_assessment_plans`: UUID; unique recruitment_role_id; bank_version; track; schema_version; JSON definition containing frozen sections/questions/weights/anchors; locked_at; created_by/updated_by and timestamps. Add a revision counter for setup edits too.
2. `recruitment_candidate_assessments`: UUID; unique candidate_id; assessment_plan_id; JSON plan_snapshot; draft/submitted state; JSON answer list with unique question IDs; JSON unscored responses; summary fields; JSON server-calculated results; interview metadata; revision; actor snapshots; submission fingerprint; submitted_at and timestamps.
3. `recruitment_assessment_revisions`: assessment_id; revision/event; immutable submission snapshot or reopen event/reason; actor ID/name snapshot; created_at. Ensure duplicate submit retries cannot append duplicate submissions.

Use explicit foreign-key deletion rules. Preserve actor name snapshots if users are removed. JSON is appropriate for small bounded interview documents; avoid a question/answer-table proliferation in v1. Validate schema and lengths in Laravel FormRequests. Keep plan/version fields server-owned after creation. Bank changes ship through source-controlled data; database seeding must not overwrite locked plans.

## API proposal

All paths below are under `/api/recruitment` and `can:manage-recruitment`.

| Method/path | Purpose |
| --- | --- |
| GET `/assessment-bank` | Versioned tracks, questions, anchors and recommended selections |
| GET/PUT `/roles/{roleId}/assessment-plan` | Read/configure unlocked vacancy plan with revision checking |
| POST `/candidates/{candidateId}/assessment` | Start or return existing assessment; lock and snapshot plan |
| GET `/candidates/{candidateId}/assessment` | Read current assessment and available history metadata |
| PATCH `/candidates/{candidateId}/assessment` | Save validated draft with expected revision |
| POST `/candidates/{candidateId}/assessment/submit` | Validate completion and compute/persist result transactionally |
| POST `/candidates/{candidateId}/assessment/reopen` | Require reason and preserve history |
| GET `/candidates/{candidateId}/assessment/revisions/{revisionId}` | Read authorized historical result belonging to this assessment |

Return 401/403 for access failure, 404 for absent resources, 409 for stale revision/locked state/stage conflict, and 422 for field validation. Derive role and plan through the candidate relationship. Expose only compact assessment summary in existing role-detail candidate responses; load question text/notes/history on demand. Guard candidate-stage checks and first-plan locking against concurrent writes with transactions/row locks.

## Frontend flow and states

Use the existing recruitment components and visual conventions. This is an operational form used while talking to an applicant; prioritize readable prompts and quick keyboard scoring.

- Vacancy header: Assessment setup, with setup-needed or locked status.
- Candidate table and evaluation sheet: separate Assessment summary/action, visibly distinct from CV score and Rubric /55. Show Not started, Draft with completion, or submitted /100 score and human recommendation.
- Dedicated route: `/hr/recruitment/[id]/candidates/[candidateId]/assessment`. Validate candidate membership in the route's vacancy. Use full-page space for the interview instead of expanding the existing rubric dialog.
- Assessment page: candidate/role/interviewer context, section navigation and completion counts, active section's questions, notes and labelled 1–5 radio controls, collapsible anchor guidance, and a clearly labelled save state.
- Desktop uses section navigation beside the working area; mobile stacks navigation and question content. Keep scores keyboard-accessible, focus visible, and save/error messages announced without relying on colour.
- Autosave after a short pause (about 1 second), serialize requests, and coalesce changes made during an active save. Show Saving / Saved at time / Not saved with Retry. A failed request retains edits in memory and prevents a false Saved status. Provide explicit Save draft, a dirty-navigation warning, and flush saves before review/submit. Do not store interview notes in localStorage.
- Review page/state: missing-item links, section scores, competency means with coverage, final score when complete, strengths, concerns, recommendation/rationale, Submit assessment.
- Submission failure preserves edits; duplicate clicks do not duplicate submissions. A stale revision displays a conflict state with the current saved version and asks the user to reconcile; it never automatically discards local input.
- Submitted view: read-only answers and results, attribution, correction history, Reopen when permitted, and a print-friendly report supporting browser Save as PDF. The report labels track, question-bank version, vacancy, date, and assessment revision.
- Loading, empty plan, unsupported department, missing/deleted candidate, forbidden, network failure, stale-save conflict, stage change during editing, and long answers are required states.

## Implementation sequence

1. **Question bank and score specification**: copy source guide into project docs; build stable bank data, recommended per-track selections, competency mapping, anchors, and practical variants. Validate uniqueness, coverage, weights, and source completeness. Deliver eight selectable tracks.
2. **Backend foundation**: additive migrations/models, plan and assessment services/controllers/FormRequests, snapshotting, scoring, lifecycle, permissions, conflict handling, and compact summaries. Cover domain and API behaviour before integrating UI.
3. **Vacancy setup**: API actions/types and template selection/preview/question selection with freeze behaviour. Existing vacancies begin unconfigured; selecting a plan never modifies current candidates or rubric data.
4. **Live interview flow**: assessment route, sections, question notes/grading, autosave/resume, progress, errors and conflicts. Add entry points to table and evaluation sheet.
5. **Review and reporting**: result calculation display, submission, recommendation, history/reopen and print view. Keep existing rubric, AI analysis and onboarding actions independent.
6. **Verification and rollout**: run targeted backend tests and existing recruitment regressions, frontend API/component tests, type/lint checks for changed code, then a browser pass through setup → interview → failed-save retry → reload → submit → history/print on desktop/mobile. Apply additive backend changes before releasing the frontend. Smoke-test an existing rubric-only candidate and a new assessed candidate.

## Acceptance tests

- All eight tracks load; every question from the source is represented or explicitly classified as non-question interviewer guidance. IDs are stable and seed reruns safe.
- Required talent competency coverage and weights validated before plan saving. General/graduate overlap removed in recommended selections.
- Setup remains editable until first assessment; concurrent first starts cannot snapshot two different plans. Bank updates never change existing assessment wording, guidance, or weights.
- Integer score bounds and note requirements enforced; all-1 and all-5 cases yield 20 and 100; 4/3.5/4 yields 76; practical mode follows its weights; missing required answers block submission; unscored logistics never alter scores.
- Unauthorized and unrelated-role users cannot access plans, notes, results, or history; authorized primary and secondary roles work. Candidate/role mismatches fail.
- Only interviewing candidates can start/edit/submit/reopen. Stage changes preserve records. Duplicate start/submit and concurrent save tests prove no duplicate records or lost updates.
- Reopen preserves previous submitted results; corrections never silently rewrite history.
- Autosave failure, retry, navigation, reload/resume, revision conflict, and pending-save submission are covered. Browser refresh restores the last acknowledged server save.
- Existing recruitment permissions, lifecycle, rubric, AI analysis, offers and onboarding tests still pass. Rubric values remain unchanged after assessment creation/submission.
- Result summaries load without all question/answer documents and without per-candidate query growth. Printing handles long notes without clipping.

## Remaining choices and implementation risks

HR/leadership access is confirmed. The weights, 16-question recommended baseline, single shared assessment, required evidence notes, and print-based export are proposed defaults for implementation. Content calibration is the largest non-code task: anchors should distinguish evidence and judgment, and remain suitable for graduates and hypothetical scenarios. Validate sample completed assessments with HR before broad use. Later panel/multiple-round support can extend the separate assessment records without rewriting the old rubric.

## Implementation and validation record

- Implemented all eight tracks with 169 preserved prompts, question-specific anchors, default selections, optional practical exercises, and vacancy-plan locking.
- Implemented the separate assessment API/storage, question grading and notes, serialized autosave, conflict comparison and explicit merge choices, review/submission, reopening and preserved result history, and a printable report.
- Inputs with blank draft notes are normalized to empty strings so partially completed assessments reload safely. Exact submission retries are identified by a server-side fingerprint; different submissions cannot be silently acknowledged as retries.
- Validation: 43 backend recruitment/assessment tests (877 assertions), 25 frontend assessment/recruitment/rubric tests, and lint checks for the new frontend files pass. The interface detector reported no findings.
- Browser verification used an isolated temporary database and the real components/API: setup, start, grading, failed save/retry, reload/resume, 76/100 weighted result, submission, reopening, original-result history, and concurrent-session conflict resolution all worked. Mobile viewport width was 390px with no page overflow. The print action was exercised; the browser's native print dialog prevented automated PDF page inspection, so exported PDF pagination is not separately certified.
- Full-project TypeScript checking reports existing errors in shared UI/dependency declarations and other pages. No assessment-file diagnostics were reported. A successful full production build is not claimed.
- Local migration `2026_10_13_000001_create_recruitment_assessments.php` applied successfully. Apply it to each other environment before releasing the updated backend/frontend. The first vacancy still needs its question set configured through Assessment setup; no existing applicants were given synthetic assessments.
- Temporary preview routes, test servers, and preview database files were removed after verification.

## Creation flow and interface update

Role creation now has Role details and Interview setup steps. HR can confirm the department-suggested track, select talent/role questions and enable practical tasks before creating the vacancy. The role and its assessment plan save atomically. A shared question picker is used for creation and later setup editing, with keyboard-accessible section tabs and a read-only list of all six General questions.

General questions are mandatory server-side as well as in the interface. Default selections now contain 16 scored questions (6 general, 4 talent, 6 role). Unused legacy plans add any missing general questions on first start; previously locked plans and existing interviews keep their historical question sets.

The vacancy page now displays Ready/Locked/Setup needed, track and question counts. Screening instructions collapse to a compact row, and applicant experience, skills and added date sit together to reduce table columns. Mobile stage filters scroll horizontally and the table scrolls within its container. Sort labels are shortened and primary controls have larger touch targets.

Verification for this update: 48 backend tests (900 assertions), 29 frontend tests, and lint checks for the modified UI pass. Browser testing confirmed creation with an optional practical task, a saved 17-question plan including all six general questions, applicant search, and desktop/mobile layouts without page overflow. Full-project type checking still reports existing shared UI/dependency declaration errors, including Dialog wrapper props used by the creation form. No schema migration was needed.

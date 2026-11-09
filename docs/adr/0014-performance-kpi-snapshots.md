# ADR-0014: Monthly KPI windows and staged appraisals

## Status

Accepted for the monthly appraisal implementation.

## Context

Monthly appraisals are driven by the department KPI catalogue rather than HR assigning participants manually. Compliance owns reusable KPI categories, assigns categories to departments, and maintains the active KPIs within those categories. Eligible staff start their own appraisal from `/my/performance` during the open monthly window; the system creates an appraisal only when that staff member starts.

The monthly cycle opens on the 25th of the assessment month. Staff may submit until the 25th of the following month, allowing a late-submission window while making the deadline explicit. The portal must notify staff when an assessment is available and surface the outstanding task in personal navigation.

Staff provide the measurable rating for every saved KPI. Assigned reviewers provide comments only. Staff ratings determine the final score; reviewer comments provide context and accountability without creating competing scores.

Completed monthly results are visible to Compliance, HR, and Management. Drafts and incomplete assessments remain private.

## Decision

Maintain a reusable KPI bank with:

- `kpi_categories`, containing category name, description, and active status.
- `kpi_category_departments`, assigning a category to one or more departments.
- `department_kpis`, containing the measurable criteria within a category.

Legacy uncategorised active KPIs remain usable during migration. New monthly criteria prefer active KPIs whose active category is assigned to the employee's department. Compliance manages categories and KPI criteria; HR does not initiate the monthly cycle.

On the 25th of each month, a scheduled command opens one monthly window and sets its deadline to the 25th of the following month. It does not create staff appraisals. When an eligible staff member starts from `/my/performance`, the system snapshots that department's applicable active KPI text and reviewer assignments into one appraisal. The start operation is idempotent, and the snapshots are immutable if the KPI catalogue or role assignments later change. Local development can open a window on another date or use the local-only start action outside the window.

Reviewer routing is snapshotted when the appraisal starts:

- ordinary staff: self → department supervisor → HR → Compliance → MP;
- supervisors: self → HR → Compliance → MP;
- Compliance supervisors: self → HR → MP.

Each reviewer submits one comment-only stage; the appraisal advances to the next assigned reviewer. MP is the final reviewer. Management, including the MP, is exempt from completing appraisals. Existing appraisals keep their original reviewer assignment and legacy route; staged routing applies to new appraisals.

Reviewers use the shared `/performance/reviews` workspace, not a personal-page queue. It lists only appraisals assigned to the signed-in reviewer, shows the current stage and each stage's progress, and exposes a review action only when that reviewer can act. Earlier submitted KPI ratings are visible read-only alongside the relevant KPI.

The self stage requires a 1–5 rating for every snapshot criterion. Reviewer and MP stages save an overall comment only. MP completion calculates `final_score` as the equally weighted mean of the submitted staff ratings, rounded to two decimal places. Completion requires an MP comment and makes the appraisal read-only.

Results endpoints authorize active individual Compliance, HR, Management (`mp`/`md`) and Super Admin users. Results include completed appraisals only, with submitted self-assessment data and submitted reviewer/MP comments. Unfinished drafts are not included in lists, filters, statistics, or detail responses.

## Consequences

HR has no monthly setup page to select staff or assign criteria. The period is opened automatically at 00:05 Africa/Lagos on the 25th; eligible staff start their own record during the window. Staff whose departments do not yet have active applicable KPIs cannot start an appraisal. Missing reviewer roles or a reviewer who would assess their own appraisal prevent that individual appraisal from starting. The MP and Management are excluded as appraisal subjects.

Compliance receives category-level configuration and department assignment responsibility. KPI edits affect only future periods; snapshots preserve historical wording and targets.

The monthly date window permits overlapping periods: a previous month's assessment may be submitted until the 25th while the current month's assessment opens on its own 25th.

Supervisor and MP screens are comment-oriented. Their submitted records no longer contribute ratings to the final score. Existing rating columns remain nullable for backward-compatible historical records.

## Validation

Feature tests must cover category assignment, automatic period generation and idempotency, the 25th-to-25th deadline, snapshot immutability, self-rating validation, comment-only reviewer stages, staff-rating final scoring, notification counts, and results access for Compliance, HR, and Management.

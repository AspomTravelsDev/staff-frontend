# ADR-0035: Shared monthly KPI and June/December Appraisal cycles

Accepted, 2026-11-06.

## Decision

Keep monthly KPI reviews and the June/December Appraisal in the existing performance period, appraisal, criterion, assessment, and answer tables. Add an explicit period type so the two cycles can exist in the same calendar month. Preserve the employee, reviewer assignment, criterion snapshot, workflow event, portal notification, and review-queue patterns already in use.

The Appraisal uses a fixed 49-indicator rubric grouped into the 10 provided Key Result Areas. Snapshot that rubric onto each started appraisal. Ratings are whole integers from 1–5. Staff submit ratings plus Job achievements and Initiatives achieved. A regular staff member is reviewed by their department supervisor and then Management; a supervisor is reviewed by Compliance and then Management; a Compliance supervisor goes directly to Management. Reviewer stages submit ratings for every indicator. Supervisors and Compliance provide Improvement areas, Suggestion/recommendation, and Justification; Management provides its ratings and a comment. HR has read-only access to completed results.

Open Appraisal periods on June 1 and December 1 and let each eligible staff member start their own assessment from My Performance. Development may start a test Appraisal outside those months. The Management assessment determines the Appraisal’s average score out of 5 and total points; the maximum total is derived from the number of snapshot criteria. Monthly KPI scoring remains based on the staff member’s ratings.

For staff who are not themselves supervisors, resolve the Supervisor stage from an explicit one-supervisor-per-department assignment. HR or Super Admin manages these assignments by choosing active staff from the department. Saving the assignment also sets the selected user’s `is_supervisor` flag so they can access review tools; the department assignment determines who receives new appraisal reviews. Snapshot the selected reviewer ID on appraisal creation so later assignment changes do not reroute work already started.

## Consequences

- `/my/performance` and `/performance/reviews` serve both cycle types and display/filter by type.
- `/hr/performance` remains the completed-results archive and displays Appraisal totals separately from averages.
- A period’s type and month form its uniqueness key, so monthly KPI and Appraisal windows can coexist in June and December.
- Changes to the rubric apply to future appraisals only because criteria are snapshotted when a staff member starts.
- Department supervisor assignments are the source of truth for routing new Supervisor-stage reviews. Changing an assignment affects newly started appraisals; existing appraisal reviewer snapshots remain unchanged.
- The source mentions “Average Total (50),” but the submitted list contains 49 indicators. Use the 49 supplied items until the missing indicator is provided; derive the total maximum rather than assuming 250.

# ADR-0013: Give MP and MD a server-loaded management overview

## Status

Accepted, 2026-10-16.

## Context and decision

Management needs a company overview and actionable approval queues rather than the personal staff dashboard. Keep `/dashboard` as the landing route, selecting the management surface on the server for MP/MD primary or secondary roles. Other roles retain the original dashboard. The management branch does not execute personal attendance, awards, rates, leave-balance or task-widget fetches.

One authenticated `/api/management/dashboard` endpoint returns aggregate data. Its controller explicitly requires an active MP/MD role; it does not inherit the broad Super-role middleware alias. Existing permission gates determine which pending approvals count. Loan/advance listing scopes use the existing review permissions so management can open the company requests counted here. No mutation endpoint or permission expansion is introduced.

The summary projects only needed fields and returns no employee identity, salary, medical reason, attachment or assessment snapshot. It covers active individual headcount and existing contract types, today's attendance, approved leave today/upcoming seven days, pending recruitment/leave/loan/advance decisions, weekday attendance for the last 30 calendar days, and department totals. Recruitment counts only the latest undecided submitted review for active management-stage candidates.

Attendance uses the existing Lagos wall-time storage and 9:05 a.m. minute-level threshold. Earliest arrival counts once per person/day. Future joining dates and past exit dates are excluded from expected attendance. Approved leave is classified separately, with its end date treated as resumption, including overlapping leave records without double counting. Weekends produce no missing-attendance expectation. A missing clock-in is labelled as unrecorded, never a confirmed absence or payroll deduction. Historical charts explicitly cover the currently active staff cohort on weekdays; no holiday/scheduling engine or attendance policy is added.

The page inherits compact shadcn components and the existing chart dependency. Four summary cards lead into actionable queue links and two charts. Loan and advance counts expose separate HR/Accounts review links with explicit status and unrestricted date filters, so older pending decisions remain reachable. Charts have empty states and expandable count tables. Every fetch is server-side and uncached; a refresh action and Lagos update timestamp make freshness explicit. API failures render the existing data-load error UI rather than fabricated zero totals.

## Validation and deployment

Isolated database tests cover primary/secondary access and denial, unique attendance, cutoff/timezone/weekends, joining dates, active/department accounts, leave resumption and overlap, latest recruitment reviews and actionable approval counts. Frontend tests exercise the actual role-routing page and API helper, including failure states and preservation of the personal branch. Desktop/mobile chart layouts are checked with synthetic data. No schema migration is needed. Deploy backend and frontend together.

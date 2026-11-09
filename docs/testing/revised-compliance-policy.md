# Revised compliance policy — 29 October 2026

## Agreed rules

- Effective date: 2026-10-29.
- Count confirmed occurrences in a rolling six-month window. Recommended steps
  have thresholds 2, 4, 6, 8, 12, 16, 22, and 28. Further substantiated misconduct
  after the highest step can require a formal termination review; there is no
  automatic numeric termination threshold.
- Recommend the highest applicable step when several thresholds are crossed.
- A threshold crossed again after a previous sanction is flagged for review.
  Re-entering the same threshold does not by itself justify increased punishment.
- Missed clock-in, clock-out, to-do lists and reports retain half an occurrence
  each for compliance counting. For attendance deductions, a missing clock-in and
  a missing clock-out are tracked separately: each attracts a half-day deduction
  from its third occurrence. If both are missing, each half-day deduction applies,
  subject to verification of approved leave/corrections and genuine system or
  recording errors.
- Lateness counting for payroll is per calendar month; the third and each later
  unauthorized late day attracts one day's deduction.
- Missed to-do lists and end-of-day reports are separate monthly categories.
  First/second misses receive warnings; the third and each later miss suggests a
  half-day deduction.
- Most offences count as one occurrence. Severity, evidence and impact may justify
  a higher occurrence value or stricter action; the review must document its basis.
- Attendance safeguards: notify a supervisor/HR promptly about missing submissions
  or clocking records; verify approved leave, authorised off-site work, system
  failures and other valid explanations before classifying an absence or applying
  a deduction; HR reviews monthly deductions and Compliance approves them at
  month-end; payslips are sent before salary payment for reconciliation.
- Occurrence points and a reviewed deduction may coexist. Payroll avoids adding
  the same attendance deduction twice through attendance and compliance.
- A repeated mistake is similar to a previously corrected/coached error. Linking
  a previous closed record with feedback is required for repeated/persistent
  client-error classifications.
- All active, individual supervisor accounts have company-wide compliance access:
  issuing queries, recording sanctions and verifying correction completion. This
  does not add payroll approval or unrelated user-administration permissions.

## Historical records and review evidence

New resolutions save a policy version, actual action step, and a snapshot of the
recommendation, window, totals, reviewer and decision date. Existing closed
decisions remain unchanged. Legacy confirmed values can contribute within the
rolling window; historical actions are not recalculated into new punishments.

First accidental client-data mistakes are recorded without occurrences or formal
sanctions. Related consequences are linked to the earlier incident; additional
points require a documented separate breach. Serious-misconduct suspensions and
termination require explicit confirmation of formal investigation and HR review.

The monthly review shows incident groups, occurrence points, pending/completed
corrections, feedback, deadlines, completion evidence, message dates, decision
dates and when the employee viewed details. It can be exported to CSV. These dates
describe recorded actions/views; they do not assert that every email was read.

## Activation

Run these backend migrations before deploying the matching code:

- `2026_10_29_000002_add_compliance_correction_timelines.php` (if pending).
- `2026_10_29_000003_version_compliance_decisions.php`.

The policy migration was applied to the verified local database during this task.
Production deployment and production migrations remain separate actions. Keep the
existing scheduler running for correction reminders.

## Verification

Backend: `CompliancePolicyTest`, `ComplianceCorrectionTest`, and
`RevisedCompliancePolicyTest` use isolated SQLite fixtures, fake mail, and a fixed
policy date. They cover thresholds and rolling boundaries, multiple-step
crossings, previously actioned thresholds, original-history preservation, client
error classification/coaching, ordinary-staff restrictions, company-wide
supervisors, correction completion, formal review, fractional occurrences,
calendar-month suggestions, clock-out/absence/approved-leave handling and payroll
deduplication.

Frontend: `lib/revised-compliance.test.mjs`, `lib/compliance-policy.test.mjs`,
`lib/compliance-guide.test.mjs`, and `lib/compliance-corrections.test.mjs` cover
permissions/navigation, highest-step presentation without auto-sanctioning,
re-entry warnings, staff guidance, API payloads and failure handling.

Local read-only checks confirmed the grid returns the new thresholds and rolling
period, and the monthly report endpoint returns successfully. Browser visual
verification requires a signed-in portal session; no visual sign-off is claimed.

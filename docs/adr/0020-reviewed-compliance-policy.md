# Reviewed compliance policy and decision snapshots

Payroll treatment and outcome entry were revised by
[ADR 0023](0023-occurrence-conversion-and-suspension-payroll.md) on 30 October 2026.

Accepted, 29 October 2026. The revised policy uses verified incidents in a rolling
six-month window and recommends the highest applicable threshold. Recommendations
are separate from recorded sanctions; re-entering a previously actioned threshold
is flagged for review without raising punishment merely because it recurred.

The Laravel compliance policy service owns counting, monthly deduction suggestions,
and recommendation metadata. Each new resolution saves its policy version,
recommendation snapshot, and actual action step. Existing decisions are preserved;
their previously confirmed occurrence values can contribute within the rolling
window, but their outcomes are never rewritten. New decisions use the revised
policy from 2026-10-29. A termination review is a discretionary reviewed action,
not a numeric automatic termination threshold.

Queries, correction follow-up, counted occurrences, and approved payroll deductions
remain distinct. A first accidental client-data error is recorded for correction
with zero occurrences. Similar repeated errors require a link to documented prior
feedback. Related consequences of one incident do not count again without a
documented separate breach. Monthly payroll suggestions remain subject to the
existing HR and Compliance approval workflow.

The human user explicitly authorized all supervisors to access company-wide
compliance records, issue queries and sanctions, and verify corrections. This adds
the compliance permission only; it does not grant unrelated administrative or
payroll approval permissions. Server checks remain authoritative.

# Occurrence conversion and suspension payroll

Accepted, 30 October 2026. Supersedes the per-incident compliance deduction
suggestions and combined occurrence/suspension decisions in ADR 0020.

The user confirmed that eight accumulated occurrences produce one payroll deduction
day. A suspension is a separate outcome: a one-day suspension produces one
deduction day and awards zero occurrences. The same decision therefore cannot add
both suspension days and points toward another payroll deduction.

Laravel owns the amounts. `CompliancePolicy::decisionAmounts` normalizes new
resolutions regardless of submitted form values. Ordinary outcomes store zero
direct deduction days; suspensions store zero occurrence points. Named one- and
three-day suspensions fix their respective durations; other suspension outcomes
require the officer to confirm the working-day duration. Existing formal-review,
evidence, client-error classification and coaching requirements remain enforced.

`PayrollService` normalizes saved decisions for the dependency-free
`CompliancePayrollCalculator`. Payroll converts newly completed groups of eight:
`floor(points through period end / 8) - floor(points before period / 8)`.
Remainders carry across payroll months, including fractional occurrences. This
payroll balance is distinct from the rolling six-month disciplinary recommendation
window. Recomputing a preview cannot charge a previously completed group again.

New decisions use their confirmation date in Lagos time, identified by the
`payroll_basis: occurrences-or-suspension` snapshot marker. Backdated incidents
therefore enter payroll when confirmed. Historical decisions keep their original
incident dates and explicit deduction days. Historical rows already carrying a
direct deduction do not also contribute points to conversion; historical suspension
rows never contribute conversion points. Existing attendance deductions and their
overlap protection remain in place. Saved payroll entries and closed runs are not
rewritten; the existing payroll review and approval flow still controls final pay.

The outcome dialog starts with the outcome, displays occurrences or suspension
days accordingly, and uses a compact disciplinary total. Query evidence is
available under a disclosure; coaching, related history and investigation controls
appear only where relevant. The generic salary-deduction field is removed.

Validation includes dependency-free PHP checks for amounts, cross-period carry,
fractional thresholds, independent suspensions, ignored pending/dismissed records,
historical explicit deductions and attendance overlap. Feature tests cover endpoint
normalization and backdated decisions; they require a working Laravel autoloader.

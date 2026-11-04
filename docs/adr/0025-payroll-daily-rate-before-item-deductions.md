# Payroll daily rate before item deductions

Accepted, 31 October 2026.

The user clarified that other deductions must not reduce the daily rate; tax is
the exception. Previously the rate base subtracted accommodation and all pre- and
post-tax item deductions, making an absence or suspension cheaper when a loan or
another deduction was added.

The shared calculator now determines the automatic daily rate from prorated gross
pay plus existing taxable additions, less the calculated/overridden tax amount,
divided by the month's working days. Existing salary proration and addition tax
treatment remain in effect. Accommodation and item deductions reduce take-home
pay after the rate is determined. Pre-tax items still influence the calculated tax;
only that resulting tax amount is deducted from the daily-rate basis.

Absence, half-day, unapproved-leave, late and compliance deductions all use this
same daily rate. Manual daily-rate overrides remain available. Net pay is still
capped at zero, independently of the daily rate. Existing saved payroll entries
are not rewritten; the revised rule applies when calculations run for a new or
edited entry, subject to existing payroll permissions and approval.

Snapshots record `daily_rate_base` and the basis marker
`after_tax_before_other_deductions`. The legacy `after_tax_accommodation` field
retains its meaning as pay remaining after accommodation/item deductions and
before day deductions. The rate field explains the automatic basis in the UI.

Regression tests cover pre-/post-tax items with fixed tax, recalculated tax,
accommodation, all day-deduction types, exhausted take-home pay and overrides.

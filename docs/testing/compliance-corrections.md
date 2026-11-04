# Compliance correction timelines

Corrections are separate from the occurrence's disciplinary outcome. Resolving with
`Resolved (No Action)` still records zero occurrence points and zero deductions,
even when a correction plan remains pending.

## Activation

- Run backend migrations, including `2026_10_29_000002_add_compliance_correction_timelines.php`.
- Keep Laravel's scheduler running. `compliance:correction-reminders` is registered
  daily at 09:00 Africa/Lagos and uses the existing email and Web Push channels.
- A reminder goes to the active officer who last saved the plan, provided that
  officer still has `manage-compliance` permission. Browser delivery requires a
  subscription. There is one successful approaching-deadline reminder and one
  successful overdue reminder per timeline; completed corrections are excluded.
- Editing only the correction text does not reset reminder delivery. Changing the
  deadline, reminder interval, or officer starts a new reminder timeline.

## Checks

1. Resolve an open query with no action and enable a correction timeline. Enter
   instructions, a deadline, and a reminder interval (default two days).
2. Confirm the query closes, its points/deductions remain zero, and its correction
   is still pending in the dashboard and the affected employee's own view.
3. Filter pending corrections; the closed query must remain visible. Open an older
   closed query and add a plan using **Set a correction timeline**.
4. On the configured reminder date, run the scheduled command twice. The officer
   should receive one reminder. Open its link to check it opens the occurrence.
5. After the deadline's end of day in Lagos, confirm the overdue status and one
   overdue reminder. Saving unchanged dates must not resend an earlier reminder.
6. Record completion verification as a compliance manager. Confirm it disappears
   from pending/overdue filters, appears under completed, and produces no reminders.
7. Verify an affected employee can read the plan but cannot edit or complete it.

Automated coverage: frontend `lib/compliance-corrections.test.mjs`; backend
`tests/Feature/ComplianceCorrectionTest.php` (isolated SQLite database).

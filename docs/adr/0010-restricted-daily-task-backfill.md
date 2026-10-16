# ADR-0010: Restricted daily task and report backfill

## Status

Accepted, 2026-10-16.

## Decision

Only the active account with ID `019c56b9-09c2-729b-84de-a13bfc2b8e8d`, the same individual who sees attendance's additional actions, can backfill daily tasks and reports for any employee. HR and Super receive no backfill exception. Attendance's early/late time changes and proxy flag mutations also enforce this exact account on the server; HR/Super no longer receive an exception. Ordinary attendance viewing permissions remain unchanged.

Use the existing General Tasks & Reports page and a compact dialog: employee and past date, load the record, edit tasks, save draft or submit. Page data includes a server-calculated capability and minimal employee options only for that account. The dialog fetches the selected record on request, never on mounting. The account receives access to the page/list even if its role does not normally show it. Other viewers retain their existing view permission; the backfill endpoints independently enforce the exact account check.

Only dates before today in Africa/Lagos are accepted. Missing records are created; existing unsubmitted records are updated. Submitted reports remain locked. A record fingerprint and user-row transaction lock prevent stale overwrites and duplicate creation. The original employee-owned daily save/submit endpoints, including today's questionnaire rules, remain unchanged; historical administrative submission uses its own path.

Per the requested discreet interface, there is no reason field, change-history panel or backfill badge, and no extra attribution metadata. Work dates are historical; record creation, first save and report submission timestamps remain actual timestamps. No schema migration or extra user role is required.

## Validation

Isolated backend tests cover the exact-account restriction (including HR/Super denial), inactive accounts, missing records, drafts, submission locks, real timestamps, stale versions and invalid dates/tasks. UI tests cover loading only on request, draft-to-submit versions, duplicate-click prevention, retained edits on errors and submitted read-only state.

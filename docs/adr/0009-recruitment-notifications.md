# ADR-0009: Recruitment notifications at actionable handoffs

## Status

Accepted, 2026-10-16.

## Decision

Use the existing notification count provider, bell, navigation badge and Clear all action. A dedicated recruitment notification table follows the existing task/deal notification pattern. Per-user source keys deduplicate deliveries; resolved and read alerts remain stored but leave the bell. Candidate deletion cascades alerts. No salary, grades or decision reasons enter notification previews.

Notify the uploading HR user of a failed CV generation; if unavailable, notify the responsible HR users. Group unread CV failures and submitted candidates by role. Management submissions notify active MP/MD/Super users with review permission, excluding the actor. Management decisions notify the active HR submitter, uploader and role creator, excluding the deciding actor; fall back to active HR/Super when no eligible owner exists. Exceptions such as a failed offer still notify the HR person performing that action.

Management submissions and decisions enqueue browser pushes only after commit. Push work uses the recruitment queue (database connection if the default is synchronous), rechecks recipient permissions and read/resolved state, and uses private previews. A pending role shortlist produces one push until resolved/read; individual decisions retain their own bell entries. Notification transport failure never rolls back a successful business action. No additional recruitment email channel is introduced; existing applicant offer email and admin workstation email remain.

CV retry/progression, new management submissions, decisions, stage changes and successful offer delivery resolve obsolete alerts. Offer failures are recorded server-side for mail errors and through an authenticated, generation-checked endpoint for PDF/client failures. PDF generation records failures from its server action even if the browser disconnects. Only the current unsent application can produce an offer failure alert. The existing completed-onboarding notification remains the HR completion signal.

An hourly scheduler checks current held candidates against their latest hold event and Lagos follow-up date. It records one alert per recipient/hold event, including overdue holds, without repeated reminders. Resume/rejection clears it. Follow-up links open status/history; management-decision links open the submitted review; CV and offer links open their existing overlays. Closing notification deep links clears the selected query so a later click can reopen the same applicant.

Workstation preparation moves from invitation delivery to successful onboarding completion. The admin alert links to inventory rather than restricted HR application forms. A queued job rechecks completion and records successful admin recipients in onboarding metadata to suppress repeated delivery. External mail success followed by a database failure still has the usual reconciliation limitation; mail is not transactional with the database.

## Deployment and validation

Apply backend migration `2026_10_16_000001_create_recruitment_notifications.php`. Restart queue workers and ensure they consume `recruitment`; keep the Laravel scheduler running for due follow-ups. No historical push or decision backfill is performed. Tests use isolated data and fake queue/mail/push, covering grouping, permissions, actor exclusion, deduplication, CV manual progression, hold timing/resume, generation guards, delivery resolution, private pushes, workstation completion, bell rendering and recipient-scoped clearing.

# ADR-0031: Persistent candidate communication steps

Accepted, 2026-11-01. Extends ADR-0026 and ADR-0028.

## Decision

Treat each eligible recruitment decision's candidate email as a pending workflow step until HR sends it or explicitly chooses Skip email. Closing the dialog does not resolve the step. Review email remains the applicant's primary action; further advancement and offer preparation require the previous communication to be resolved. Stage assessment work and status corrections remain available. Superseding lifecycle decisions invalidate obsolete invitations while retaining saved history.

Laravel owns structured field definitions and message generation for all eight templates. HR completes dates, interviewer/team, duration, interview focus, time options, delivery method, deadlines and instruction links as applicable. Selects, date inputs and conditional fields build a read-only preview. The server validates every required detail, duration limits, HTTPS links, deadline ordering and unresolved placeholders before delivery; arbitrary subject/body submissions cannot bypass this validation. Rejection messages need no additional template details. Dates and times use Africa/Lagos (WAT).

Persist partial fields using a candidate-scoped PATCH endpoint and save edits when the dialog closes. Incomplete fields are allowed in drafts, including unfinished links; sending applies strict validation. Explicit skip records an actor, status and skipped time without requiring fields or an address and without invoking mail delivery. Both pipeline and draft revisions protect against stale decisions and concurrent editing. A failed transport retains the fields and increments the draft revision; the interface reloads delivery state before retrying. An uncertain delivery remains pending for reconciliation rather than being automatically resent.

Role responses batch the small communication summaries alongside existing server prefills. Full email history and sender-specific signature previews remain on demand. Production-only HR CC, Reply-To, HTML signatures and management approval freshness gates remain authoritative.

## Deployment and verification

Apply backend migration `2026_11_01_000003_add_recruitment_email_drafts.php` for template_fields, draft_revision and skipped_at. The local development database has been migrated. Tests cover partial draft persistence/reopening, required and conditional details, read-only previews, no-send skips, concurrent writes, failed delivery recovery, pending action visibility and progression after explicit resolution.

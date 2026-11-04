# ADR-0033: Standalone recruitment emails

Accepted, 2026-11-01. Extends ADR-0026, ADR-0028 and ADR-0031.

## Decision

Add a Send recruitment email action beside Create rubric on the recruitment hub for HR and Super. HR enters applicant name/email and role title, selects one of the four stage pass/fail templates, completes its required details, then prepares an editable subject and message. Reuse Laravel's existing template definitions, validation, mail rendering, HTML signature and environment-specific recipients. All required details and unresolved placeholders are checked again at send time even when the message is edited.

Standalone correspondence lives in its own outbound-mail table because it has no required applicant or pipeline decision. It does not create or change recruitment candidates, scores, approval records or stage history. Drafts are saved explicitly and when closing; recent standalone emails allow resuming unsent work and reviewing sent messages. Initial template metadata/history/signature come from the server page; full saved messages are loaded on demand.

Each new message has a client UUID and revision. Lock draft writes, reserve sending before invoking the existing mail transport, and record transport acceptance or failure. Repeated identical requests for an already sent UUID return the saved result without resending. Uncertain sending states require reconciliation, while failed messages retain their editable copy for explicit retry. HR permission is enforced at every endpoint. Sender attribution and the HTML signature use the HR user sending; CC is HR in production only and Reply-To is always hr@aspomtravels.com.

## Validation and deployment

Apply migration 2026_11_01_000005_create_standalone_recruitment_emails.php. Cover all eight templates, external recipients, required/conditional details, edited copy, placeholders, revisions, draft recovery, duplicate sends, delivery failures, sender signatures, environment-specific CC and permissions. Use mail fakes and synthetic contacts for verification.

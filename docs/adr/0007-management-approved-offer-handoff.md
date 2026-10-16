# ADR-0007: Management approval hands offer preparation back to HR

## Status

Accepted, 2026-10-16. Extends ADR-0005: recruitment offers are now enabled after management approval.

## Decision

Management approval moves an applicant to `offer_preparation` (Offer & onboarding). HR sees Prepare offer, Continue offer, View offer or View onboarding directly in the recruitment table, according to the linked application and delivery status. Existing approved management-stage candidates remain eligible without silently recreating their reviews.

A compact HR dialog loads saved offer terms, confirms the recipient/name, position, effective date, gross salary and tax exemption, and reuses the existing payroll calculation, official offer/NDA templates, document storage and onboarding invitation sender. Nancy O. Peters is the fixed reporting manager for recruitment offers, enforced server-side. One HR action saves terms, generates PDFs and sends the package. No separate rubric, AI check or offer page is required.

Preparation and sending both validate the latest management approval, current evidence fingerprint and active applicant outcome on the server. Management cannot prepare or send new-flow offers. A role/candidate/application lock serializes competing prepares/sends. Existing onboarding applications are reused on retry. Preparing new terms invalidates previous offer/NDA metadata and creates a new document generation token; the PDF action stamps that token on generated metadata. Sending rejects missing documents or documents from an older preparation.

Candidate status becomes Offered only after the invitation mail call succeeds; preparation/PDF/mail failures retain the linked application without claiming delivery. Sent applications are not resent by repeating the normal action. Existing onboarding completion continues to mark the applicant Accepted/Hired and apply role-capacity closure. The workflow does not treat management approval itself as an offer or candidate acceptance. Mail transport success is recorded delivery to the transport, not proof that the recipient read or accepted the offer. An exceptional mail-success/database-commit failure still requires operational reconciliation; external email cannot share the database transaction.

HR can return an unsent offer to management review with a reason. A sent offer is managed through the linked onboarding application rather than reopening recruitment scores through offer preparation.

## Validation and deployment

No schema change is required; the existing stage field and onboarding form metadata hold this handoff. Restart the app/queue processes on deployment. Tests cover approval and permission gates, application reuse, required documents, mail failure, duplicate dispatch prevention, document-version mismatch, table actions, PDF-before-email order and retention of form edits after errors. Automated tests use fake mail and do not contact real applicants.

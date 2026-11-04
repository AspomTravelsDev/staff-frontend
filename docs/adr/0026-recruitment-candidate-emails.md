# ADR-0026: Reviewed candidate emails after recruitment decisions

Accepted, 2026-11-01.

Updated by ADR-0028 (HTML signatures and production-only HR CC) and ADR-0031 (persistent drafts, required structured details and explicit communication steps). The original local-only draft behavior below is superseded by ADR-0031.

## Decision

Laravel owns eight stage/outcome templates and sends reviewed, plain-text messages through its existing mail transport. HTML rendering escapes user content. Every message CCs and sets Reply-To to hr@aspomtravels.com, matching the existing formal offer email. Generic rejection wording avoids unsupported claims about other candidates or feedback availability.

HR can open Candidate emails from each applicant's actions. Progression to oral, written or practical assessments and stage rejection open the review dialog. Candidate, role and sender details are populated; HR edits dates, scheduling, deadlines and links. Unresolved square-bracket placeholders block sending. This review sends an email only; stage decisions and scheduling remain separate. No automatic sending or historical backfill occurs.

Only the latest lifecycle decision is eligible. CV decisions, holds, withdrawals, skips and practical progression to management do not create messages. Practical success requires current management approval and unchanged approved evidence. Management decline uses the final rejection template. An already sent formal offer suppresses a redundant success message.

A dedicated recruitment_emails table stores recipient, reviewed subject/body, sender, status and transport acceptance time, with one unique row per decision event. The candidate lock and revision prevent concurrent duplicate sends and stale decisions. Reserve sending status before external delivery; failed transport permits explicit retry with the saved message. Sent means accepted by the mail transport, not confirmed inbox delivery. An interrupted process or persistence failure after transport acceptance remains sending for manual reconciliation rather than risking automatic duplicate delivery. Failed retries update the same delivery record. Draft edits are local until sending and require confirmation before discard.

This extends ADR-0009's earlier restriction on recruitment email channels; internal bell/push notifications remain unchanged.

## Deployment and verification

Apply backend migration 2026_11_01_000001_create_recruitment_emails.php before deploying the new interface. No new queue worker is required. Tests cover template selection, privacy, HR CC/Reply-To, permissions, placeholder validation, stale revisions/decisions, deduplication, practical approval gating, failure and retry. Existing recruitment tests protect stage progression.

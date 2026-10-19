# ADR-0011: Align management sidebar links with page and API access

## Status

Accepted, 2026-10-16.

## Context and decision

MP and MD could see management navigation links while frontend role guards redirected them, and some APIs treated them as ordinary staff. Regression tests first reproduced redirects on General Requests, Announcements and Compliance, plus staff-only Compliance and Payment Link data scoping.

General Requests and its close/comment control explicitly admit MP/MD primary and secondary roles. The existing manage-requests server permission already grants company-wide management access and remains authoritative.

Announcements admits MP/MD at the page guard and uses the existing view-announcements-admin permission consistently on the server to recognise reviewers. Existing announcement publication/visibility rules remain unchanged.

Compliance uses one manage-compliance permission for company-wide records, stats, sanction grids, review actions, reply indicators and clearing admin notifications. Its role assignments preserve the previous Super/Admin/HR/Compliance/Office Operations access and add MP/MD, including secondary roles. Staff retain access to their own records only. No global Super-role alias is introduced.

Payment Links grants Account/Super/MP/MD company-wide reading and export. Accounts/Super retain payment creation, cancellation, checkout/share and verification controls. API capability flags distinguish viewing all requests from managing them, and management page copy describes the company-wide scope.

The remaining active management sidebar destinations were checked for page guards and backing API policies: CRM, inventory, attendance viewing, employee lists, onboarding applications, leave, payroll, anonymous comments, celebrations, daily reports, delegated deliverables, recruitment, payment confirmations, invoices and outstanding payments. Existing workflow-specific approvals remain in place. Hidden sidebar tools are not restored. Attendance corrections and daily-report backfilling remain restricted to the separately designated account; management recruitment access does not grant HR offer preparation.

## Validation and deployment

Tests exercise actual page guards with primary/secondary management roles and guests/ordinary staff, company-wide management API data, announcement review, compliance reply state, staff scoping, payment exports and denial of payment mutations. Regression runs also cover attendance and task-backfill restrictions. Tests use isolated databases and fake mail/payment transport. No schema migration is needed. On deployment, refresh cached Laravel configuration if enabled and restart long-lived processes so the new permission registration loads.

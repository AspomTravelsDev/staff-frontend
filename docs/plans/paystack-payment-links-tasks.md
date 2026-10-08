# Accounts payment links — task tracker

Updated: 7 October 2026 (Africa/Lagos)
Status: Implementation and automated checks complete locally. Provider setup and release validation remain.

Plan: [paystack-payment-links.md](./paystack-payment-links.md).

Update this file as work progresses. Mark tasks complete only when their acceptance criteria pass. “Owner” identifies the part of the project, not an assigned employee.

## Completed planning

- [x] Add name/email fields to the payment form; Create link saves CRM customer and request together. Validate role access, required details, existing emails, and rollback on failure.

- [x] Inspect existing invoice/payment records, outstanding balances, and Accounts role restrictions.
- [x] Draft scope, staff/client flows, accounting boundaries, and release checks.
- [x] Create this implementation checklist.

## Implementation

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
| --- | --- | --- | --- | --- | --- |
| PL-01 | Confirm collection account, standalone-payment approval, fees, and related-staff visibility | Business decisions | Plan review | Decisions recorded; invoice and confirmation posting rules unambiguous | User confirmed clients pay fees and only Aspom Travel standalone payments create confirmations; collection account needs live confirmation |
| PL-02 | Add request, attempt, activity, and unread-update storage | Backend | PL-01 | Reviewed reversible migrations; unique references; integer money; recipient privacy | Done; local migration applied |
| PL-03 | Configure Paystack service and test/live separation | Backend/configuration | PL-01 | Server-only secrets; mode separation; usable setup errors; test checkout initialization works | Code done; local test secret added; real checkout pending |
| PL-04 | Build Accounts request APIs and permissions | Backend | PL-02 | Create from invoice or standalone; fixed deposit/full amount; validated balance; history; cancellation/replacement | Done |
| PL-05 | Build public request and checkout endpoints | Backend | PL-03, PL-04 | Unguessable URL; minimal public data; server-controlled payment details; expired/paid/cancelled requests cannot start a new checkout | Done; provider calls verified with fakes |
| PL-06 | Implement webhook and verification reconciliation | Backend | PL-02, PL-03, PL-05 | Valid signatures and matching reference/amount/currency/mode; duplicate/concurrent delivery safe; return URL cannot fake payment | Done; database row locks reviewed; simultaneous-provider check pending |
| PL-07 | Integrate existing accounting records | Backend | PL-01, PL-06 | Invoice payment recorded once; balances correct; Aspom Travel standalone review preserved; Travelatal and ABS standalone receipts kept separate; late/extra/mismatched receipts flagged | Done |
| PL-08 | Build Accounts page, stats, and table | Frontend | PL-04 | Attendance-style table; all requests default; Needs attention → Awaiting → Paid → Cancelled → Expired before pagination; always-visible filters; rows/page and range counts; project stat style | Implemented; full-list ordering, filters, page-size, and pagination-boundary tests pass; visual check pending |
| PL-09 | Build create/actions/details and invoice shortcut | Frontend | PL-04, PL-08 | Focused dialogs; action popover; details sheet with automatic direct-link preparation and Copy for authorized unpaid requests; invoice prefill; cancelled rows have details/replacement and a status check only when an attempt exists; reliable errors/loading states | Implemented; visual walkthrough pending |
| PL-10 | Build client payment and result pages | Frontend | PL-05, PL-06 | Neutral public layout/metadata/support wording; purpose/amount display; secure checkout redirect; retry; verified result; receipt retains correct issuer branding | Implemented; real checkout walkthrough pending |
| PL-11 | Add email, WhatsApp preparation, QR, and send history | Full stack | PL-05, PL-09 | Copy, email, WhatsApp, and QR use the direct Paystack URL; pending attempt reused; preparation failures do not fall back to portal URLs; actual send outcomes recorded | Implemented; direct sharing tests pass; attendance QR reused; external delivery/scan check pending |
| PL-12 | Add receipts and CSV/Excel exports | Full stack | PL-07 | Invoice styling/company branding; same verified staff/customer document; correct references/amounts; partial balance preserved; simulated development test balances labelled; no credit implied for unposted receipts; request amount/fee/total separate; filtered exports; no unverified receipt | Done; receipt/export checks pass; generated NGN invoice, test invoice, USD standalone, and long-content PDFs rendered and visually checked |
| PL-13 | Add bell/sidebar/push payment updates | Full stack | PL-06, PL-08 | Relevant recipients only; payment-request navigation; recipient-scoped read receipts; update survives failed push | Done; portal/push failure tests pass |
| PL-14 | Add staff guide and help text | Frontend | PL-09, PL-11, PL-13 | Guide matches actual screens and distinguishes verified payment from internal review and bank settlement | Implemented; browser walkthrough pending |
| PL-15 | Verify payment and accounting edge cases | Tests | PL-06, PL-07, PL-12, PL-13 | Permission, signature, mismatch, duplicate/concurrency, stale balance, expiry/cancellation, reversal, fees, and delivery-failure tests pass | 43 payment + 9 frontend receipt/export checks pass; real simultaneous database test pending |
| PL-16 | Complete test-mode walkthrough and UI checks | Validation | PL-08 through PL-15 | Client-to-Accounts flow demonstrated; desktop/mobile checked; lint/types/build pass | Automated checks pass; real checkout and browser connection pending |
| PL-17 | Configure and release live integration | Deployment | PL-01, PL-16 | Reviewed migrations applied; HTTPS webhook configured; account mapping confirmed; controlled live payment approved and verified | Pending; no deployment or real payment performed |

## Deferred

- [ ] Automatic unpaid-client reminders.
- [ ] Refund initiation and approval inside the portal.
- [ ] Settlement reconciliation with bank payouts.
- [ ] Reusable service payment pages.
- [ ] Multiple Paystack collection accounts and currencies.

## Current next step

Test credentials are set locally. The Windows certificate issue is fixed. The user's existing test payment was verified with Paystack and corrected to Paid after matching the original NGN 40,000 request and the NGN 710.66 customer-paid fee. Both local migrations are applied. Development test accounting is now enabled locally. The existing test payment was reverified and recorded once against SEP002/2026, leaving its balance zero and status Paid. Invoice history labels the entry Paystack (test); no real money was collected. Configure the public webhook, then complete the broader test checkout and desktop/mobile walkthrough in [the setup checklist](./paystack-payment-links-setup.md). No live payment, client message, or deployment has been performed.

Automated evidence: `php artisan test tests/Feature/PaymentLinksTest.php` passes 53 tests / 805 assertions, including direct sharing, certificate verification, safe connection diagnostics, ambiguous-attempt recovery, full-list status ordering before pagination, page sizes and bounds, combined filters/export/privacy, manual verification without a webhook or client callback, customer-paid fees and receipt eligibility, fee-only mismatch recovery, and duplicate-posting/refund safeguards. The 3 existing invoice tests passed during the initial feature validation. `node --test lib/types/payment-links.test.mjs lib/utils/payment-link-files.test.mjs` passes 9 receipt/export checks. Types, targeted lint, and the production build pass. Receipt PDFs were rendered and visually inspected, including company logos, test markings, partial balances, and long-content pagination. Browser automation previously timed out, so desktop/mobile page checks remain outstanding.

Development full-flow coverage includes invoice deposits/final balance, customer-paid fees, Aspom Travel standalone NGN/USD review, Travelatal/ABS separation and repeat-check safety, invoice posting for all subsidiaries, rechecking an older verified test receipt once, production ignoring the test-accounting setting, and reversal/mismatch/stale-balance safeguards.

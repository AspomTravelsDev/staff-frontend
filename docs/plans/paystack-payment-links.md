# Accounts payment links — implementation plan

Prepared: 7 October 2026 (Africa/Lagos)
Status: Implemented locally; provider setup, visual walkthrough, and live release remain.

## Outcome

Accounts staff can create a fixed-amount payment request, share its link with a client, and track verified payments inside the portal. Requests can be created independently or from an existing invoice. Clients pay through Paystack without needing a staff login.

The portal already has invoices, invoice payment history, payment confirmations, outstanding balances, role checks, email sharing, and portal/push notification infrastructure. Reuse those capabilities where appropriate.

## First release

- NGN and USD standalone requests, fixed amounts, one company Paystack integration initially. Existing invoice requests remain NGN. USD collection requires eligibility and enablement on the company Paystack account.
- Accounts and Super access, matching existing invoice permissions. Related staff may receive a relevant payment update without gaining Accounts access.
- Create from an invoice or as a standalone request. Select a client, payment purpose, amount, due date, subsidiary, and responsible staff member.
- Add new customer switches the client selector to name/email fields within the same payment form. Create link saves the CRM customer and payment request in one transaction, so a failed request leaves no customer behind. Accounts/Super creates a normal CRM record with contact person set to the name, Potential status, Other service/source, the selected responsible staff, and a note identifying quick creation. More details can be added in the CRM later. Existing emails (including archived records) are rejected without overwriting a customer. Client lookup supports name/email and excludes archived records.
- Full invoice balance or a specific deposit/instalment. Each request has its own fixed amount; partial invoice payment does not make that request partially paid.
- Copy the direct Paystack checkout link, prepare a WhatsApp message, send email, and download a QR code encoding that same link. Record email outcomes and sending history; copying a link does not imply it was delivered.
- Clients open Paystack directly from shared links. The public page uses a generic Payments header, neutral support wording and page metadata, no company name/footer, and no staff-app install prompt. Downloaded receipts retain the correct issuer branding. The neutral public payment page remains for callback, status, verified receipts, and retry; payment credentials are entered only on Paystack checkout.
- Verified payment record, downloadable receipt, payment attempts, and activity history.
- Cancel, expire, resend, or replace unpaid requests. Preserve the original record and its audit history.
- Search/filter, CSV/Excel export, portal notifications, push notifications, and a Driver.js guide.

## Staff experience

Accounts → Payment Links, at `/accounts/payment-links`.

Use the project’s shared compact stat cards: Awaiting payment, Needs attention, Overdue requests, and Received this month, with the two important counts first. A request is overdue when its payment due date passes; expiry is a separate cutoff after which the portal cannot generate or share checkout links. It does not deactivate previously issued Paystack URLs.

Use one attendance-style table with no status tabs. Show all requests by default, ordered Needs attention → Awaiting payment → Paid → Cancelled → Expired, with newer requests first within each status. Apply this order on the server before pagination. Status, search, subsidiary, currency, creator, and created-date filters remain visible above the table. Clear filters restores all requests. Use the project's shared selects and date-range picker. Pagination includes 10/25/50/100 rows per page, Previous/Next arrows, page counts, and “Showing X–Y of Z.” Clamp pages if the filtered list shrinks. Exports include all matching requests across pages; visibility and test/live separation still apply.

Table columns: Client · Purpose/Invoice · Amount · Created by · Due date · Status · Actions.

Keep actions in a row popover. The details sheet contains request details, payment attempts, receipt information, and activity/sharing history. For Accounts/Super users opening a current unpaid request, prepare/reuse the direct Paystack checkout link automatically and show it in a read-only field with Copy. Record sharing history only after copying succeeds. Link preparation failures have an inline retry and do not block reading details. Paid, cancelled, expired, and review requests do not offer the copy field; related staff without sharing permissions retain a read-only view. Creation, sharing, and cancellation use focused dialogs. Add “Create payment link” to an invoice’s actions and prefill its client and balance.

Use readable dates in Lagos time and clear language throughout. Do not show technical transaction states as unexplained staff-facing labels.

## Request and payment lifecycle

Keep request state separate from transaction-attempt state:

- Request: awaiting payment, paid, expired, cancelled, or needs attention.
- Attempt: initialized, pending, successful, failed, abandoned, or reversed, with Paystack’s verified status retained.
- A failed attempt does not cancel the request; the client can retry with a new unique attempt reference.
- Verified success means money was received through Paystack. It does not mean settlement to the bank or internal Accounts approval is complete.
- Lock paid request details. Changed amounts or purposes require a replacement request rather than editing an issued request invisibly.

The portal retains a stable, unguessable public URL for callback, status, and receipts. Staff copy, WhatsApp, QR, and email actions prepare checkout on the server and share the direct Paystack authorization URL. A pending attempt's URL is reused across these actions. No portal URL is substituted if preparation fails. Opening the portal page does not start a charge; its Pay button uses the same validation and initialization service for retry.

Check cancellation, expiry, successful payment, and the current linked balance before generating or sharing checkout. Prevent concurrent attempts where possible. Cancellation or expiry cannot guarantee that a previously shared Paystack URL stops collecting money: any later successful charge must still be recorded and flagged for reconciliation.

## Payment confirmation and accounting

1. Initialize checkout on the backend with a unique reference, integer minor units (kobo for NGN, cents for USD), the request currency, customer email, and request/invoice metadata. Enforce Paystack's minimum NGN 50 / USD 2 amounts.
2. Process verified Paystack success notifications independently of the client returning to the portal. A return URL is not proof of payment.
3. Validate the webhook signature against the raw request body. Confirm the reference belongs to this request and validate amount, currency, and test/live mode. Clients pay provider fees on top of the requested amount. Accept a higher total only if Paystack's `requested_amount` equals the stored request and its verified fee exactly explains the difference. Store the original requested amount, actual total, and fee separately. Exact request amounts continue to verify without a fee surcharge.
4. Use a shared reconciliation operation for the webhook and return/status checks. Lock affected records and enforce unique provider transaction/reference constraints so repeated or concurrent notifications cannot create duplicate receipts or accounting entries.
5. Store the verified receipt and portal updates before push delivery. A failed notification must not lose the payment. Email sharing is explicit and records failures for staff to retry.
6. Invoice-linked requests: post the requested amount once to the existing invoice payment history and recalculate its balance; customer-paid provider fees are not credited against the invoice. Recheck balance under a lock. If an invoice has been paid elsewhere, record the real charge and flag it for Accounts rather than silently discarding it or making the balance negative.
7. Standalone requests: only Aspom Travel creates a pending Payment Confirmation after successful verification. Travelatal and ABS retain their verified payment evidence in Payment Links only. Keep internal approval separate from Paystack verification. A single charge must not update both invoice and outstanding-payment balances without an explicit accounting relationship.
8. Keep mismatched, unexpected, duplicate successful attempts, late charges, and reversed charges visible in Needs attention. Never silently classify them as ordinary paid requests.

## Data and API outline

Backend in `staff-backend`; staff and public UI in `staff-frontend`.

Proposed records:

- Payment request: UUID, public token, reference, client/invoice links, subsidiary, responsible staff, creator, purpose, currency, amount in minor units, due date, expiry, state, and cancellation/replacement metadata.
- Payment attempt: request, unique Paystack reference and transaction ID, expected amount, provider-confirmed original requested amount, actual total and fee, verified currency/mode, status, checkout identifiers, payment channel, timestamps, and reconciliation outcome.
- Activity log: creation, replacement/cancellation, sharing attempts, verified payments, and accounting/reconciliation decisions.
- Unread payment updates: recipient, request, message, and read receipt. Reuse the notification aggregation pattern; do not store payment notifications as task-tracker notifications.

Endpoints should cover staff list/stats/create/details, share/cancel/replace, receipt/export, authorized read receipts, public request summary, checkout initialization, public status/return handling, and a signed Paystack webhook outside staff authentication.

Use server-controlled fields for the amount, client, reference, and account; the public browser cannot supply alternative payment details. Do not expose internal notes, client records, or staff details on the public page. Store secrets server-side and keep sensitive payloads out of logs.

## Sharing, receipts, and notifications

- Email uses the configured mail service with an explicit Send action. WhatsApp prepares a message for the staff member to send; it does not automatically message clients.
- Copy, WhatsApp, email, and QR use the direct Paystack checkout URL returned by server-side initialization. QR codes encode this same URL. Non-email sharing history requires an attempt reference belonging to the request.
- Receipts reuse the invoice company/logo presets and its blue heading, item table, and totals styling, with the title Payment Receipt. Both staff and customer downloads use the same verified, allowlisted data. Include receipt number, request/invoice reference, payer, request amount, client-paid fee, total paid, Lagos payment date, Paystack reference, and payment method. Show the current invoice balance only after a posted payment. Enabled development test payments display Test invoice balance and a simulated-payment notice; unposted receipts never imply an invoice credit. Preserve a partial balance and flag payment review where applicable. Public receipt access is tied to an unguessable token, not a sequential record ID. Ordinary receipts fit one page; long content continues with page numbers.
- Cancelled requests keep View details/history and Create replacement. Check payment status is shown only when an attempt exists, to reconcile a late charge; sharing and cancellation actions are hidden.
- Portal bell entries open the relevant request. Sidebar counts include unread payment updates and clearly labelled items requiring action.
- Notify the appropriate Accounts recipients and the responsible staff member. Limit recipients by role/record visibility. Push is additional delivery, not the only copy of a payment update.
- Reading a request clears only updates loaded for that recipient. Clear all clears informational unread updates, while unresolved action counts remain.

## Decisions to settle before implementation

Recommended defaults are recorded below; these are business decisions, not Paystack guarantees.

| Decision | Recommended starting point |
| --- | --- |
| Company/subsidiary collection accounts | One company Paystack account; store subsidiary as a reporting field. Confirm whether any subsidiary requires a separate account before live use. |
| Accounting for standalone receipts | Only Aspom Travel standalone receipts enter pending Accounts confirmation review. Travelatal and ABS stay in Payment Links. Existing confirmations are retained; no automatic duplicate posting to unrelated balances. |
| Fees | Confirmed by user: clients pay fees on top. Keep Paystack's Pass fees to customers setting enabled. Verify the original amount and exact fee difference; receipts show request amount, client-paid fee, and total separately. |
| Expiry | Optional; due date triggers overdue status, expiry blocks new checkout attempts. |
| Refunds | Record/handle through Accounts reconciliation initially; automated refunds are a later release. |
| Related staff visibility | Notify them only about their relevant requests, with a limited detail view if they lack Accounts permissions. |

## Validation and rollout

Test permissions and public-data exposure, monetary precision, invoice/deposit limits, success and failure/retry, abandoned checkout, forged webhook/return URLs, wrong amount/currency/mode, duplicate and concurrent notifications, changes in invoice balance, late payment after expiry/cancellation, payment reversal, and push/mail failures. Test receipt/export access and unread read-receipt boundaries.

Run backend feature tests and frontend lint/type/build checks. Walk through staff creation, client checkout, paid result, invoice allocation, notification navigation, and details on desktop and mobile.

Develop and demonstrate in Paystack test mode first, with development test accounting enabled for the full flow. Before live rollout, configure the live integration and a public HTTPS webhook, apply reviewed migrations, confirm subsidiary/account mapping and accounting rules, and run an approved controlled live payment. Never paste secret keys into chat or source control. Keep test-mode data visibly separate from live reporting. Development can enable `PAYSTACK_TEST_ACCOUNTING=true` to simulate the full invoice and Aspom Travel standalone Accounts review flow with Paystack (test) entries; only local/development/testing environments permit it. Production never posts test payments. Rechecking an older verified test receipt can record it once after a fresh provider check, while preserving all balance, mismatch, duplicate, and reversal guards. NGN and USD received totals are always separate.

Implementation setup and remaining checks: [paystack-payment-links-setup.md](./paystack-payment-links-setup.md).

Later releases: automatic client reminders, provider refund actions, settlement reconciliation, reusable service pages, multiple collection accounts/currencies, and advanced reporting.

## Official references

- [Accept payments and generate checkout links](https://paystack.com/docs/payments/accept-payments/)
- [Verify payments](https://paystack.com/docs/payments/verify-payments/)
- [Webhook signature validation and retries](https://paystack.com/docs/payments/webhooks/)
- [Reusable Payment Pages](https://paystack.com/docs/api/page/)

Execution checklist: [paystack-payment-links-tasks.md](./paystack-payment-links-tasks.md).

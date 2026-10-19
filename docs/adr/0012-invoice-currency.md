# ADR-0012: Store currency on each invoice

## Status

Accepted, 2026-10-16.

## Context and decision

Invoices previously assumed NGN throughout creation, documents, email, payment recording and statistics. Payment Links already supported standalone USD requests, but invoice-linked requests were NGN-only.

Add a non-null `invoices.currency` with NGN default, limited to NGN/USD at the API boundary. The additive migration labels existing invoices as NGN without changing any amounts or payment records. Currency is selected per invoice; no exchange-rate service or automatic conversion is introduced. Existing payment rows inherit the parent invoice currency.

Invoice currency becomes immutable after any payment, successful email, an email being sent, or creation of a payment link (including cancelled or expired links). Invoice updates, payment recording, link creation and send preparation lock the invoice row. Draft currency changes in the UI require confirmation when prices or draft payments exist, then clear those values and reset payment instructions. Existing payments cannot be relabelled. The payment recorder is unavailable until an edited currency is saved. USD instructions are entered by Accounts, rather than reusing NGN preset accounts.

Invoice-linked payment requests inherit currency when omitted and reject an explicit mismatch. Checkout also rejects a mismatch; reconciliation holds any historical or inconsistent mismatch for Accounts review without posting a payment. Receipt balances are only shown for posted payments in the matching currency. Existing provider verification, fee handling and idempotency are retained. USD gateway collection still depends on currency enablement on the connected Paystack account.

One shared frontend formatter uses explicit currency codes for invoice previews (the source of PDF/image downloads), history and payment records. Email uses the persisted invoice currency. The send action unwraps the returned invoice so the UI locks currency immediately after success.

Invoice statistics expose `totals_by_currency` for paid and outstanding amounts. Legacy `total_paid`/`total_unpaid` fields remain NGN-only for compatibility; mixed-currency totals are never produced. Invoice listing accepts a currency filter.

## Validation and deployment

Isolated database tests cover additive migration/rollback compatibility, unchanged legacy amounts, NGN defaults, USD totals and payments, currency locks, filtering, mismatched/manual payments, USD link minimums and inference, duplicate reconciliation, unsafe legacy links, and email rendering/locking. Frontend tests render the actual preview and exercise API actions and currency filtering. No live mail or payment requests are used.

Deploy the additive `2026_10_16_000002_add_currency_to_invoices.php` migration before serving the updated API/frontend. Configure appropriate USD payment instructions when creating an invoice and enable USD at the payment provider before collecting USD online.

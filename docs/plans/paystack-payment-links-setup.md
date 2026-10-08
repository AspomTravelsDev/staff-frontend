# Paystack payment links — setup and release checks

Updated: 7 October 2026. The feature is implemented locally; it is not live.

## What staff can use

- Accounts → Payment Links (`/accounts/payment-links`): fixed NGN or USD client requests, or NGN requests from an invoice. An attendance-style table shows all requests by default, ordered Needs attention, Awaiting payment, Paid, Cancelled, then Expired. Search/status/subsidiary/currency/creator/date filters stay visible; Clear filters restores the full list. Pagination provides 10/25/50/100 rows per page, record ranges, page counts, and Previous/Next arrows. Received totals keep NGN and USD separate.
- Invoice history → Payment link: prefill the invoice and current balance.
- Actions: copy the direct Paystack link, explicitly email it, prepare WhatsApp with it, and show/download the existing attendance QR component encoding it. Also check payment status, download a verified receipt, cancel, or replace an unpaid request.
- Details: read-only request information, attempts, provider fees, and activity/sharing history. Quick guide uses Driver.js.
- Related staff → Account → My Payment Links: their related requests and verified receipts, without Accounts management permissions.
- Clients open Paystack directly from the shared URL or QR. After payment, Paystack can return them to `/pay/{unguessable-token}` for status and a verified receipt. This public page also supports checkout retry; no staff login is required.

## Configure the backend

Keep credentials in the backend `.env` or hosting secret settings. Do not put them in the frontend, source control, or chat.

```dotenv
FRONTEND_URL=http://localhost:3000
PAYSTACK_MODE=test
PAYSTACK_TEST_ACCOUNTING=true
PAYSTACK_TEST_SECRET_KEY=
PAYSTACK_LIVE_SECRET_KEY=
```

The test secret has been added locally; an actual Paystack checkout walkthrough remains pending. `FRONTEND_URL` must be the actual client-accessible frontend when testing externally. Production needs its HTTPS frontend URL. The frontend server's `API_URL` must point to the corresponding backend.

Local Windows PHP had no configured CA bundle and returned cURL error 60. Paystack requests now use Windows' trusted certificate store when no PHP CA bundle is configured, keeping certificate verification enabled. The actual Paystack verification API was reached successfully and confirmed that the failed local test checkout reference did not exist; that attempt was released for retry. Paystack's “Transaction reference not found.” response is accepted with or without its trailing full stop. Other provider errors keep ambiguous references reserved. Connection diagnostics log only mode, operation, and the cURL error number, without keys or customer data. See [cURL native certificate verification](https://curl.se/libcurl/c/CURLOPT_SSL_OPTIONS.html).

Both local migrations below have been applied. On another environment, apply them after the existing invoice-payment and payment-confirmation migrations:

```text
php artisan migrate --path=database/migrations/2026_10_07_090000_create_payment_links.php
php artisan migrate --path=database/migrations/2026_10_07_130000_add_requested_amount_to_payment_link_attempts.php
php artisan config:clear
```

Configure the webhook in Paystack as the public HTTPS backend URL plus `/api/paystack/webhook`. It must be reachable without a staff login. The handler validates the raw-body signature and verifies successful transactions directly with Paystack. Test and live keys are separate.

### Production checkout diagnostics

Set the Paystack variables on the Laravel backend host, including Hostinger, rather than Vercel. The Live payments badge reflects the backend's effective configuration. A purpose such as THIS IS A TEST PAYMENT does not change the request's stored payment mode. Changing PAYSTACK_MODE affects newly created requests; existing requests keep their original mode.

For live collection, use `PAYSTACK_MODE=live`, `PAYSTACK_LIVE_SECRET_KEY=sk_live_...`, and `PAYSTACK_TEST_ACCOUNTING=false`. Keep `APP_ENV=production`, `APP_DEBUG=false`, and FRONTEND_URL pointing to the public HTTPS portal. To run a money-free test on the hosted application, set mode=test with the test secret and create a new test-mode request. Production test receipts do not update accounting balances.

After deploying the backend diagnostic changes, run from the backend application directory:

```text
php artisan config:clear
php artisan config:cache
php artisan paystack:diagnose
```

The diagnostic prints the effective environment, cached configuration state, payment mode, log channel, return URL validity, and whether a key with the matching prefix is present. It probes a randomly generated nonexistent transaction reference using GET to test authentication and connectivity; it creates no payment request, checkout, or charge and does not display keys or customer details. An accepted diagnostic does not establish account eligibility to initialize a live checkout; if checkout still fails, inspect the initialization failure log.

To verify configured test and live keys separately, use `php artisan paystack:check-keys`. Use `--mode=live` or `--mode=test` to select one. The command reports PASS, FAIL, or INCONCLUSIVE; a missing optional key in the default all-key check is skipped. Invalid prefixes and whitespace are rejected before contacting Paystack. It uses read-only verification probes and creates no payment records or checkout links.

To check a freshly copied live key independently of Laravel's cached configuration, run:

```text
/opt/alt/php82/usr/bin/php artisan paystack:check-keys --mode=live --prompt
```

Paste at the hidden prompt, never into the command line. The key is used only inside that command process, never displayed or saved, and original loaded configuration is restored on success or failure. If the pasted key passes but the configured check fails, update the backend environment and refresh cached configuration. If both fail, resolve the key or Paystack access issue before retrying checkout. This checks authentication, not live currency eligibility.

HTTP provider rejections previously returned a handled 503 without logging; this can explain an empty Laravel log and no Vercel exception. They now log `Paystack request failed.` with operation, mode, HTTP status, a safe failure category, and an internal reference/currency when available. Rejected authorization (401) also produces an actionable message. Provider bodies, raw messages, authorization headers, and customer details are not logged. TLS and connection failures continue logging a safe cURL error number; reserved attempts remain protected against accidental duplicate initialization.

For a conventional Laravel file log, use `LOG_CHANNEL=stack`, `LOG_STACK=single`, and `LOG_LEVEL=warning`, then refresh cached configuration. Read `storage/logs/laravel.log` on the backend host after retrying. A daily log channel writes dated files instead; ensure the backend process can write to its storage directory. Vercel receives the handled API error, so it is not the source of the Paystack rejection log. Do not enable APP_DEBUG or share secret keys to troubleshoot.

No additional QR package is required. The existing QR image providers are reused, with the loaded image used for download. QR images encode the direct Paystack checkout URL, matching copy, WhatsApp, and email. Checkout is prepared on the first sharing action and its pending URL is reused. Existing jsPDF and JSZip packages provide PDF receipts and Excel exports.

Accounts/Super can also copy from the details sheet for a current unpaid request. Opening the sheet prepares/reuses its direct Paystack checkout URL; Copy uses the prepared URL and records the action in sharing history. Preparation errors are shown with retry, without hiding the request details. Other request statuses and related staff without sharing permissions do not get this field.

Cancelled rows keep details/history and Create replacement. Check payment status appears only if an attempt exists, because an issued link may still accept a late payment.

The public payment page at `/pay/{token}` uses a separate neutral Payments layout: no Aspom header/footer, company display, or staff-app install prompt. Its payment verification and callback URL are unchanged.

Receipts download on the public payment confirmation page after server verification, as well as through the staff table. Downloaded receipts retain the correct company branding. They use the same verified data, company/logo presets, and invoice styling. Invoice company contact overrides are respected; internal notes, bank instructions, client contact fields, and invoice items are excluded from the public payload. A current invoice balance is shown only after an invoice payment is actually recorded. Development test receipts label it Test invoice balance and state that it reflects simulated payments. Unposted receipts do not imply an invoice credit.

Expiry and cancellation stop the portal from generating or sharing checkout links. They do not deactivate a Paystack link already issued; a later successful charge is retained and flagged for Accounts review.

## Verification without a connected webhook

Accounts can use Actions → Check payment status to verify the most recent checkout directly with Paystack. This checks the reference, amount, currency, mode, and payment time before updating the request, accounting records, and portal/push updates. Repeated checks do not duplicate accounting or notifications. The action reports whether payment was verified as paid, remains awaiting confirmation, or needs Accounts review.

The client's return page also verifies the reference when Paystack redirects back after checkout. If the client closes checkout without returning, Accounts must check manually while no public webhook is connected. The staff Refresh button and the one-minute list refresh only reload saved portal data; they do not contact Paystack. The public page's Check payment status button does contact Paystack. A public callback URL must be reachable on the client's device, so local testing on another device cannot use localhost. Connect the HTTPS webhook before relying on automatic payment updates when clients do not return.

## Accounting rules

- Confirmed policy: clients pay Paystack transaction fees in addition to the request amount. Keep Settings → Preferences → Transaction fees → Pass fees to customers enabled in Paystack. The portal accepts a higher total only when Paystack's verified original `requested_amount` equals the stored request and `amount - fees` equals that same request amount. The portal does not calculate a markup or treat arbitrary overpayments as fees. See [Paystack fee settings](https://support.paystack.com/en/articles/2130306).
- Receipts display request amount, client-paid fee, and total charged separately. Invoice credits and Aspom Travel standalone confirmations use the request amount, excluding customer-paid Paystack fees. Received totals represent gross verified client charges, not bank settlement.
- An existing test payment for NGN 40,000 with a NGN 710.66 fee was reverified against Paystack and corrected from Needs attention to Paid. The original review history remains. Only an old generic mismatch with matching stored provider amount/currency/mode/fees and newly verified original amount can be recovered this way; unrelated reviews, refunds, previous accounting posts, and additional reconciled attempts remain protected.
- Development full-flow testing is enabled locally with `PAYSTACK_TEST_ACCOUNTING=true`. In `local`, `development`, or `testing`, matching test payments record invoice payments and update balances/status; only Aspom Travel standalone payments create pending Accounts confirmations. Travelatal and ABS standalone payments stay in Payment Links. Entries use Paystack (test), test notes, and test receipt markings. No real money is collected. With the setting off, test verification leaves accounting unchanged. Production ignores this setting and never posts test payments.
- Rechecking an older, already verified and unposted test receipt can record it once in development, after fresh matching Paystack verification. The request must be invoice-linked or an Aspom Travel standalone payment, and still be Paid with no review/reversal flags; balance and duplicate checks still apply.
- The existing test request `PL-CBHKOCTU9TRU` was reverified and its NGN 40,000 payment recorded once against `SEP002/2026` as Paystack (test). The invoice now shows NGN 50,000 paid to date, a zero balance, and Paid status. The NGN 710.66 client-paid fee is excluded from invoice credit.
- A matching live invoice payment, or an enabled development test payment, posts once to invoice history and recalculates the remaining balance.
- A matching Aspom Travel standalone receipt in live mode, or enabled development test mode, creates a pending payment confirmation for Accounts review. It retains NGN or USD; it does not also post to an unrelated invoice/outstanding balance. Travelatal and ABS standalone receipts do not create confirmations. Existing confirmation records and links are preserved.
- Missing/mismatched provider details, changed invoice balances, extra successes, cancelled/expired requests, refunds, or disputes appear in Needs attention. Those receipts require Accounts reconciliation; there is no automatic refund or ledger reversal.
- Provider verification, internal approval, and bank settlement are separate. Received totals represent matching successful charges, including charges needing reconciliation; they do not claim bank settlement or subtract refunds automatically.
- Existing invoice records with payment links must be retained for their audit history.
- Minimums: NGN 50 and USD 2. USD collection requires enablement on the company's Paystack account. No currency conversion is performed.

## Test walkthrough still required

1. Create an invoice deposit request and a standalone request in test mode. Confirm source, amount, currency, responsible staff, due date, expiry, and invoice prefill.
2. Test copy, controlled email delivery, WhatsApp preparation, and QR scan/download using test recipients. All must contain the same direct Paystack URL, with no portal URL fallback if preparation fails. No client messages have been sent during development.
3. Complete Paystack test checkouts in NGN and USD where the account supports them. Confirm callback and webhook both report the same payment without duplicate accounting. With development test accounting enabled, confirm the invoice payment history, remaining balance, paid/partial status, and Aspom Travel standalone Accounts review update through the full flow. Confirm Travelatal and ABS standalone receipts remain in Payment Links, including after repeated checks. Leave checkout before return and confirm the webhook still updates the portal.
4. Check failure/retry, abandoned checkout, invalid return reference, interrupted initialization, cancellation/expiry, and a changed invoice balance. A recent ambiguous checkout must be checked before another attempt is allowed.
5. Confirm Accounts/responsible-staff bell entries, sidebar counters, details navigation, and recipient-scoped clearing. Unresolved Needs attention remains after clearing informational updates.
6. Inspect desktop/mobile layout, action popovers, creation dialog, read-only sheet, Driver guide, PDF receipts, and CSV/Excel files.
7. Exercise simultaneous callback/webhook delivery on the actual MySQL environment. Automated SQLite tests cover repeated delivery; database row locks and unique constraints protect reconciliation, but a real concurrent-delivery check has not been run.

Invoice-style receipt PDFs were generated and rendered for NGN invoice deposits, test invoice payments, USD standalone payments, and long-content pagination. Their margins, logo placement, totals, references, balances, and test warnings were checked visually. The browser automation connection timed out during development; desktop/mobile page checks and QR visual checks remain outstanding.

## Before switching to live

- Confirm the company collection account, USD enablement, and subsidiary reporting/account mapping with Accounts; ensure the live Paystack account also passes fees to clients.
- Configure the HTTPS frontend/backend and live webhook, secrets, mail delivery, and push delivery. Refresh cached configuration.
- Apply the reviewed migration to the target environment before deploying code that queries the new notification tables.
- Complete the test walkthrough above.
- Approve and verify a controlled live payment, correct ledger posting, receipt, and bank settlement. No live payment has been initiated in this work.

## Automated checks

```text
# staff-backend
php artisan test tests/Feature/PaymentLinksTest.php

# staff-frontend
node --test lib/types/payment-links.test.mjs lib/utils/payment-link-files.test.mjs
npx tsc --noEmit --pretty false
npm run build
```

Payment tests use fake provider responses and in-memory SQLite; they do not contact Paystack. They cover permissions, signatures, mismatches, duplicate delivery, duplicate provider IDs, stale balances, late/cancelled payments, refunds, notification read receipts, push/mail failures, replacement/export filters, currency separation, retry behavior, direct-link sharing and reuse, scoped sharing history, and initialization failure without a portal fallback.

References: [Paystack API currencies and minimum amounts](https://paystack.com/docs/api/), [international/USD enablement](https://support.paystack.com/en/articles/2130690), [webhook signatures](https://paystack.com/docs/payments/webhooks/), [payment verification](https://paystack.com/docs/payments/verify-payments/).
# USD checkout availability

The connected Paystack integration must support USD even when using test keys. A provider response of “Currency not supported by merchant” means checkout was rejected, not that payment verification temporarily failed. The portal shows a clear setup message, retains the request as Awaiting payment, and marks the attempt failed so staff can retry after enablement. Unknown failures and timeouts still reserve their references until a status check confirms they were not created.

For Nigerian live USD collection, Paystack documents Settings → Accounts → Add USD account and a Zenith Bank USD domiciliary account, followed by Paystack approval. Settings → Preferences controls international card payments separately. If USD remains blocked with test keys, ask Paystack support to confirm/enable USD for that integration; do not switch to live keys merely to test. Reference: https://support.paystack.com/en/articles/2130690.


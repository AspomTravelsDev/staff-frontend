# Payment Confirmation Flow — Code & Architecture Review

## 1. How It Works Today (Overall Assessment)

The flow connects four areas:
1. **Staff Submission (`/my/payment`)** — Staff submit a confirmation (linking an existing CRM client or creating a new one, optionally linking an open `OutstandingPayment` installment) with a passport DataPage + Proof of Payment upload. Paystack payment links without an invoice (for `aspom`) also auto-create pending `PaymentConfirmation` records ([PaystackPaymentService.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Services/PaystackPaymentService.php#L222-L230)).
2. **Accounts Review Queue (`/accounts/confirmation`)** — Reviewers with `manage-payments` approve, reject (with reason), or assign a deal to a staff member for follow-up.
3. **Outstanding Payments (`/accounts/outstanding`)** — On approval, if `amount_expected - discount > amount_paid`, an `OutstandingPayment` ledger row is auto-created; subsequent linked approvals add to `total_paid_amount` and mark it `completed` once balance hits `0`.
4. **Assigned Deals (`/my/assigned-deals`)** — Assigned officers receive an email, web push, and per-assignment `AssignedDealNotification` alert with read-receipt tracking.

**What works well:**
- Good transactional cleanup on upload failure (orphaned physical files are deleted on DB rollback in [PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L197-L208)).
- Assignment notifications use a proper watermarked `AssignedDealNotification` table (`through_id` + `confirmation_ids`), `lockForUpdate()`, and `DB::afterCommit()` for email/push ([PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L345-L370)).
- Grouping installments into a single deal row is a smart mental model for staff and Accounts — though the current client-side implementation causes several bugs below.

**Main architectural weakness:**
The confirmation table tries to represent **deal-level** aggregates (grouped installments, deal KPIs, search/closer/department/date filters) in the browser on top of a **row-level paginated** endpoint, while several core security, concurrency, and serializer contracts have drifted out of sync.

---

## 2. High-Severity Bugs (Security, Data Integrity & Broken Display)

### 1. Unrestricted Access to Client Passport DataPages & Receipts (IDOR + Post-Approval Deletion)
- `datapage` and `proof_of_payment` are saved as `file_type = 'payment_document'` ([PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L161-L181)).
- Unlike `asset_photo`, `payroll_support`, `task_proof`, and `compliance_evidence`, **`payment_document` has no authorization check in `FileController`**:
  - **Download ([FileController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/FileController.php#L192-L229))**: Any authenticated staff member can download *any* client's passport DataPage or payment proof via `GET /api/files/download/{fileId}`.
  - **Delete ([FileController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/FileController.php#L287-L307))**: `payment_document` is not locked, so the submitting staff member can delete their proof of payment or DataPage *after* Accounts approves it via `DELETE /api/files/{fileId}`.
  - **Direct Upload ([FileController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/FileController.php#L37-L42))**: Not restricted to the payment confirmation workflow, so any staff member can attach arbitrary files to another confirmation via `POST /api/files/upload/payment_document`.

### 2. Broken Data Scoping on `/my/payment`, `/accounts/outstanding`, and Unguarded `/accounts/*` Pages
- **Everyone can read all company outstanding payments**: `GET /api/outstanding-payments` has no role middleware, and `isAccountDept()` in [OutstandingPaymentController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/OutstandingPaymentController.php#L13-L58) is defined but **never called**. Every staff member can see every company client's open balances (both in the `/my/payment` installment dropdown and by visiting `/accounts/outstanding` directly).
- **`/my/payment` shows the entire company's confirmations for `manage-payments` users**: [app/(admin)/my/payment/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/my/payment/page.tsx#L41-L48) calls `GET /api/payment-confirmations` without a `mine=true` flag, and [PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L50-L55) skips user filtering whenever `$user->can('manage-payments')`.
- **`/my/payment` mixes assigned deals into personal "Deals Closed" for regular staff**: Lines 51–54 return `where('user_id', $user->id)->orWhere('assigned_to', $user->id)`, so deals closed by *someone else* and assigned to a staff member inflate their personal "Deals Closed" and "Total Value Closed" stats even though `/my/assigned-deals` is a separate page.
- **No page-level role guards on `/accounts/confirmation` or `/accounts/outstanding`**: Neither [accounts/confirmation/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/accounts/confirmation/page.tsx#L13-L40) nor [accounts/outstanding/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/accounts/outstanding/page.tsx#L16-L31) checks roles (and there is no `accounts/layout.tsx`). Any staff member visiting `/accounts/confirmation` gets rendered the Accounts Approve/Reject/Assign toolbar.

### 3. Double-Approval Race Condition & Financial Math Holes
- **Missing lock on `PaymentConfirmation` during `approve()` and `reject()`**: Unlike `assign()`, [approve()](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L223-L266) fetches `$pc` and checks `$pc->status !== 'pending'` *before* `DB::beginTransaction()` and without `lockForUpdate()`. Concurrent clicks or duplicate requests can:
  - Add `$pc->amount_paid` **twice** to `OutstandingPayment.total_paid_amount`.
  - Create **two duplicate** `OutstandingPayment` rows for a new partial payment.
  - Race `approve()` against `reject()` ([reject()](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L305-L315) has no transaction or lock).
- **Installment validation & accounting holes ([PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L89-L115), [#L237-L266](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L237-L266))**:
  - `outstanding_payment_id` only checks `exists:outstanding_payments,id` — does **not** check `status = 'pending'`, `deleted_at IS NULL`, or that `crm_client_id` matches the submitted client. In the UI ([payment-confirmation-dialog.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmation-dialog.tsx#L390-L422)), a user can select an outstanding payment and then switch to another client / "New Client" while keeping `outstandingPaymentId` set.
  - `discount` entered on an installment is saved on `PaymentConfirmation` but **ignored** when updating `OutstandingPayment`.
  - Overpayments are silently clamped to `balance = 0` with no warning or check against remaining balance (or against multiple concurrent pending installments exceeding the balance).
  - `amount_paid` and `amount_expected` allow `0` (`min:0`).
  - `client_id` only validates `nullable|uuid` (missing `exists:crm_clients,id`), causing an unhandled 500 SQL FK violation that leaks `$e->getMessage()` ([lines 209-212](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L209-L212)).
  - `OutstandingPayment` uses PHP float arithmetic (`+=`, `-`) without `decimal:2` casts or integer minor units, risking kobo rounding drift where a balance like `0.000001` never reaches `<= 0`.
  - **CRM status inconsistency**: Creating a new client via payment confirmation sets their CRM status to `PAID` *immediately upon submission* ([line 134](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L134)) — even if Accounts rejects it — whereas approving a payment for an existing `potential` CRM client never promotes them to `PAID`.

### 4. Broken Laravel Relation Serialization Keys (`snake_case` vs `camelCase`)
Laravel serializes `camelCase` Eloquent relations to `snake_case`, which doesn't match the frontend types ([lib/api/payment-confirmations.ts](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/lib/api/payment-confirmations.ts#L63-L67)) or Details Sheet ([payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L995-L1052)):
- `outstandingPayment()` serializes as `outstanding_payment`, but the UI reads `selectedDeal.latestConfirmation.outstandingPayment` → **the "Linked to Outstanding Payment — Balance remaining" box never renders**.
- `processedBy()` serializes as `processed_by`, but the UI reads `processedBy` (undefined) and falls back to `processed_by_id` → **displays a raw UUID instead of the Accounts officer's name**.
- `assignedTo()` serializes as `assigned_to`, **colliding with and overwriting** the `assigned_to` UUID column on [PaymentConfirmation.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Models/PaymentConfirmation.php#L29-L60) (which is why the UI had to add defensive `getUserDisplay()`/`getUserId()` helpers).

### 5. Hardcoded `₦` / `NGN` Breaks Paystack USD Confirmations
- [PaystackPaymentService.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Services/PaystackPaymentService.php#L222-L230) creates `PaymentConfirmation` rows with `currency => $link->currency` (`NGN` or `USD`).
- Every frontend formatter ([payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L109-L111), [my/payment/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/my/payment/page.tsx#L14-L20), [outstanding-payments-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/outstanding-payments-table.tsx#L35-L37)) and all 3 email templates ([payment_confirmation_submitted.blade.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/resources/views/emails/payment_confirmation_submitted.blade.php#L97-L106)) hardcode **`₦`** and sum USD and NGN figures together. `outstanding_payments` also has no `currency` column.

### 6. Rejected Installments Are Counted in Deal Totals
- In [payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L307-L310), `totalAmountPaid` sums **all** confirmations in the group — including `rejected` ones (and `paymentCount` counts rejected attempts too). A rejected and resubmitted installment doubles the displayed "Amount Paid" in the table and Details Sheet while contradicting the KPI cards (which only sum `approved`).

---

## 3. Medium-Severity Bugs (UX, Filtering, Uploads & Notifications)

- **Removing an uploaded file in the dialog doesn't actually remove it**: In [payment-confirmation-dialog.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmation-dialog.tsx#L655-L689), clicking `X` updates `datapageFiles`/`proofFiles` via `onChange`, but never clears `datapageRawFile`/`proofRawFile`. Submitting silently uploads the removed file. Also, [file-upload.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/ui/file-upload.tsx#L142) doesn't reset `<input>` value, so re-selecting the same filename does nothing.
- **Ambiguous & broken multi-installment handling in Details Sheet & table actions ([payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L291-L314), [#L674-L722](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L674-L722), [#L838-L1052](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L838-L1052))**:
  - Table-row Approve/Reject acts on `actionConfirmation` (newest pending), even though the row shows the **combined** `totalAmountPaid`, and there are no per-installment review buttons inside the Details Sheet.
  - Details Sheet reads `status`, `rejection_reason`, `assigned_to`, `processed_by`, `discount`, `payment_method` exclusively from `latestConfirmation` — hiding earlier installments' rejection reasons, discounts, or assignments.
  - Assigning a multi-installment deal only sets `assigned_to` on **one** confirmation row, so the assignee on `/my/assigned-deals` misses earlier installments and the client's passport DataPage attached to installment #1.
  - If installment #1 was approved and installment #2 is rejected, `deal.status` becomes `"rejected"` and the **Assign** button disappears (`deal.status !== "rejected"` on line 703).
  - If an older installment is pending and a newer one was approved, the badge says `Approved` while Approve/Reject buttons still appear.
- **Client-side filtering, grouping & KPIs break across pagination**:
  - Search, Closer, Department, and Date filters on `/accounts/confirmation` only scan the 100 rows on the current page ([payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L324-L352)).
  - Closer/Department filter checks `actionConfirmation.user_id` while the table displays `origin.user?.name` — filtering by the displayed submitter can hide the row when a different colleague submitted an installment.
  - KPI cards on `/my/payment`, `/accounts/confirmation`, and `/accounts/outstanding` compute over only the current page *and* active `?status=` filter (filtering `/my/payment` by `Rejected` makes "Deals Closed" count rejected rows and drops "Approval Rate" to `0%`).
  - Multi-installment deals whose installments straddle a page boundary split into two separate rows.
  - **"Last Month" date preset bug ([payment-confirmations-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmations-table.tsx#L229-L236))**: `lastMonth.setMonth(today.getMonth() - 1)` overflows on the 29th–31st of months following shorter months (e.g., on March 31 it filters March instead of February).
- **Small crash/edge bugs**:
  - `?page=abc` yields `NaN` in `parseInt(sp.page || "1")` on all 4 pages, causing a 422 that [lib/api/payment-confirmations.ts](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/lib/api/payment-confirmations.ts#L115-L116) silently turns into an empty list (same for invalid `?status=` on [accounts/outstanding/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/accounts/outstanding/page.tsx#L22-L23)).
  - `total_expected_amount === 0` renders **`NaN%`** in [outstanding-payments-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/outstanding-payments-table.tsx#L75).
  - Number inputs in [payment-confirmation-dialog.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/payment-confirmation-dialog.tsx#L591-L622) lack `step="0.01"`, so HTML validation blocks kobo decimals.
  - Two ~10 MB attachments exceed Next.js's `serverActions.bodySizeLimit: "20mb"` ([next.config.mjs](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/next.config.mjs#L5-L9)) once multipart headers are added.
  - [FileUploadService.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Services/FileUploadService.php#L171-L174) generates filenames from `userId + unix timestamp` only — two rapid submissions in the same second overwrite each other on disk.
  - Specific 422 message `"The discount cannot be greater than the expected amount."` in [PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L111-L114) is hidden by [client.ts](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/lib/api/client.ts#L149) because `data.message` (`"Failed to create payment confirmation"`) takes precedence over `data.error`.
- **Inactive employees in Assign dropdown**: [accounts/confirmation/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/accounts/confirmation/page.tsx#L30) calls `getEmployees({ limit: 200 })` without `status: "Active"`, so exited staff appear in the Assign select and fail with a backend 422 when chosen.
- **Notification rough edges**:
  - [my/payment/page.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/app/(admin)/my/payment/page.tsx#L35-L39) marks notifications viewed inside the Server Component render (can fire on link prefetch, and never invalidates React Query `["notifications"]`, so the sidebar/bell badge stays stale up to 3 minutes; same when Accounts approves/rejects a payment).
  - `myPaymentUpdates` ([AppServiceProvider.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Providers/AppServiceProvider.php#L503-L513)) checks `updated_at` instead of `processed_at`, so reassigning an already-approved deal falsely re-notifies the submitter.
  - `/my/assigned-deals` sorts by `created_at DESC` ([PaymentConfirmationController.php](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L69)), so an older deal newly assigned today gets buried (or pushed to page 2) instead of appearing at the top; and the page parses `status` without rendering `<TableFilter />`.
  - Submission email hardcodes `'account@aspomtravels.com'` ([line 187](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/app/Http/Controllers/Api/PaymentConfirmationController.php#L187)), and neither submission nor approve/reject sends Web Push notifications (unlike `assign()`).

---

## 4. Improvement Suggestions

1. **Clarify & tighten role permissions**:
   - Currently `config/permissions.php` grants `manage-payments` (including **Approve / Reject / Assign**) to `account`, `compliance`, `office-operations`, `it` ([line 62](file:///C:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-backend/config/permissions.php#L62)), `mp`, `md`, and `super` — even though `it` doesn't even have the nav links. Consider splitting `view-payments` (Compliance, Office Ops, MP/MD) from `manage-payments` (Accounts + Super Admin) and removing `it`.
2. **Add an Edit / Resubmit / Cancel flow**:
   - Let staff withdraw/edit a `pending` submission (before review) and **resubmit a `rejected` confirmation** pre-filled with the previous data & existing DataPage instead of re-typing everything from scratch.
   - Consider letting Accounts undo/correct a mistaken approval or link/unlink an installment with an audit note.
3. **Move search, filters, stats, and deal-grouping to the backend**:
   - Add backend query params (`search`, `submitted_by`, `department`, `date_from`, `date_to`, `mine=1`) and a dedicated stats endpoint (or response block) so KPIs and filters are accurate across all records, not just page 1.
4. **Upgrade multi-installment UX & Outstanding Payments table**:
   - Inside the Details Sheet, let reviewers inspect **each installment's** receipt, payment method, status, rejection reason, and approve/reject individual pending installments directly.
   - In [outstanding-payments-table.tsx](file:///c:/Users/ADMIN/Documents/Projects/ASPOM/staff_portal/staff-frontend/components/payment/outstanding-payments-table.tsx#L62-L109) and the installment dropdown, show **Product / Service** and **Deal Closer** (and make rows clickable to inspect installment history) so multiple open balances for the same client are distinguishable.
   - Lock the client fields when an `OutstandingPayment` is selected and display the remaining balance next to `Amount Paid` (with an optional "Pay full remaining balance" shortcut).
5. **Add automated tests**:
   - There are currently **0 PHPUnit tests** and **0 frontend tests** for payment confirmations or outstanding payments. Adding feature tests for authorization, file access, concurrent approval locking, installment balances, and scoping will prevent regressions.

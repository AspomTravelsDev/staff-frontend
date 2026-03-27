# Payslip Integration Tracker

## Goal

Deliver end-to-end payroll computation and payslip generation with auditable deductions and multi-stage approvals.

## Formula Baseline

1. Adjusted Gross = Gross Salary - Suspension Deductions - Absence Deductions (full/half day)
2. Tax = computed from Adjusted Gross
3. Net Pay = Adjusted Gross - Tax - Accommodation - Loan Deductions - Salary Advance Deductions

## Locked Decisions

- Approval chain: Staff -> HR -> Accounts -> Paid
- Loan and salary advance repayment: manual per payroll cycle
- Tax basis: tax on adjusted gross after suspension/absence deductions
- Open/active card: statuses pending_hr and pending_accounts only
- Pending balance card: statuses pending_hr and pending_accounts only
- HR and Accounts list default date filter: current month
- Salary advance deduction: supports installments via repayment duration; monthly deduction is auto-calculated as amount / repayment months
- Salary advance request cap: cannot exceed 75% of staff gross salary
- Loan monthly deduction: auto calculated as amount / repayment months
- Payroll period convention: calendar month (start = first day, end = last day) in Africa/Lagos timezone
- Paid requests are final: no reversal after mark-paid for loan or salary advance
- Staff can reopen rejected loan/salary advance requests with edits (resubmits to HR)
- Keep separate backend tables for loan and salary advance, but use shared role-based pages/components where practical

## Phases

### Phase 0 - Tracking and alignment

- [x] Create tracker file
- [x] Confirm monthly payroll period convention (calendar month)
- [x] Define payslip response contract used by frontend

Phase 0 artifacts:

- Frontend payslip contract types: `lib/types/payslip.ts`

### Phase 1 - Loan and salary advance workflow (current)

- [x] Backend tables and models for loan requests
- [x] Backend tables and models for salary advance requests
- [x] Backend APIs for submit/list/detail
- [x] Backend APIs for transitions: HR decision, Accounts decision, mark paid
- [x] Role guards and transition audit trail
- [x] Frontend API wrappers for loan and salary advance endpoints
- [x] Personal/HR/Accounts pages for loan and salary advance
- [x] Sidebar navigation links for all six routes

### Phase 1B - UX and business rules refinement (current)

- [x] Row click details sheet for loan and salary advance tables (my/hr/accounts)
- [x] Hide requester column on personal request pages
- [x] Add summary cards (total requested, pending balance, open/active, paid)
- [x] HR/Accounts pages show full list with status and date range filters
- [x] Backend list/stat endpoints return filtered data + card summary payload
- [x] Loan monthly deduction auto-computation in backend
- [x] Salary advance installment metadata in backend

### Phase 1C - Notifications integration

- [x] Register payroll notification providers for Staff, HR, and Accounts
- [x] Add sidebar badge keys for payroll queue and personal request updates
- [x] Add staff mark-viewed endpoints for loan and salary advance update badges
- [x] Mark personal payroll notifications viewed when opening my pages

### Phase 1D - Workflow consolidation

- [x] Add staff reopen-with-edits flow for rejected loan/salary advance requests
- [x] Refactor staff/hr/accounts request screens into shared page/component shells while keeping separate endpoints

### Phase 2 - Payslip integration for loan/advance

- [ ] Backend endpoint for monthly payslip breakdown lines
- [ ] Include compliance suspension deductions
- [ ] Include approved manual loan/advance deductions for selected period
- [ ] Frontend payslip page consumption of backend breakdown

### Phase 3 - Accommodation rules

- [ ] Implement prorated accommodation calculation
- [ ] Full staff rate: 10000 monthly, exempt after 6+ months tenure
- [ ] NYSC and intern rate: 5000 monthly, never exempt
- [ ] Include rule explanation in payslip output

### Phase 4 - Attendance deductions and exceptions

- [ ] Full-day and half-day absence deduction aggregation
- [ ] Holiday calendar and permission-day exceptions (HR/Admin managed)
- [ ] Ensure exception days are excluded before adjusted gross

### Phase 5 - Hardening

- [ ] Feature tests for role transitions
- [ ] Unit tests for deduction ordering and edge cases
- [ ] Reconciliation checklist for monthly close

## Current Session Progress

- Initialized project tracker file.
- Implemented backend and frontend foundations for loan/salary advance request flow.
- Implemented UI pages/forms for Staff, HR queue, and Accounts queue.
- Integrated notifications for payroll flow across Staff, HR, and Accounts with badge keys and mark-viewed behavior.
- Added reopen-with-edits flow for rejected loan and salary advance requests (staff resubmits to HR).
- Next: connect deductions into payslip computation endpoint and page.

## Open Questions

- None currently. Revisit after Phase 2 API rollout if new edge cases emerge.

## Change Log

- 2026-03-26: Tracker created and baseline decisions documented.
- 2026-03-26: Added backend migrations/models/controllers/routes for loan and salary advance workflow plus frontend API wrappers and payroll query keys.
- 2026-03-26: Added frontend UI routes and components for loan and salary advance request creation and role-based review queues (Staff, HR, Accounts).
- 2026-03-26: Added UX refinement (cards, filters, details sheet, personal-column adjustments) and backend enforcement for loan auto monthly deduction and salary advance installment metadata.
- 2026-03-26: Added payroll notifications integration (backend notification providers + staff last-viewed timestamps + mark-viewed endpoints + frontend badge wiring).
- 2026-03-26: Completed Phase 0 by locking calendar-month payroll period (Africa/Lagos) and defining frontend payslip response contract in `lib/types/payslip.ts`.
- 2026-03-26: Closed open policy questions: no paid reversal, allow staff reopen-with-edits for rejected requests, and keep separate loan/salary-advance tables with shared page/component UX where easy.
- 2026-03-26: Implemented reopen-with-edits flow for rejected loan/salary-advance requests (new reopen endpoints + personal table reopen actions).

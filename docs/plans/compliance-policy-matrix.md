# Compliance policy matrix: first implementation

Implemented 26 October 2026. Source: Aspom_Disciplinary_Policy_Matrix.xlsx supplied by the user.

The portal retains its existing seven sanction steps (2, 4, 6, 8, 10, 15 and 20 occurrences), calendar half-year window and verified insubordination exception. The proposed five-step ladder and clean-record expiry rules are not enabled.

## Included

- Twenty additional offense categories with base values from the matrix. The unnamed offense and repeated-error row with no base value are excluded.
- Zero and fractional occurrence values remain intact through review and grid calculation. Incident history is separate from point boxes, so two half-value incidents and a zero-value incident remain individually visible.
- Evidence can be supplied when issuing a query. Confirming action requires evidence and a decision reason; dismissing requires a reason and always records zero points and zero deduction days.
- Verification timestamp and reviewer ID are recorded for confirmations. Review uses a transaction and row lock; a closed decision cannot be overwritten through the resolve endpoint.
- Employee summaries show pending queries across all dates, confirmed incidents in the active half-year, exact totals, calculated stage, next threshold and recorded actions. Pending queries do not contribute points.
- Management cards show missing evidence and queries last answered by staff. These are independent workload counts and may overlap.
- Searchable policy reference uses the same category list as query entry.

## Deployment

Apply backend migration `2026_10_26_120000_add_compliance_review_evidence.php` before deploying the matching frontend and backend changes. It adds nullable evidence, decision and verification fields without changing historical points or inventing historical verification. The migration has not been applied to the application's configured database in this task.

## Deferred policy work

**Update, 29 October 2026:** The revised rolling-window policy, reviewed
recommendations, historical decision snapshots, correction timelines,
company-wide supervisor access and monthly recurring-issues review now follow
[ADR-0020](../adr/0020-reviewed-compliance-policy.md). The original implementation
notes below describe the earlier policy. See the current
[activation and verification notes](../testing/revised-compliance-policy.md).

The department charge ledger, expanded serious-offense bypasses, automatic repeat-offense escalation, reset rules and policy versioning remain separate work. Impact-based changes to base values remain manual, with a documented reviewer decision. The zero-value application review offense does not automatically charge anyone.

## Verification

Frontend type and focused lint checks pass. Two frontend regression tests pass. Seven backend feature tests pass with 85 assertions against an isolated in-memory SQLite database and fake mail; PHPUnit also reports deprecation notices. The tests cover evidence requirements, verification records, closed decisions, dismissal, zero/fractional values, period boundaries, defaults and access restrictions. Browser visual verification was attempted but the browser could not reach the local preview server; no visual sign-off is claimed.

## Staff guide layout (26 October 2026)

The Compliance Guide is available to all signed-in staff at `/my/compliance/guide`, within the personal Compliance dropdown. Its content is always visible without a card or collapse control. Rules support description search, category filters and a clear empty state. Current disciplinary steps remain sourced from the API, and the old policy URL redirects to the guide. The in-page link to the personal compliance record was removed; the sidebar still provides that separate destination.

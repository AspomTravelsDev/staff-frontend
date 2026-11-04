# ADR-0029: Historical six-month sanction-grid windows

Accepted, 2026-11-01.

The sanction-grid endpoint accepts an optional window_end date. The default remains today in Africa/Lagos. The existing rolling-window rule is retained: start at midnight six calendar months before the end date, clamp month-end dates without overflow, and include the entire selected end day. Future and invalid dates are rejected. Decision-making elsewhere continues to use the current rolling window; the reporting filter does not change saved sanctions, payroll or query-list filters.

Confirmed incidents, pending counts and markers are scoped to the selected occurrence-date range. Earlier action history remains available up to the selected end date; later-dated incidents do not influence historical steps. Historical reports include staff who have since become inactive when they have relevant records, while employee access remains restricted to the authenticated employee regardless of supplied user_id.

This is a date-range report of currently saved incident outcomes, not an immutable snapshot of what was known at a past date. The historical interface states this explicitly. Reconstructing original decision states would require a separate versioned audit feature.

The dashboard keeps a window-ending date control above the query list, plus Previous window and Current window actions. Previous ends one day before the displayed start so consecutive views do not share boundary incidents. Query-list and monthly-review parameters are retained when changing the grid window. The grid itself is hidden when empty; the date controls remain available so users can reach earlier populated periods. Grid exports include the displayed date range.

No migration or new dependency is required. Tests cover inclusive date boundaries, fractional totals, month-end clamping, invalid/future dates, pending-count scoping, departed staff, authorization and independent URL filters.

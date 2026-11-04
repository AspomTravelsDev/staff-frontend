# 0018: Group attendance requests and unify half days

Status: Accepted
Date: 2026-10-27

## Decision

Keep Leave Management separate. Expose Work From Home, Half Day and Late Arrival as tabs under `/hr/attendance-requests`, retaining the existing request stores, review permissions, filters and approval actions. Staff submit from My Attendance. Existing HR request routes remain available for older links.

Half day and early departure are the same request. New submissions use `half_day` and require an expected departure time. The backend accepts legacy `early_departure` submissions as an alias, groups saved legacy records into the Half Day tab, and includes approved legacy records in the existing deductible-half-day payroll calculation. Approval permits the departure and does not waive the deduction.

Request-type filtering runs before summary counts and pagination, so each tab's records and totals describe the same type. Role checks include secondary roles; merging navigation does not grant new review permissions. WFH URL filters preserve the selected request tab, and changing request types resets the queue filters.

## Validation

`tests/Unit/AttendanceRequestTypesTest.php` in the backend exercises both type queues, legacy early-departure submission normalization and required half-day departure time using an isolated SQLite database.

# Monthly appraisal validation

Validated on 2026-10-28 with real Laravel persistence and the Next.js interface. No performance API responses were mocked in the full journey.

## Repeatable automated checks

From the backend repository:

```powershell
php vendor/phpunit/phpunit/phpunit --filter 'PerformanceJourneyTest|PerformanceResultsTest|PerformanceReviewTest|PerformanceSelfAssessmentTest|PerformancePeriodTest|DepartmentKpiTest' --no-progress
```

The suites create isolated in-memory SQLite schemas and synthetic users. Result: **37 tests, 606 assertions**. Existing PHPUnit metadata deprecations originate in unrelated test files.

From the frontend repository:

```powershell
node --test lib/performance-results.test.mjs lib/performance-review.test.mjs lib/performance-self-assessment.test.mjs lib/performance-period-access.test.mjs lib/department-kpi-access.test.mjs lib/api/action-result.test.mjs
npx tsc --noEmit
npx eslint 'app/(admin)/hr/performance' lib/api/performance.actions.ts lib/api/performance.ts lib/types/performance-result.ts lib/performance-results.test.mjs
```

Result: **35 frontend tests passed**, type checking passed, targeted lint passed.

## Browser walkthrough

Used a disposable SQLite database, five synthetic accounts, a separate frontend copy and loopback-only ports. The running development server and staff database were preserved.

1. Compliance created Visa and Compliance KPIs.
2. HR selected staff, a supervisor and the Compliance supervisor, assigned reviewers, previewed and opened October's period.
3. HR results stayed empty while those appraisals were unfinished.
4. Staff started with unanswered ratings; missing ratings blocked submission. A saved draft restored its rating/comment after reload.
5. All three subjects submitted their self-assessments. Staff advanced to supervisor, the supervisor to Compliance, and the Compliance supervisor directly to MP.
6. Assigned intermediate reviewers submitted their independent ratings.
7. MP saw only earlier submitted stages, rated each appraisal independently, supplied required final comments and completed all three.
8. HR saw final scores 5, 4 and 3 (average 4.00). Visa filtering returned two results (average 4.50); month and staff-ID searches worked. Detail preserved self=3, supervisor=2 and MP=5 independently for the staff result.
9. Submitted/completed forms were read-only. API tests additionally cover unauthorized access, draft privacy, stale versions, repeated submissions, invalid criteria, snapshot stability and pagination.

HR list/detail screenshots were checked at desktop and 390×844 mobile sizes. Neither mobile page overflowed horizontally. Shared attendance/chat/notification widgets were outside the minimal test schema and could show their existing retry states.

No real appraisal was submitted or completed. Test servers were stopped after verification. Production deployment was not part of this task.

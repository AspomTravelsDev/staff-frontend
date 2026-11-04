# Payroll period navigation and explicit creation

Implemented 24 October 2026.

- Viewing or refreshing payroll never creates a run. Missing periods show an empty view.
- Cap the month picker at the latest created payroll period, or the current Lagos calendar month when no payroll exists. Guard typed values as well as the native picker.
- Only staff with the HR role use Create next payroll to create the month immediately after the latest run. The first run starts in the current Lagos month. The action is independent of the historical month being viewed.
- Explicit next-period creation may prepare an upcoming month early. Once created, that month becomes available in the picker.
- Backend preview/create requests use an explicit create_next flag. Require HR and the exact next month. Creating any new period, including the first or a missing current period, requires HR. Ordinary create requests cannot open an uncreated future period. Existing periods remain readable/resettable under existing permissions.
- Creation retries return the existing run without replacing its entries. Reset remains a separate action.
- Tests cover permissions, skipped periods, calendar boundaries, duplicates, and read-only month navigation.

Updated 26 October 2026: new-payroll creation is HR-only in the interface and backend. Super Admin without an HR role retains existing review/reset access but cannot create a new period.

Updated 30 October 2026: staff payslip history includes their own entries in draft,
review and closed payroll runs. Run status remains in the response so the existing
draft badge, provisional watermark, preview and PDF/JPG downloads remain available.
Entries are still scoped to the authenticated staff member and sorted by payroll
month, newest first. Only closed payroll is presented as finalized.

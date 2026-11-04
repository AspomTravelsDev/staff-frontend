# Payroll staff refresh

HR and Super Admin can use **Refresh staff list** on draft or HR Draft payroll. The existing refresh menu action still reloads saved payroll; Reset payroll still rebuilds the run.

The staff refresh calculates only newly eligible employees using the existing payroll calculator. The server locks the run, checks its current stage and employee eligibility, and skips every employee already included. Saved entry IDs, amounts, adjustments and timestamps remain unchanged. Repeated requests do not duplicate staff. Employees joining after the payroll month are excluded.

Departures remain payable records. Salary, contract, joining date, exit date and active-status changes appear as review badges against the details recorded when an entry was generated or last saved. HR reviews and recalculates an individual entry when appropriate. Legacy entries without those details can flag departures and a changed base salary, but cannot reliably identify every historical change.

Submitted runs must return to HR Draft before refreshing; closed payroll remains locked. Refreshing does not advance payroll or reset approvals.

Validation: PayrollPeriodsTest covers preservation of an entire saved row, additions, retries, an empty refresh, departures, future joiners, locked stages and permissions. Existing payroll page, month and export tests and TypeScript checks pass. Signed-in visual verification was unavailable in this session.

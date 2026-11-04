# 0019: Payroll comments do not transition the approval workflow

Status: Accepted
Date: 2026-10-27

Comments and revision comments are a shared thread on an existing payroll run. HR, Accounts, Compliance, MP, MD and Super can participate using primary or secondary roles. Posting records the author's name, role and the current stage, without changing payroll status, approval history, figures or editing permissions. Closed/processing runs remain readable with posting disabled.

Each new comment requires a recipient role: HR, Accounts, Compliance, MP or MD. Persist `recipient_role` on the comment and notify active individual users with that primary or secondary role, excluding the author. Recipient selection controls notifications, not visibility: the thread remains shared with all authorized payroll reviewers. Older comments retain a null recipient rather than inventing a historical destination. Notifications have per-recipient read markers, appear in the bell and link to the payroll month with the thread open. Device push uses the existing web-push channel after transaction commit and omits comment text and payroll figures from its preview.

Comments are paginated by ID. The client marks only messages through the latest successfully loaded ID as read when the sheet is open and the page visible, preserving notifications created after that point. Clearing all notifications marks comment notifications read without deleting the discussion. Existing approval transitions, rejection controls and stage email rules remain unchanged.

The pipeline's Log & comments button opens one view-only Payroll activity sheet, merging approval history and comments by timestamp, newest first. An adjacent Add comment button opens a dialog with recipient, message type and comment fields. Posting requires confirmed comment access; failed sends retain the draft and destination for retry. Comments display their destination in the timeline. Users who can view payroll history but lack comment access retain history-only access. The workspace renders tabs and run controls in the same row directly, without a portal. The server loads the initial selected run, latest month and salary staff; the client fetches only for explicit month changes, refreshes and mutations. The pipeline uses stage names without numbered steps.

Backend migration: `2026_10_27_200000_create_payroll_comments_tables.php`.
Recipient migration: `2026_10_28_000003_add_recipient_role_to_payroll_comments.php` (nullable for existing comments).
The payroll More actions menu, including manual refresh, reset, reopen and delete, is shown only to HR and Super Admin (including secondary roles). Server mutation permissions remain restricted to those roles; payroll read access remains available to reviewers.
Validation: backend `PayrollCommentsTest` covers workflow preservation, recipients, secondary roles, bounded reads, permission checks, read-only stages and pagination. Frontend `tests/payroll-comments.test.mjs` covers display, permissions and successful/failed send behaviour.

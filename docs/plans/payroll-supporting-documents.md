# Payroll supporting documents

Each payroll run has three document categories: Attendance Sheet, Sanction Sheet, and To-do & Reports Sheet. The documents appear with the approval pipeline and remain available to payroll reviewers throughout the workflow.

Staff with an HR or Super Admin role may upload all three categories while the run is in draft or hr_draft. Compliance (including a secondary Compliance role) may upload only the Sanction Sheet in draft, hr_draft, account_review or compliance_review. The API returns the allowed categories for the signed-in user and the interface displays only those file pickers. Excel, CSV, PDF, Word and common image files are accepted up to 10 MB each. Selecting a file uploads it immediately. Additional uploads in a category create a new version; earlier versions remain available. Upload metadata records category, version, uploader and timestamp.

Uploads and stage transitions lock the payroll row. Each approval-history item records the document IDs available when the reviewer acted. Attendance and To-do & Reports documents cannot change during review. Compliance may revise sanctions through Compliance Review; all uploads lock at MP Review, MD Approval and closure. Returned or reopened drafts may receive new versions. Existing reset behavior retains the supporting documents.

Private files use a dedicated payroll_support storage type and unique filenames. The generic upload route cannot be used for this type, and generic deletion is blocked. Downloads require an existing linked run, attachment membership in that run, and one of the payroll access roles: HR, Accounts, Compliance, MP, MD, Super Admin or Office Operations. Ordinary staff cannot access these sheets through personal payslips or file URLs.

Uploading all three sheets is supported but not mandatory for advancement. Existing emails link reviewers to the payroll page; supporting files are not included in email attachments.

Deploy migration 2026_10_26_180000_add_payroll_supporting_documents.php before the updated backend/frontend. Refresh cached file-storage configuration as part of normal deployment. The application's configured database was not migrated during this task.

Verification: 13 backend payroll tests with 112 assertions and three frontend attachment tests pass. TypeScript checks pass. Tests cover HR/Super Admin uploads, lock states, revision history, stage snapshots, private downloads, direct upload/deletion bypasses, invalid types and size limits, role-specific controls and upload forwarding. Tests use in-memory databases, fake private storage and fake mail.

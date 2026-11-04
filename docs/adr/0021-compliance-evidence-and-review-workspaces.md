# Compliance evidence, response and decision workspaces

Accepted, 30 October 2026.

Query creation accepts text references and up to five evidence documents, each
at most 10 MB (15 MB total to stay within the portal upload limit). Laravel validates documents and stores them with the existing
private file service, linked directly to each query. Creation is transactional
across the selected staff members. Download authorization requires ownership of
the query or the existing manage-compliance permission. Generic upload and
deletion routes cannot bypass the query workflow. Evidence is visible to staff
in both the response dialog and query-details sheet.

The query table is the primary compliance surface. Summary statistic cards are
removed; confirmed-occurrence history remains available below the table when it
has content. Details open in a sheet. Responses and reviewer outcomes use
separate dialogs. Rows use the portal shared details-row interaction; secondary
actions live in the row menu. The list remains server-loaded, while open query
workspaces use the existing React Query provider and centralized detail key.
Workspace form state starts from the freshly loaded record, with managed refetch
after writes instead of fetch effects or form-reset effects. The existing Laravel policy service remains authoritative for
all resolution, correction and sanction checks. Selecting an outcome continues
to require a reviewer reason and verified-evidence summary.

Compliance reviewer notifications cover new queries raised by another user and
staff responses. Read state belongs to each reviewer through
compliance_review_reads, rather than a shared manager timestamp. Reading details
does not update conversation activity. Bell links open responses, while table
details links open the sheet. Existing staff notification and production-only
email rules remain in place. Deploy the accompanying backend migration before
the application changes that read this table.

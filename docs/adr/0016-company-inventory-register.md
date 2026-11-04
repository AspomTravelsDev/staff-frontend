# ADR-0016: Company inventory separated from gadget workflows

Date: 2026-10-24
Status: Accepted by the user.

## Decision

Company Inventory at `/admin/company-inventory` is the company-wide register. The existing `/admin/inventory` route remains the gadget assignment and clearance workspace, preserving links and ongoing workflows. Both use the same Laravel inventory items and history. No asset or custody records are duplicated.

Add optional asset kind, brand, model, photo URL, location, shared department, responsible person, retirement/disposal evidence, and register state. Keep the existing category and assignment status values compatible with historical documents and transitions. Register state covers shared use, missing, retired, and disposed; otherwise status comes directly from assignment/clearance. Legacy assets require no invented location or shared allocation.

Shared allocations require department and location and may name a responsible person. This person does not become the personal custodian. Individual staff issues continue through the existing acknowledgement and approval workflow. Under an active workflow or personal custody, register updates cannot change allocation or lifecycle status. Assignment initiation rejects register states such as shared, missing, and retired.

CSV imports create new assets transactionally (up to 200 rows), reject duplicate serials, and never overwrite matching assets. Export includes all pages matching filters. Retirement/disposal preserves the asset and records a date and reason. Changes record before/after metadata in existing inventory history.

## Consequences and validation

The additive migrations must be deployed before the new register. Existing gadget checklists remain applicable to gadget workflows; registering a fan or TV does not fabricate checklist observations. Existing condition ratings are retained. Verify shared allocation, active workflow protection, staff permissions, search/pagination, atomic imports, serial uniqueness, and assignment/clearance regression tests.

Asset photos can be uploaded with the asset save as JPG, PNG, or WebP up to 5 MB. Reuse FileUploadService and private storage with a dedicated asset_photo type and unique filenames. Store the linked file ID on the asset; serve through an inventory-role-protected backend endpoint and an authenticated, non-cacheable frontend image route. General file upload cannot bypass the asset workflow, and general downloads enforce inventory roles. Replacement/removal updates the asset pointer and audit history; prior files remain privately stored for history. Existing URL photos remain visible until replaced or removed. Cancelling the form uploads nothing.

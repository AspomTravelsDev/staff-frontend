# Inventory, assignment, and clearance UX plan

Status: Draft for review. No application changes included.
Date: 19 October 2026

## Goal

Help staff answer three questions quickly: What equipment do we have? Who has it? What needs my attention?

Preserve existing custody rules, staff acknowledgements, officer inspection, compliance decisions, role permissions, rejection routing, recorded observations, and document history. Simplify their presentation first. Changing approval policy is outside this plan.

## 1. Simplify the inventory table first

Replace the current seven columns with five:

| Column | Content |
| --- | --- |
| Device | Model/name, with serial number below in secondary text |
| Held by | Current custodian, In storage, or repair provider name |
| Status | One primary state; a short secondary workflow explanation when relevant |
| Condition | Plain condition label; stronger emphasis only for issues |
| Actions | One contextual action plus an overflow menu |

Move category, full technician contact details, detailed condition reports, checklists, history, and documents into an asset detail drawer. Keep category available as a filter. Make the device name a keyboard-accessible link/button opening details; do not rely on row clicks alone.

Examples of contextual actions: Assign for eligible storage assets; View assignment for an open assignment; Request return for eligible assigned assets; View return for an ongoing return; View details for repair assets. Match existing permission and eligibility checks. Do not offer competing assignment or return actions on assets with an active process.

Keep current custodian distinct from intended recipient. Before acknowledgement, show In storage under Held by and Awaiting acceptance by [name] under Status. After acknowledgement, show the actual custodian even if reviews are still pending. Avoid implying that Storage means available when an assignment is already open.

Overflow contains secondary actions appropriate to the asset and user: Edit asset, Log inspection, History, Documents, Remove asset. Move full employee offboarding out of individual asset menus into Clearances. Preserve confirmation for removal.

Toolbar: search, status filter, More filters, and one Export menu. More filters contains category and condition, with active filter count and visible removable selections. Keep Add asset in the page header. Put document generation in asset/employee context rather than competing with table filtering.

Search must match device name, serial, and staff name as advertised. The current client filter matches only name and serial. Preserve sort/filter state when opening details and returning. Provide pagination or bounded loading with accurate counts; the current request is capped at 500, so do not label loaded-row counts as all company assets.

On narrow screens, use stacked rows showing device, holder, status, and the action; expose condition and additional information in details. Avoid fitting the desktop column layout into a narrow viewport.

## 2. Organise work around tasks

Use Assets, Tasks, and Clearances as the main sections. Assets is the predictable default; preserve explicit tab URLs and redirect/bookmark compatibility where needed.

Tasks combines assignment and return actions into one permission-aware list. Default to Needs my action; offer Waiting on others and Completed only where the data supports those views. Leadership can filter across teams.

Each task shows employee/device, task type, readable current stage, responsible person/team, age where reliable timestamps exist, and a specific action such as Review assignment or Inspect return. Role names become filters/context rather than separate required navigation steps.

Completed/history data may need additional API support: existing role queues must not be assumed to contain every workflow state. Verify queue coverage before implementing these views.

## 3. Simplify assignment and acknowledgement

Admin: choose employee, review the recorded condition, and send for acknowledgement. Use a searchable employee selector.

Staff: review device identity and condition, explicitly confirm the recorded observations or report differences, read the required declaration, and accept or request correction. Preserve staff-authored evidence separately from the assignment baseline.

Use an assignment page for the substantial review, with device summary, progress, relevant observations, and one primary action. Keep the initial employee selection in a short dialog if it remains brief.

Present recorded observations compactly and expand detailed fields only when needed. Fresh inspections use quick choices such as Working, Issue, and Not applicable with notes for issues. Never mark observations checked automatically. Preserve any important existing free-text detail.

First implement confirmation/difference controls against existing checklist payloads where feasible. A structured checklist schema is a separate change requiring frontend/backend validation and PDF compatibility review.

## 4. Make clearance an employee-level journey

Start from Clearances: choose employee, review equipment, then request one-device return or full equipment clearance. Keep those scopes explicit.

Show one clearance record per existing clearance batch, with devices underneath. Do not combine unrelated returns solely because they belong to the same employee.

Show progress: Staff handover → IT inspection → Compliance review → Complete. Display device-level exceptions and an aggregate such as 2 of 3 devices cleared. Derive overall completion from all required devices and decisions.

Use a dedicated page for multi-device handover and inspection. Show original, staff-reported, and inspected condition as a comparison; highlight differences and expand the full evidence on demand. Require explicit review for each device and preserve per-device outcomes.

Display Not yet assessed until damage assessment exists; display ₦0 only when a zero assessment is recorded. Verify whether the API distinguishes these cases before changing presentation.

Keep correction loops specific: what needs changing, who must act, and a direct action to resume. Preserve existing send-back destinations and reasons.

## 5. Align the employee experience

Use My devices as the employee-facing label. Show actionable requests first, with Accept device or Complete handover, followed by current devices. Show waiting states with the next responsible team and completed documents in context.

Use consistent terms across screens: Assign device, Accept device, Request return, Inspect return, Complete clearance. Use sentence-case readable statuses instead of exposing internal state keys. Required declarations must remain accessible and explicitly acknowledged; do not silently rewrite policy text.

## Delivery order

1. Inventory table, toolbar, asset detail drawer, contextual actions, and search correction.
2. Shared readable status/action mapping and unified Tasks view after verifying API coverage.
3. Assignment and staff acknowledgement pages with compact condition review.
4. Employee-level clearance list and batch detail pages with per-device progress.
5. Employee My devices alignment and cross-flow verification.

Each phase should be independently usable. Maintain existing entry points until replacements are complete. Reuse existing visual conventions; this is workflow simplification, not a new brand direction.

## Acceptance and validation

- Users can identify a device, its actual custodian, status, and next action from one row.
- Assignment and return actions remain permission- and state-aware; hiding actions does not replace server authorization.
- Search finds employees as well as models and serial numbers.
- Opening details preserves list context; navigation has keyboard focus and accessible control names.
- Staff acceptance, officer review, compliance approval, and both correction routes still work.
- Pending acceptance never appears as custody already transferred; pending final review never obscures actual custody.
- Batch clearance cannot appear complete while a required device remains unresolved.
- Old checklist observations, audit history, and asset/clearance PDFs remain accurate and accessible.
- Verify desktop and mobile with representative storage, assigned, pending, returned-for-correction, repair, and completed records.
- Use focused tests for status/action mapping, search, and batch progress; run existing relevant checks and perform role-based workflow smoke tests.
- Compare representative tasks before/after: find an employee's device, assign a device, accept it, inspect a return, and identify what blocks clearance. Look for fewer navigation steps and less repeated entry without missing evidence.

## Implementation references

- `app/(admin)/admin/inventory/components/inventory-table.tsx`
- `app/(admin)/admin/inventory/components/inventory-filters.tsx`
- `app/(admin)/admin/inventory/components/inventory-client-manager.tsx`
- `app/(admin)/admin/inventory/components/inventory-pending-approvals.tsx`
- `app/(admin)/admin/inventory/components/assignment-queue-table.tsx`
- `app/(admin)/admin/inventory/components/clearance-queue-table.tsx`
- `app/(admin)/my/inventory/`
- `components/inventory/gadget-checklist-fields.tsx`
- `lib/api/inventory.ts`

This draft is grounded in source review. Live visual inspection and representative role/data verification remain part of implementation.

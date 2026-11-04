# ADR-0003: Individual assets with staff equipment batches

Date: 2026-10-20
Status: Accepted by the user and implemented.

## Context

Management needs an equipment form with fixed Laptop, Laptop charger, Phone, Phone charger, and SIM card rows, followed by other assigned equipment. Staff can receive several items together, return selected equipment for upgrades/repairs, or undergo full clearance. Individual custody and inspection history must remain intact.

## Decision

- Keep Laravel inventory items and individual assignments as the source of truth. Keep existing officer and compliance decisions per item.
- Add explicit asset types, generated immutable internal asset tags, optional manufacturer serials, and optional accessory-to-device links. Links suggest selection and do not silently transfer custody.
- Add issue batch IDs to individual assignments. Batch issue and staff acceptance run transactionally using the existing transition rules. An unavailable/invalid item rolls back the whole operation. Batch acceptance covers exactly the employee's currently pending items in that batch.
- Capture asset identity and condition in an assignment snapshot on creation. Historical issue forms use this snapshot. Existing pre-snapshot records retain a live-data fallback because historic identity cannot be reconstructed reliably.
- Baseline lifecycle: retain the initial IT/Admin checklist until assignment completion; final compliance approval promotes the staff checklist to the live baseline. Final clearance promotes the IT/Admin return checklist, including when the device goes to Repairs. Pending reviews and handovers do not promote checklists. Original assignment checklists and identity snapshots remain unchanged. `inventory:sync-baselines` can audit older records and requires `--apply` to save corrections; open workflows are skipped.
- Treat fixed PDF rows as presentation slots. Blank forms have empty cells; populated forms mark absent equipment Not issued. Duplicate standard types and other assets append below.
- Distinguish current equipment lists from issue acknowledgements. Current lists are generated from actual custody and retain the associated issue records, staff contact details, and recorded approval evidence. As clarified by the user, current declarations include recorded names and dates when every listed item has the relevant affirmative decision. Multiple reviewers or dates are listed explicitly and labelled as per-item approvals, not a new signing event. Missing or incomplete approvals remain blank; mixed issues must never inherit only the first record's signature.
- Selected returns use the existing per-item return workflow with a shared clearance batch ID; full clearance retains the existing all-equipment operation. A repair does not silently clear custody or change repair state: clear the selected items, then record repair custody/provider through inventory.
- Fetch employee equipment directly, independent of inventory list filters and pagination. Fetch selectable stock and linked-device choices through all relevant inventory pages.

## Consequences

The employee equipment screen is a projection over assets, not a replacement inventory model. Users acknowledge equipment together while officer/compliance reviews and correction routes remain item-specific. Accessory links must not span different employees' custody or reservations. The additive migration preserves existing inventory and assignments; it deliberately does not invent manufacturer serials on rollback.

## Validation

In-memory backend feature tests cover batch rollback, nullable serials with unique asset tags, snapshot preservation, exact pending-set acceptance, and selected returns. Frontend tests cover standard row order, absent rows, duplicate assets, snapshots, accessory suggestions, and API payloads. PDF previews cover blank and populated forms. Existing inventory task/clearance tests remain in use.

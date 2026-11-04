# ADR-0030: Shared server prefills for recruitment dialogs

Accepted, 2026-11-01. Extends ADR-0008.

## Decision

The role response already reads applicant stage records to calculate table summaries. Reuse those batched reads for advancement, status/history, stage assessments, the candidate overview and documents instead of making each dialog retrieve the same pipeline again when it opens. The server role page expands compact prefills and passes initial contexts and final reviews into the board and its dialogs.

Definitions matching the current role configuration are represented once and shared across records. Historical definition differences are retained explicitly. Stage records include saved payloads/results, assessor attribution and dates; compact decision history excludes event snapshots. Candidate summaries include CV summaries and bounded structured fields, while full extracted CV text, interview probes, attachment data and internal generation tokens stay out of the page response. The outgoing candidate projection remains explicit even after timeout recovery refreshes a full model.

Final-review readiness and freshness use the same evidence/fingerprint logic as the dedicated endpoint. Only applicants with a saved AI review need a batched raw-CV lookup to validate fingerprints; that text is used internally and is never serialized into the role response. There are no additional per-applicant prefill queries. Prefills are capped at 128 KiB per applicant and 1 MiB per role response. Oversized records retain the existing on-demand path rather than being truncated.

Dialog state initializes from the server snapshot without replacing edits during parent refreshes. Successful stage saves/decisions update the board's local contexts so opening the next dialog can reuse the response. Review saves/generation update the local final-review prefill. Fresh server records supersede optimistic contexts on reopening. Client-side changes to evidence conservatively mark existing AI findings outdated until canonical server data refreshes. Conflicts still reload current details, and all backend revision, permission, score and approval gates remain authoritative.

Explicit reloads, fresh document generation, CV details/polling, complete email histories and management-review versions remain on demand. No new route structure, global cache, migration or dependency is introduced.

## Verification

Tests cover first-render prefills without opening requests, shared versus historical definitions, constant query counts as applicants are added, exclusion of raw CV/probe/snapshot data, saved-AI freshness and oversized-record fallback. Existing recruitment tests protect autosave, rejection, progression, management approval, offers and stale-revision handling.

# ADR-0004: Five-stage recruitment workflow

## Status

The missing-AI-score gate below is superseded by ADR-0006: HR may explicitly review the original CV and advance with a required note, without assigning a score.

Accepted, 2026-10-14. Supersedes the combined assessment workflow for new recruitment roles; historical assessments remain readable.

## Decision

New roles use CV screening, call screening, oral interview, written exam and practical exercise in order, followed by Ready for management review. Stage, within-stage status and HR decision are separate concepts. A single workflow service owns writes, server-calculated scores, progression rules, optimistic revisions and decision history.

Role configuration contains fixed department questions, custom oral questions, stage thresholds, salary budget and within-stage statuses. Definitions are snapshotted when assessments begin. Oral, written and practical scores contribute 35%, 25% and 40%. Written answers contribute 60% of the written stage and observed computer skills 40%; graduates answer three general prompts and are exempt from two role prompts. CV screening records the AI score as its stage score, with a fixed 50% pass mark and an HR note required to advance below it. It is a screening gate and does not change the agreed final assessment weights; call screening remains unscored. HR completes marking from external written/practical work; the portal supplies guides and records grades.

Stages require an explicit HR decision. Passing enables advancement; failed thresholds and critical checks remain visible when HR records a reasoned exception. Holds retain the current stage and require a follow-up date. Reopening or moving back requires a reason and invalidates downstream completion without erasing decision history. Custom status labels cannot change a stage or satisfy completion.

The role table shows all applicants by default, with stage and status filters. CV analysis loads on demand in a sheet. A compact next-stage action accepts optional comments for passing stages and requires an HR note for exceptions. CV review/completion and advancement occur in one transaction when requested from the table; other stages must already be completed. Advancement always checks the latest successful CV analysis, so a reanalysis cannot reuse an old passing score. Generation/revision checks prevent duplicate or stale moves, and comments are retained in decision history.

All new-flow HR work remains on the role workspace: a wide sheet for oral interviewing, compact form modals for call/written/practical stages and final recommendations, and modals for vacancy settings and applicant decisions/history. No individual-role stat cards or separate applicant/settings screens are needed. Existing URLs redirect to the workspace with the relevant overlay open. Closing stage forms drains autosave; failed saves retain the draft. Previous-stage marks remain available read-only through status/history.

Stage forms use a Move to next-stage action that completes grading and invokes the existing progression rules within one transaction. Missing marks, failed standards without an HR note, and revision conflicts roll back both completion and movement. The exception note is stored with the draft and copied into the advancement event. Final HR recommendations remain a save action because MP review/offers are deferred.

CV uploads save immediately. Text extraction and provider calls run in a database-backed queued job, with generation tokens preventing stale retries from overwriting newer analysis. Pending/processing/failed have null scores; failures are retryable. A running queue worker is required. No client polling writes records or invokes AI. Salary compatibility guidance is deterministic and advisory; no age, location or other automatic compatibility rejection rules are introduced.

## Migration

Additive role configuration, candidate pipeline fields, stage records and events retain existing data. New role creation uses this workflow. Existing roles can explicitly enable it; no candidate stage is inferred from historical Interviewing. Legacy status and offer APIs reject bypasses for workflow roles. MP review and offer integration remain deferred at the agreed management-review boundary.

## Validation

Tests cover progression order, custom statuses, thresholds and overrides, graduate scoring, written 60/40 split, final 35/25/40 weighting, draft conflicts, history, hold/reopen/back, nonblocking CV jobs, stale job results and permission enforcement.

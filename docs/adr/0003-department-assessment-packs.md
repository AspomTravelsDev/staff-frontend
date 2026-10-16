# ADR-0003: Department assessment packs

## Status

Accepted, 2026-10-14. Extends ADR-0002.

## Context

The Accounts recruitment assessment pack contains three distinct work samples, an observation review, specific marking criteria and critical safety checks. One generic practical prompt does not preserve that structure or make the result explainable.

## Decision

Versioned department packs define ordered practical modules with candidate scenarios, tasks, duration, assessor-only guidance and criteria. A module list is frozen in the assessment plan alongside the flattened practical criterion index. The existing practical_marks JSON stores globally unique criterion IDs. The index preserves the existing persistence contract; the ordered modules organise presentation, task pass checks and reports.

The Accounts scorecard uses structured interview 10, additional knowledge 10, Test A 20, Test B 25, Test C 20, and observed completeness/self-check 15. Shared general and talent questions remain in the interview but carry zero additional weight for this pack. The ten Accounts core questions use scoring_section=interview while retaining their role-section presentation. Practical raw points aggregate across the 80-point pack; they are not averaged equally across unequal-sized tests. Scores 80+ progress, 70–79 hold, below 70 do not progress; 90+ is the portal's strong-hire subdivision. All critical checks must pass.

Practical criteria use 0–5 marks, with explicit minimum 3 for critical safe behaviours. A failed critical check overrides the aggregate guidance. New packs require criterion marks; generic prompt ratings cannot substitute for them. Frozen legacy snapshots retain their prior scoring and fallback.

All other tracks use the same evidence-led structure with their own scenarios, time allowances, marking criteria and safety checks. Role-specific weightings remain track-specific. The UI displays one practical task at a time; candidate-brief mode omits the marking criteria and answer guide. Task evidence uses unscored snapshot question IDs so validation, autosave, revisions and conflict reconciliation follow the existing path.

## Consequences

- No new database table or persistence approach is required.
- The bank generator reads checked-in pack definitions and question overrides; rebuilding cannot restore old content accidentally.
- Existing locked plans retain their content and weights. Unused role setups adopt the updated bank when saved.
- Submitted exports and AI interview review receive practical marks, evidence and critical checks.

## Validation

Tests check all department definitions, exact Accounts points, incomplete marks, critical failure despite a high total, invalid/foreign criteria, saving evidence and legacy calculation. Client tests check score preview parity and critical-check guidance.

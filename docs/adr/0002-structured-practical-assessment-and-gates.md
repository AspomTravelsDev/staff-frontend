# ADR-0002: Structured practical assessment and hiring gates

Date: 2026-10-14

## Status

Accepted.

## Context

Applicant Assessment currently calculates a weighted average from 1–5 interview responses. Practical prompts use the same generic scale, allowing a strong interview average to obscure weak accuracy, integrity, or task performance in high-risk roles.

## Decision

New assessment plans use server-owned, versioned practical modules and role profiles. A practical module defines marking criteria, total marks, required findings, pass rules, and a normalized score. Plans additionally contain role-specific weights and critical competency minimums. These are frozen when the first assessment starts and copied into the candidate snapshot.

The server calculates a score, gate outcomes, and non-binding hiring guidance. HR records the final recommendation; a recommendation that conflicts with failed gates requires an explicit rationale. Existing locked plans and candidate assessments retain their former calculation.

## Consequences

- Visa, Accounts, Compliance, and IT can make accuracy/integrity or practical results non-compensable.
- Practical grading is reproducible and can be reviewed with the submitted assessment.
- New plans add structured JSON documents rather than introducing a generic question-answer schema.
- The assessment service remains the single writer/calculator for plan rules, marks, gates, and guidance.

## Validation

Feature tests cover score normalization, critical competency failures, practical finding thresholds, score bands, snapshot stability, and legacy-plan compatibility. UI tests cover saving marks and showing guidance without treating it as a final HR decision.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

HR staff and leadership use the Aspom Travels Staff Portal to operate internal people processes. During recruitment, HR and leadership prepare a vacancy assessment, interview applicants, record evidence and scores in real time, evaluate candidates, and progress hiring decisions.

## Product Purpose

The portal brings staff operations into one working system. Recruitment assessments make interviews structured, comparable, and faster to complete without taking the interviewer away from the candidate conversation.

## Positioning

The recruitment workflow keeps the interview questions, practical-task marks, assessment evidence, AI review, and hiring details in one applicant record. HR does not need to copy the same interview into separate forms.

## Operating Context

Interviews are time-sensitive live sessions. The interviewer often needs to move through questions, score answers, take optional notes, complete practical exercises, recover from interruptions, and make a defensible recommendation while maintaining a conversation with the applicant.

## Capabilities and Constraints

- Assessment setup belongs to a recruitment role and is locked after interviews begin.
- General interview questions are included in every assessment; role-specific questions and practical exercises vary by recruitment track.
- HR and leadership complete assessments; the portal records revisions and calculated scores.
- Practical exercises use criterion-level marks, mandatory findings, role-specific weights, and non-compensable gates.
- Assessment details inform the AI interview review and hiring decision.
- The recruitment pipeline table must surface the next recommended HR action for each applicant instead of requiring users to inspect a secondary menu.

## Brand Commitments

Aspom Travels uses a premium internal portal experience. The durable product priority is fast, confident HR operations.

## Evidence on Hand

- Assessment implementation and UX plan: `docs/plans/applicant-assessment.md`
- Assessment architecture decisions: `docs/adr/0001-separate-applicant-assessments.md` and `docs/adr/0002-structured-practical-assessment-and-gates.md`
- Current recruitment interface and assessment components: `app/(admin)/hr/recruitment/`

## Product Principles

1. Keep live HR work moving with clear next actions and little administrative overhead.
2. Make scoring, gates, and hiring guidance understandable at the point of decision.
3. Preserve a complete, defensible record without asking HR to enter the same information twice.
4. Let the interface support a human interview instead of competing for attention.

## Accessibility & Inclusion

Controls must remain legible, keyboard-accessible, and usable during time-sensitive work.

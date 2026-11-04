# 0017: Preserve onboarding verification for unchanged evidence

Status: Accepted
Date: 2026-10-27

## Context

Applicant step saves replace whole form sections. Guarantor and referee forms omit HR verification metadata, so returning through those steps could erase a completed check. Address verification could also remain valid incorrectly after an address change.

## Decision

The backend `OnboardingVerification` service merges applicant data at both step-save and final-submission boundaries. HR verification fields always come from the stored application, never the applicant payload.

Preserve address verification when the residential address is unchanged. Preserve each guarantor/referee verification when that contact and their signed document are unchanged. Changes invalidate only the affected check; retain the old verification, proof and reviewer in `form_data.verificationHistory`. Existing records work without migration or re-verification.

Comparison ignores object key order, surrounding/repeated whitespace, empty optional values, verification metadata, and regenerated acceptance/upload timestamps. It remains conservative about other changes, including replacement signed-file identities. Requesting corrections alone does not invalidate verification.

## Consequences

HR does not repeat unchanged checks after corrections. Changed evidence requires a new check. Archived verification is retained in stored history but has no dedicated history UI yet. Previously erased verification cannot be recreated automatically.

Validation: backend `tests/Unit/OnboardingVerificationTest.php` covers unchanged resubmissions, isolated changes, replacement evidence, applicant verification overrides and final submission.

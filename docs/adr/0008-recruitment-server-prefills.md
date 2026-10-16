# ADR-0008: Server-loaded recruitment prefills

## Status

Accepted, 2026-10-16.

## Context and decision

The recruitment role page already fetches its role and candidate list on the server. Small form prefills should travel with that response and be passed into client components. Offer preparation now follows this pattern: the backend batches linked onboarding applications in one query and projects only the name, email, position, relevant employment terms and delivery state. It does not serialize the onboarding form, documents or internal generation token. The offer dialog opens immediately without a second prefill request.

Large CV analyses, complete assessment records and management review versions remain on demand. Preloading these for every applicant would increase initial payload size and repeat that cost on page refreshes. Polling remains necessary for asynchronous CV analysis. Other detail overlays have not been migrated to a shared cache by this change.

Form state initializes on opening and remains local during editing, including page refreshes after failures. Closing and reopening uses refreshed page data. The server still checks permissions, current management approval, evidence freshness and document generation before mutations or sending; page data is a display snapshot, never authorization.

## Consequences and validation

Fewer requests to open offer forms, without weakening progression rules or adding a global cache. Tests cover immediate saved-term prefill, fixed reporting manager despite supplied input, restricted projection, retries and stale management approval rejection. No database migration is required.

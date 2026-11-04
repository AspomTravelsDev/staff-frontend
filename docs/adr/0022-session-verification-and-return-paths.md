# Session verification and return paths

Accepted, 30 October 2026.

The remote Proxy verification described below is superseded by
[ADR 0024](0024-authenticate-at-data-access.md). Proxy no longer calls the backend;
authentication is enforced at server/data access and the API. The return-path and
browser recovery behavior remains applicable.

Protected page requests verify the token with the backend before rendering,
including requests which retain the existing client layout. Cookie presence
alone is insufficient. A missing token or an explicit backend authentication
rejection (401) causes local session cookies to be cleared and the user to return
to login. A rate limit, upstream failure, timeout, network error or malformed
verification response is not evidence of an expired token: it blocks the protected
request with a non-cacheable, retryable 503 response and preserves the session.
Server components route cleanup through the logout handler because they cannot
modify cookies. Data-load failure handling rechecks the session before offering
a retry; ordinary data errors retain their retry state when verification succeeds.

Middleware supplies an overwritten request header with the requested local page
and query parameters. Logout and login use a shared local-return-path validator,
excluding external destinations and authentication loops. Internal RSC query
parameters are removed. A protected server action receives the redirect header
expected by the installed Next action client instead of an HTML fetch response.
Login submissions establish their own session without middleware deleting the new
cookies. Login page responses never delete an invalid or unverified cookie, which
could otherwise race with a fresh login setting a replacement. A verified session
can return to the dashboard; cookie presence alone does not trigger that redirect.

Updated after an immediate-logout regression on 30 October 2026: the earlier
implementation cleared both cookies on every failed verification, including a
temporary 429/503 immediately after a successful verification. Server-side
`getCurrentUser` now makes the same distinction and uses React's request-scoped
cache to avoid duplicate validation across components in one render. Temporary
failures reach the retry/error UI without initiating logout. There is no global
cache of identities or cross-request bypass of token verification.

The browser API client and authenticated provider recover from protected 401
responses, retaining the live address, including its fragment. The provider also
covers same-origin upload and download requests outside the shared API client.
It excludes third-party failures and credential endpoints, installs only while
authenticated, restores fetch on cleanup, and ignores requests from an unmounted
session. Permission denials do not trigger session recovery.

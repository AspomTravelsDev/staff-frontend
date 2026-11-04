# Authenticate at data access instead of a network preflight in Proxy

Accepted, 30 October 2026. Supersedes the remote Proxy verification portion of
[ADR 0022](0022-session-verification-and-return-paths.md).

The production frontend repeatedly displayed the raw `Session verification is
temporarily unavailable` response after the backend database connection issue was
addressed. The response originated solely from a separate `/api/user` request in
Proxy. A redirect, timeout, rate limit or malformed reply could block the entire
app before its normal server authentication/data path ran. Proxy also repeated
this request for route prefetches and server actions, increasing API/connection
traffic. The exact remaining production upstream response was not captured.

Proxy now performs an optimistic cookie-presence check and sets the trusted local
return-path header. Missing cookies redirect protected pages/actions to login.
Existing cookies are not treated as authenticated identities and are not used to
redirect login-page visits to protected pages. Proxy makes no backend requests.

Actual verification remains in the request-memoized `getCurrentUser` and Laravel
Sanctum on protected API reads and mutations. A forged cookie cannot produce a
verified user. The shared server API client redirects protected 401 responses
through cookie cleanup with the original return path. Next control-flow exceptions
are rethrown from the API client's catch block. This covers navigation that
retains an existing layout as soon as its protected data request is rejected.
Browser upload/download 401 recovery remains in place. Public authentication
errors remain form errors; permission errors and temporary outages preserve the
session and use the normal page/query error handling.

The fix does not introduce an identity cache across users/requests, bypass backend
authorization, or rely solely on a layout for protecting data. Persistent MySQL
connections are a separate opt-in hosting mitigation.

Regression checks exercise a redirect response producing the previous raw 503,
zero Proxy fetches including prefetch-like navigation, the actual Next response,
forged-cookie rejection at server verification, protected server 401 redirects,
public login errors and retained browser/session recovery. These local checks do
not substitute for confirming a production login after the frontend redeploy.

Reference: https://nextjs.org/docs/app/guides/authentication

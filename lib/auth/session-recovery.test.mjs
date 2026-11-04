import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(filename, imports = {}, globals = {}) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require(name) {
    if (name in imports) return imports[name];
    if (name === './return-path') return load('lib/auth/return-path.ts');
    if (name === '@/lib/auth/return-path') return load('lib/auth/return-path.ts');
    throw new Error(`Unexpected import: ${name}`);
  }, URL, Headers, AbortSignal, process: { env: { NODE_ENV: 'production', API_URL: 'https://backend.test' } }, ...globals });
  return loaded.exports;
}
function proxyWith(response) {
  const requests = [];
  const result = (kind, url, options) => ({ kind, url: url?.toString(), options, cleared: [], cookies: { delete(name) { this.owner.cleared.push(name); } } });
  const responseFactory = (kind, url, options) => { const value = result(kind, url, options); value.cookies.owner = value; return value; };
  class MockResponse {
    constructor(body, options) { const value = responseFactory('action', null, options); value.headers = new Headers(options.headers); value.status = options.status ?? 200; value.body = body; return value; }
    static next(options) { return responseFactory('next', null, options); }
    static redirect(url, options) { return responseFactory('redirect', url, options); }
  }
  const { proxy } = load('proxy.ts', { 'next/server': { NextResponse: MockResponse } }, { fetch: async (...args) => { requests.push(args); return typeof response === 'function' ? response(...args) : response; } });
  return { proxy, requests };
}
const request = (path, token = 'test-session') => ({ url: `https://portal.test${path}`, nextUrl: new URL(`https://portal.test${path}`), headers: new Headers(), cookies: { get: name => name === 'auth_token' && token ? { value: token } : undefined } });

test('a signed-in page reaches normal server verification without an extra proxy network check', async () => {
  const { proxy, requests } = proxyWith(new Response('', { status: 302, headers: { location: 'https://backend.test/api/user/' } }));
  const response = await proxy(request('/dashboard'));
  assert.equal(response.kind, 'next', 'a separate verification preflight must not replace the app with a plain 503 screen');
  assert.equal(requests.length, 0);
  assert.equal(response.cleared.length, 0);
});

test('rate limits network failures and malformed upstream replies cannot produce a proxy error screen', async () => {
  for (const response of [new Response('', { status: 429 }), new Response('', { status: 503 }), Response.json({}), () => { throw new Error('Network unavailable'); }]) {
    const h = proxyWith(response);
    const result = await h.proxy(request('/my/task-tracker'));
    assert.equal(result.kind, 'next');
    assert.equal(result.cleared.length, 0);
    assert.equal(h.requests.length, 0);
  }
});

test('the real Next response forwards the request and never returns the plain verification error', async () => {
  const { NextRequest, NextResponse } = await import('next/server.js');
  let calls = 0;
  const { proxy } = load('proxy.ts', { 'next/server': { NextResponse } }, { fetch: async () => { calls++; return new Response('', { status: 429 }); } });
  const result = await proxy(new NextRequest('https://portal.test/dashboard', { headers: { cookie: 'auth_token=test-session' } }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.has('set-cookie'), false);
  assert.equal(result.headers.get('x-middleware-next'), '1');
  assert.equal(calls, 0);
  assert.equal(await result.text(), '');
});

test('routing forwards a trusted return address without a duplicate authentication request', async () => {
  const { proxy, requests } = proxyWith(null);
  const input = request('/hr/recruitment?role=travel&_rsc=internal');
  input.headers.set('x-portal-return-path', '/spoofed');
  const response = await proxy(input);
  assert.equal(response.kind, 'next');
  assert.equal(requests.length, 0);
  assert.equal(response.options.request.headers.get('x-portal-return-path'), '/hr/recruitment?role=travel');
});

test('missing tokens redirect to login with the full original page and query', async () => {
  const { proxy, requests } = proxyWith(null);
  const response = await proxy(request('/my/compliance?id=query-1', null));
  assert.equal(new URL(response.url).pathname, '/login');
  assert.equal(new URL(response.url).searchParams.get('redirect'), '/my/compliance?id=query-1');
  assert.equal(requests.length, 0);
});

test('login page responses never delete a freshly established session or start a verification request', async () => {
  const { proxy, requests } = proxyWith(new Response('', { status: 401 }));
  const response = await proxy(request('/login?redirect=%2Fcompliance'));
  assert.equal(response.kind, 'next');
  assert.equal(response.cleared.length, 0);
  assert.equal(requests.length, 0);
});

test('missing-session server actions use the Next action redirect instead of login HTML', async () => {
  const { proxy } = proxyWith(null);
  const input = request('/compliance?id=query-1', null);
  input.headers.set('next-action', 'action-test');
  const response = await proxy(input);
  assert.equal(response.kind, 'action');
  assert.match(response.headers.get('x-action-redirect'), /^\/login\?redirect=.*;replace$/);
});

test('public pages do not need a session or backend verification', async () => {
  const { proxy, requests } = proxyWith(null);
  for (const path of ['/applicant/invite-1', '/visa/apply', '/api/public/records']) {
    assert.equal((await proxy(request(path, null))).kind, 'next');
  }
  assert.equal(requests.length, 0);
});

test('a forged cookie cannot pass server user verification after the optimistic routing check', async () => {
  const h = proxyWith(null);
  assert.equal((await h.proxy(request('/dashboard', 'forged-token'))).kind, 'next');
  let checked;
  const { getCurrentUser } = load('lib/auth/session.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'forged-token' }) }) },
    react: { cache: fn => fn },
    './api': { validateToken: async token => { checked = token; return { success: false, error: { code: 'UNAUTHENTICATED' } }; } },
    './recover-session': { redirectToSessionLogin: async () => { throw new Error('redirect-to-login'); } },
  });
  await assert.rejects(getCurrentUser(), /redirect-to-login/);
  assert.equal(checked, 'forged-token');
});

test('return paths retain local queries and anchors but reject external addresses and auth loops', () => {
  const { safeReturnPath } = load('lib/auth/return-path.ts');
  assert.equal(safeReturnPath('/compliance?id=query-1#evidence'), '/compliance?id=query-1#evidence');
  for (const address of ['https://external.test', '//external.test', '/%2fexternal.test', '/%5cexternal.test', '/auth/logout?redirect=/login', '/login', '/api/files/download/private']) {
    assert.equal(safeReturnPath(address), '/dashboard', address);
  }
});
test('getCurrentUser preserves a valid session when verification is temporarily unavailable', async () => {
  for (const code of ['NETWORK_ERROR', 'ABORTED', 'HTTP_429', 'HTTP_503']) {
    const redirects = [];
    const { getCurrentUser } = load('lib/auth/session.ts', {
      'next/headers': { cookies: async () => ({ get: () => ({ value: 'test-token' }) }) },
      react: { cache: fn => fn },
      './api': { validateToken: async () => ({ success: false, error: { code } }) },
      './recover-session': { redirectToSessionLogin: async () => { redirects.push('login'); throw new Error('redirect-to-login'); } },
    });
    await assert.rejects(getCurrentUser(), /temporarily unavailable/i);
    assert.deepEqual(redirects, []);
  }
});

test('getCurrentUser still signs out a token explicitly rejected by the backend', async () => {
  const { getCurrentUser } = load('lib/auth/session.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'test-token' }) }) },
    react: { cache: fn => fn },
    './api': { validateToken: async () => ({ success: false, error: { code: 'UNAUTHENTICATED' } }) },
    './recover-session': { redirectToSessionLogin: async () => { throw new Error('redirect-to-login'); } },
  });
  await assert.rejects(getCurrentUser(), /redirect-to-login/);
});
test('browser uploads sign out on protected 401s, preserve the current address, and restore fetch on unmount', async () => {
  const addresses = [];
  const original = async () => new Response('', { status: 401 });
  const browser = { fetch: original, location: { href: 'https://portal.test/compliance?id=1#evidence', origin: 'https://portal.test', pathname: '/compliance', search: '?id=1', hash: '#evidence', replace: address => addresses.push(address) } };
  const { installSessionRecovery } = load('lib/auth/browser-session.ts', {}, { window: browser });
  const cleanup = installSessionRecovery();
  await browser.fetch('/api/task-tracker');
  await browser.fetch('/api/task-tracker');
  assert.equal(addresses.length, 1);
  assert.equal(new URL(addresses[0], browser.location.href).searchParams.get('redirect'), '/compliance?id=1#evidence');
  cleanup();
  assert.equal(browser.fetch, original);
});
test('permission errors and third-party authentication failures do not sign a valid portal session out', async () => {
  const addresses = [];
  let status = 403;
  const browser = { fetch: async () => new Response('', { status }), location: { href: 'https://portal.test/compliance', origin: 'https://portal.test', replace: address => addresses.push(address) } };
  const { installSessionRecovery } = load('lib/auth/browser-session.ts', {}, { window: browser });
  const cleanup = installSessionRecovery();
  await browser.fetch('/api/task-tracker');
  status = 401;
  await browser.fetch('https://external.test/api/private');
  await browser.fetch('/api/login');
  assert.deepEqual(addresses, []);
  cleanup();
});
test('logout clears session cookies and passes the safe original page to login', async () => {
  let cleared = false;
  const { GET } = load('app/auth/logout/route.ts', {
    'next/server': { NextResponse: { redirect: url => ({ url }) } },
    '@/lib/auth/session': { clearSession: async () => { cleared = true; } },
  });
  const response = await GET(request('/auth/logout?redirect=%2Fcompliance%3Fstatus%3Dopen'));
  assert.equal(cleared, true);
  assert.equal(response.url.pathname, '/login');
  assert.equal(response.url.searchParams.get('redirect'), '/compliance?status=open');
});
test('successful login returns to the requested page and refuses external destinations', async () => {
  const { loginAction } = load('app/(auth)/login/actions.ts', {
    '@/lib/auth/api': { login: async () => ({ success: true, data: { token: 'test-token', user: { id: 'staff' } } }) },
    '@/lib/auth/session': { setSession: async () => {} },
    '@/lib/validations/auth': { loginSchema: { safeParse: data => ({ success: true, data }) } },
    'next/headers': { headers: async () => new Headers() },
    '@/lib/config/attendance': { ATTENDANCE_CONFIG: { isLoginAutoClockInEnabled: () => false } },
  });
  for (const [destination, expected] of [['/compliance?status=open', '/compliance?status=open'], ['//external.test', '/dashboard'], ['/auth/logout', '/dashboard']]) {
    const form = new FormData();
    form.set('email', 'test@example.test'); form.set('password', 'test-password'); form.set('redirect', destination);
    assert.equal((await loginAction(null, form)).destination, expected);
  }
});
test('a pending request from an unmounted user session cannot sign out a newly mounted session', async () => {
  const addresses = [];
  let finish;
  const browser = { fetch: () => new Promise(resolve => { finish = resolve; }), location: { href: 'https://portal.test/compliance', origin: 'https://portal.test', replace: address => addresses.push(address) } };
  const { installSessionRecovery } = load('lib/auth/browser-session.ts', {}, { window: browser });
  const cleanup = installSessionRecovery();
  const pending = browser.fetch('/api/task-tracker');
  cleanup();
  finish(new Response('', { status: 401 }));
  await pending;
  assert.deepEqual(addresses, []);
});
test('login submissions can replace a stale session without competing middleware cookie deletion', async () => {
  const { proxy, requests } = proxyWith(new Response('', { status: 401 }));
  const input = request('/login?redirect=%2Fcompliance');
  input.method = 'POST';
  input.headers.set('next-action', 'login-action');
  const response = await proxy(input);
  assert.equal(response.kind, 'next');
  assert.equal(response.cleared.length, 0);
  assert.equal(requests.length, 0);
});

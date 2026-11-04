import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("./client.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function client(response, token = "private-test-token", browser) {
  const loaded = { exports: {} };
  const logs = [];
  vm.runInNewContext(source, {
    module: loaded,
    exports: loaded.exports,
    require(name) {
      if (name === "@/lib/auth/return-path") return { sessionLogoutUrl: path => `/auth/logout?redirect=${encodeURIComponent(path)}` };
      if (name === "./config") return {};
      if (name === "@/lib/auth/session") return { getAuthToken: async () => token };
      if (name === "@/lib/auth/recover-session") return { redirectToSessionLogin: async () => {
        throw Object.assign(new Error('redirect to login'), { digest: 'NEXT_REDIRECT;replace;/auth/logout?redirect=%2Fcompliance;307;' });
      } };
      if (name === "next/navigation") return { unstable_rethrow(error) { if (error?.digest?.startsWith('NEXT_')) throw error; } };
      throw new Error(`Unexpected import ${name}`);
    },
    process: { env: { NODE_ENV: "production" } },
    ...(browser ? { window: browser } : {}),
    FormData,
    fetch: async () => response,
    console: { error: (...args) => logs.push(args) },
  });
  return { api: loaded.exports.api, browserApi: loaded.exports.apiClientBrowser, logs };
}

test("recruitment diagnostics distinguish JSON permission denial from HTML upstream rejection", async () => {
  for (const jsonDenied of [true, false]) {
    const code = jsonDenied ? "INSUFFICIENT_PERMISSIONS" : "UPLOAD_BLOCKED_BY_HOSTING";
    const contentType = jsonDenied ? "application/json" : "text/html";
    const response = new Response(jsonDenied
      ? JSON.stringify({ message: "You do not have permission to perform this action.", code })
      : "<html>Forbidden: private upstream details</html>", {
      status: 403, headers: {
        "Content-Type": contentType, Server: "hcdn", "x-hcdn-request-id": "test-cdn-request-id",
      },
    });
    const { api, logs } = client(response);
    const form = new FormData();
    form.append("name", "private candidate name");
    const result = await api.post("/api/recruitment/roles/role-id/candidates", form);
    assert.equal(result.success, false);
    assert.equal(result.error.code, code);
    assert.equal(result.error.error, jsonDenied
      ? "You do not have permission to perform this action."
      : "The hosting server blocked the CV upload. Please contact IT support.");
    assert.deepEqual(JSON.parse(JSON.stringify(logs)), [["[Recruitment CV upstream rejection]", {
      endpoint: "/api/recruitment/roles/role-id/candidates", status: 403, code,
      contentType, server: "hcdn", hcdnRequestId: "test-cdn-request-id", hasAuthToken: true,
    }]]);
    assert.doesNotMatch(JSON.stringify(logs), /private/);
  }
});

test("recruitment diagnostics identify absent authentication without exposing credentials", async () => {
  const { api, logs } = client(new Response(JSON.stringify({
    message: "Unauthenticated.", code: "UNAUTHENTICATED",
  }), { status: 401, headers: { "Content-Type": "application/json" } }), null);
  await assert.rejects(api.post("/api/recruitment/roles/role-id/candidates", new FormData()), error => error.digest?.startsWith('NEXT_REDIRECT;'));
  assert.equal(logs[0][1].hasAuthToken, false);
  assert.equal(logs[0][1].status, 401);
});

test("successful uploads and unrelated API errors do not produce recruitment diagnostics", async () => {
  const success = client(new Response(JSON.stringify({ data: { id: "candidate-id" } }), { status: 201 }));
  assert.equal((await success.api.post("/api/recruitment/roles/role-id/candidates", new FormData())).success, true);
  assert.equal(success.logs.length, 0);
  const unrelated = client(new Response("Forbidden", { status: 403 }));
  await unrelated.api.post("/api/other", {});
  assert.equal(unrelated.logs.length, 0);
});

test("protected server-side 401s redirect to session cleanup without being swallowed as network errors", async () => {
  const { api } = client(new Response('{"message":"Unauthenticated."}', { status: 401 }));
  await assert.rejects(api.get("/api/compliance"), error => error.digest?.includes('/auth/logout?redirect=%2Fcompliance'));
});

test("temporary API failures and permission denials do not trigger session cleanup", async () => {
  for (const status of [403, 429, 503]) {
    const { api } = client(new Response('', { status }));
    const result = await api.get('/api/compliance');
    assert.equal(result.success, false);
    assert.equal(result.error.code, `HTTP_${status}`);
  }
});

test("invalid login credentials remain a form error rather than starting session recovery", async () => {
  const { api } = client(Response.json({ message: 'Wrong credentials', code: 'INVALID_CREDENTIALS' }, { status: 401 }));
  const result = await api.post('/api/login', { email: 'fixture@example.test', password: 'fixture' });
  assert.equal(result.success, false);
  assert.equal(result.error.code, 'INVALID_CREDENTIALS');
});

test("browser API recovery preserves the page for both missing and expired tokens", async () => {
  for (const token of [undefined, 'expired-token']) {
    const addresses = [];
    const browser = { location: { pathname: '/compliance', search: '?id=query-1', hash: '#evidence', replace: address => addresses.push(address) } };
    const { browserApi } = client(new Response('', { status: 401 }), null, browser);
    await assert.rejects(browserApi('/api/compliance', { token }));
    assert.equal(addresses.length, 1);
    assert.equal(new URL(addresses[0], 'https://portal.test').searchParams.get('redirect'), '/compliance?id=query-1#evidence');
  }
});

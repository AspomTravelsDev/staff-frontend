import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://portal.aspomportal.com";

function worker({ network = async () => new Response("online"), offlinePage, storageError } = {}) {
  const handlers = new Map();
  const calls = { fetch: 0, cache: 0 };
  vm.runInNewContext(source, {
    self: { location: { origin }, addEventListener: (name, handler) => handlers.set(name, handler) },
    URL,
    Response,
    fetch: async (request) => { calls.fetch++; return network(request); },
    caches: {
      open: async () => {
        calls.cache++;
        if (storageError) throw storageError;
        return { match: async () => offlinePage };
      },
    },
  });
  return {
    calls,
    request(request) {
      let response;
      handlers.get("fetch")({ request, respondWith: (promise) => { response = promise; } });
      return response;
    },
  };
}

test("CV upload server actions bypass the service worker without consuming the upload", () => {
  const sw = worker({ network: async () => { throw new Error("network failed"); } });
  assert.equal(sw.request({
    url: `${origin}/hr/recruitment/role-id`, method: "POST", mode: "cors",
    headers: new Headers({ "Next-Action": "upload-action" }),
  }), undefined);
  assert.deepEqual(sw.calls, { fetch: 0, cache: 0 });
});

test("API, Next.js data, asset, and external requests use normal networking", () => {
  const sw = worker();
  for (const request of [
    { url: `${origin}/api/recruitment`, method: "GET", mode: "cors" },
    { url: `${origin}/hr/recruitment?_rsc=test`, method: "GET", mode: "same-origin" },
    { url: `${origin}/_next/static/chunk.js`, method: "GET", mode: "no-cors" },
    { url: "https://api.aspomportal.com/api/recruitment", method: "POST", mode: "cors" },
    { url: "https://example.com/", method: "GET", mode: "navigate" },
  ]) assert.equal(sw.request(request), undefined);
  assert.deepEqual(sw.calls, { fetch: 0, cache: 0 });
});

test("online document navigations preserve the server response including errors", async () => {
  for (const status of [200, 403, 413, 500]) {
    const response = new Response("server response", { status });
    const sw = worker({ network: async () => response });
    assert.equal(await sw.request({ url: `${origin}/hr/recruitment`, method: "GET", mode: "navigate" }), response);
    assert.deepEqual(sw.calls, { fetch: 1, cache: 0 });
  }
});

test("offline document navigations return the cached offline page", async () => {
  const offlinePage = new Response("offline page", { headers: { "Content-Type": "text/html" } });
  const sw = worker({ network: async () => { throw new Error("offline"); }, offlinePage });
  assert.equal(await sw.request({ url: `${origin}/hr/recruitment`, method: "GET", mode: "navigate" }), offlinePage);
});

test("missing or unavailable offline cache still produces a valid response", async () => {
  for (const storageError of [undefined, new Error("storage unavailable")]) {
    const sw = worker({ network: async () => { throw new Error("offline"); }, storageError });
    const response = await sw.request({ url: `${origin}/hr/recruitment`, method: "GET", mode: "navigate" });
    assert.ok(response instanceof Response);
    assert.equal(response.status, 503);
    assert.match(await response.text(), /Reconnect/);
  }
});

test("download and API navigations never receive an offline HTML fallback", () => {
  const sw = worker({ network: async () => { throw new Error("reset"); }, offlinePage: new Response("offline page") });
  for (const path of ["/api/onboarding/app/documents/files/file", "/api/proxy-file?url=test", "/_next/static/chunk.js", "/forms/guarantor.pdf"]) {
    assert.equal(sw.request({ url: origin + path, method: "GET", mode: "navigate" }), undefined);
  }
  assert.deepEqual(sw.calls, { fetch: 0, cache: 0 });
});

import { actionLoader } from "../lib/api/action-test-utils.mjs";
test("development removes the portal worker instead of registering another one", async () => {
  const oldWindow = global.window;
  const oldNavigator = Object.getOwnPropertyDescriptor(global, "navigator");
  const oldEnv = process.env.NODE_ENV;
  const oldOptIn = process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER;
  const calls = [];
  let effect;
  global.window = { location: { origin: "http://localhost:3000" } };
  Object.defineProperty(global, "navigator", { configurable: true, value: { serviceWorker: {
    register: async () => calls.push("register"),
    getRegistrations: async () => [
      { active: { scriptURL: "http://localhost:3000/sw.js" }, unregister: async () => calls.push("unregister portal") },
      { active: { scriptURL: "http://localhost:3000/other-sw.js" }, unregister: async () => calls.push("unregister other") },
    ],
  } } });
  process.env.NODE_ENV = "development";
  delete process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER;
  try {
    const component = actionLoader(() => {}, { react: { useEffect: fn => { effect = fn; } } }).load("components/pwa/register-sw.tsx");
    component.RegisterServiceWorker(); effect();
    await new Promise(setImmediate);
    assert.deepEqual(calls, ["unregister portal"]);
  } finally {
    global.window = oldWindow;
    if (oldNavigator) Object.defineProperty(global, "navigator", oldNavigator); else delete global.navigator;
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
    if (oldOptIn === undefined) delete process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER; else process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER = oldOptIn;
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("task creation proxy forwards attachment bytes and form fields", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url, options };
    return Response.json({ data: { id: "task", attachments: [{ name: "brief.txt" }] } }, { status: 201 });
  };
  try {
    const { load } = actionLoader(() => {}, { "next/server": { NextResponse: Response } });
    const form = new FormData();
    form.append("title", "Prepare report");
    form.append("enable_email_reminder", "0");
    form.append("attachments[]", new File(["Task instructions"], "brief.txt", { type: "text/plain" }));
    const request = new Request("http://localhost/api/task-tracker", { method: "POST", body: form });
    const response = await load("app/api/task-tracker/route.ts").POST(request);
    assert.equal(response.status, 201);
    assert.match(forwarded.url, /\/api\/task-tracker$/);
    assert.equal(forwarded.options.body.get("title"), "Prepare report");
    assert.equal(forwarded.options.body.get("enable_email_reminder"), "0");
    const file = forwarded.options.body.get("attachments[]");
    assert.equal(file.name, "brief.txt");
    assert.equal(await file.text(), "Task instructions");
    assert.equal(forwarded.options.headers["Content-Type"], undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("task creation proxy rejects unauthenticated uploads", async () => {
  const { load } = actionLoader(() => {}, {
    "next/server": { NextResponse: Response },
    "@/lib/auth/session": { getAuthToken: async () => null },
  });
  const response = await load("app/api/task-tracker/route.ts").POST(new Request("http://localhost/api/task-tracker", { method: "POST" }));
  assert.equal(response.status, 401);
});

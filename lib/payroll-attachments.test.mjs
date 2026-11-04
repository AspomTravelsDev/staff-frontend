import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

function render(canUpload, status = "draft", categories) {
  const { load } = actionLoader(() => {}, {
    react: React, "react/jsx-runtime": runtime,
    "lucide-react": { Paperclip: () => null, Loader2: () => null, Download: () => null, ChevronDown: () => null },
    "@/components/ui/input": { Input: props => React.createElement("input", props) },
    "@/components/ui/label": { Label: props => React.createElement("label", props) },
    "@/lib/utils": { getProxiedImageUrl: value => value },
    "@/lib/utils/readable-date": { formatReadableDate: value => value },
    sonner: { toast: {} },
  });
  const { PayrollSupportingDocuments } = load("app/(admin)/hr/payroll/components/payroll-supporting-documents.tsx");
  return renderToStaticMarkup(React.createElement(PayrollSupportingDocuments, {
    canUpload, onUpdated() {}, run: { id: "run", status, uploadable_document_categories: categories, supporting_documents: [
      { id: "first", category: "attendance", name: "original.csv", version: 1, uploaded_at: "2026-10-25", uploaded_by: { name: "HR" }, download_url: "/first" },
      { id: "latest", category: "attendance", name: "corrected.csv", version: 2, uploaded_at: "2026-10-26", uploaded_by: { name: "HR" }, download_url: "/latest" },
      { id: "sanctions", category: "sanctions", name: "corrected.csv", version: 1, uploaded_at: "2026-10-26", uploaded_by: { name: "HR" }, download_url: "/sanctions" },
      { id: "reports", category: "todo_reports", name: "corrected.csv", version: 1, uploaded_at: "2026-10-26", uploaded_by: { name: "HR" }, download_url: "/reports" },
    ] },
  }));
}

test("HR and Super Admin draft access exposes two labeled uploads and preserves earlier versions", () => {
  const html = render(true);
  assert.equal((html.match(/type="file"/g) || []).length, 2);
  assert.doesNotMatch(html, /id="payroll-document-sanctions"/);
  for (const text of ["Attendance Sheet", "Sanction Sheet", "To-do &amp; Reports Sheet", "corrected.csv", "Download version 1", "Earlier versions (1)"]) assert.ok(html.includes(text), text);
});

test("without server upload permission review stages retain download actions only", () => {
  for (const [hr, status] of [[false, "draft"], [false, "account_review"], [true, "compliance_review"], [true, "closed"]]) {
    const html = render(hr, status);
    assert.doesNotMatch(html, /type="file"/);
    assert.match(html, /Download attendance/);
    assert.match(html, /Download sanction/);
    assert.match(html, /Download to-do &amp; reports/);
    assert.match(html, /href="\/sanctions"/);
    assert.match(html, /href="\/reports"/);
    assert.match(html, /download="corrected.csv"/);
    assert.doesNotMatch(html, /Reference sheets for|HR maintains these documents|HR can upload Excel/);
    assert.doesNotMatch(html, />corrected.csv<|>original.csv<|title="corrected.csv"/);
  }
});

test("server-authorized HR uploads exclude sanctions during HR, Accounts and Compliance stages", () => {
  for (const status of ["draft", "hr_draft", "account_review", "compliance_review"]) {
    const html = render(true, status, ["attendance", "todo_reports"]);
    assert.equal((html.match(/type="file"/g) || []).length, 2);
  }
});

test("payroll upload proxy forwards the run, category and file bytes", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url, options };
    return Response.json({ data: { id: "run" } }, { status: 201 });
  };
  try {
    const { load } = actionLoader(() => {}, { "next/server": { NextResponse: Response } });
    const form = new FormData();
    form.append("category", "sanctions");
    form.append("file", new File(["Reference sheet"], "sanctions.csv", { type: "text/csv" }));
    const response = await load("app/api/payroll/runs/[id]/attachments/route.ts").POST(new Request("http://localhost/upload", { method: "POST", body: form }), { params: Promise.resolve({ id: "run" }) });
    assert.equal(response.status, 201);
    assert.match(forwarded.url, /\/api\/hr\/payroll\/runs\/run\/attachments$/);
    assert.equal(forwarded.options.body.get("category"), "sanctions");
    assert.equal(await forwarded.options.body.get("file").text(), "Reference sheet");
  } finally { globalThis.fetch = originalFetch; }
});

 test("Compliance gets only the sanction picker at permitted stages", () => {
  for (const status of ["draft", "hr_draft", "account_review", "compliance_review"]) {
    const html = render(false, status, ["sanctions"]);
    assert.equal((html.match(/type="file"/g) || []).length, 1);
    assert.match(html, /id="payroll-document-sanctions"/);
    assert.doesNotMatch(html, /id="payroll-document-attendance"|id="payroll-document-todo_reports"/);
  }
  for (const status of ["mp_review", "md_approval", "closed"]) assert.doesNotMatch(render(false, status, []), /type="file"/);
});

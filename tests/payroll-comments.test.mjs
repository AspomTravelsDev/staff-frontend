import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const jsx = await import("react/jsx-runtime");
function harness({ role = "account", secondary_roles = [], status = "draft", failed = false, sendFails = false, history = [] } = {}) {
  let slot = 0;
  let form;
  let input;
  let dialog;
  let recipientInput;
  const state = [];
  const messages = [];
  const calls = [];
  const comment = { id: 1, run_id: "run", author_name: "Reviewer", author_role: "account", recipient_role: "hr", kind: "revision", stage: "draft", body: "Check <script>alert(1)</script>\nand attendance.", created_at: "2026-10-27T10:00:00Z" };
  const wrap = ({ children }) => React.createElement("div", null, children);
  const { load } = actionLoader((method, url, data) => {
    calls.push({ method, url, data });
    return Promise.resolve(sendFails ? { success: false, error: { error: "Unable to send." } } : { success: true, data: { data: { ...comment, id: 2, body: data.body } } });
  }, {
    react: { ...React, useEffect() {}, useRef: () => ({ current: 0 }), useState(initial) {
      const index = slot++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    } },
    "react/jsx-runtime": { ...jsx, jsx(type, props, key) { if (type === "form") form = props; return jsx.jsx(type, props, key); }, jsxs(type, props, key) { if (type === "form") form = props; if (type === "select" && props.id?.startsWith("payroll-recipient-")) recipientInput = props; return jsx.jsxs(type, props, key); } },
    "lucide-react": icons,
    "@tanstack/react-query": { useQuery: () => ({ data: failed ? undefined : { data: [comment], has_more: false, can_comment: !["closed", "processing"].includes(status) }, isPending: false, isFetching: false, isError: failed, error: new Error("Load failed"), refetch() {} }), useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    "sonner": { toast: { success: text => messages.push(text), error: text => messages.push(text) } },
    "@/providers/user-provider": { useUser: () => ({ user: { role, secondary_roles } }) },
    "@/lib/api/hooks/use-notifications": { useRoleNotifications: () => ({ data: { payrollComments: { count: 2, payroll_items: [{ id: "run", count: 2 }] } } }) },
    "@/components/ui/button": { Button: ({ children, variant, size, ...props }) => { void variant; void size; return React.createElement("button", props, children); } },
    "@/components/ui/label": { Label: props => React.createElement("label", props) },
    "@/components/ui/textarea": { Textarea: props => { input = props; return React.createElement("textarea", props); } },
    "@/components/ui/input": { Input: props => React.createElement("input", props) },
    "@/components/ui/sheet": { Sheet: wrap, SheetContent: ({ children }) => React.createElement("section", { "data-testid": "activity-sheet" }, children), SheetHeader: wrap, SheetTitle: wrap, SheetDescription: wrap, SheetTrigger: wrap },
    "@/components/ui/dialog": { Dialog: props => { dialog = props; return React.createElement("div", null, props.children); }, DialogContent: ({ children }) => dialog.open ? React.createElement("div", { role: "dialog" }, children) : null, DialogHeader: wrap, DialogTitle: wrap, DialogDescription: wrap, DialogFooter: wrap, DialogTrigger: wrap },
  });
  const { PayrollComments } = load("app/(admin)/hr/payroll/components/payroll-comments.tsx");
  return {
    render() { slot = 0; return renderToStaticMarkup(React.createElement(PayrollComments, { run: { id: "run", payroll_month: "2026-10", status, approval_history: history } })); },
    type(text) { input.onChange({ target: { value: text } }); },
    openDialog() { dialog.onOpenChange(true); },
    selectRecipient(value) { recipientInput.onChange({ target: { value } }); },
    send() { return form.onSubmit({ preventDefault() {} }); },
    calls, messages,
  };
}

test("revision comments retain stage context, escape content and show unread count", () => {
  const html = harness().render();
  assert.match(html, /Revision comment.*HR draft/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /To: HR/);
  assert.match(html, /Add comment/);
  assert.doesNotMatch(html, /<textarea|<form/);
  assert.match(html, />2<\/span>/);
});

test("secondary HR can comment; history-only viewers cannot see comments or the composer", () => {
  assert.match(harness({ role: "visa", secondary_roles: ["hr"] }).render(), /Add comment/);
  const html = harness({ role: "office-operations" }).render();
  assert.doesNotMatch(html, /<textarea|Check &lt;script&gt;/);
});

test("closed payroll is readable and failed fetch offers recovery", () => {
  const html = harness({ status: "closed" }).render();
  assert.match(html, /This payroll is read-only/);
  assert.doesNotMatch(html, /<textarea/);
  assert.doesNotMatch(html, /Add comment/);
  assert.match(harness({ failed: true }).render(), /Load failed.*Refresh/);
});

test("sending only posts a comment and clears the composer on success", async () => {
  const h = harness();
  h.render(); h.openDialog(); h.render(); h.selectRecipient("md"); h.type("Check attendance."); h.render();
  await h.send();
  assert.deepEqual(h.calls.map(c => c.url), ["/api/hr/payroll/runs/run/comments"]);
  assert.equal(h.calls[0].data.body, "Check attendance.");
  assert.equal(h.calls[0].data.recipient_role, "md");
  assert.doesNotMatch(h.render(), /<textarea[^>]*>Check attendance\./);
  assert.match(h.render(), /Check attendance\./);
});

test("failed sends keep the draft message for retry", async () => {
  const h = harness({ sendFails: true });
  h.render(); h.openDialog(); h.render(); h.selectRecipient("hr"); h.type("Keep this draft"); h.render();
  await h.send();
  assert.match(h.render(), /<textarea[^>]*>Keep this draft/);
  assert.match(h.render(), /value="hr" selected=""/);
  assert.deepEqual(h.messages, ["Unable to send."]);
});

test("the comment dialog requires a recipient and exposes all five destinations", async () => {
  const h = harness();
  h.render(); h.openDialog();
  const html = h.render();
  assert.match(html, /role="dialog"/);
  assert.doesNotMatch(html.match(/<section data-testid="activity-sheet">([\s\S]*?)<\/section>/)[1], /<textarea|<form/);
  for (const role of ["hr", "account", "compliance", "mp", "md"]) assert.match(html, new RegExp(`value="${role}"`));
  h.type("Choose a recipient first"); h.render();
  await h.send();
  assert.equal(h.calls.length, 0);
});

test("comment search preserves pagination and safely encodes the phrase", async () => {
  const calls = [];
  const { load } = actionLoader((method, url) => { calls.push(url); return Promise.resolve({ success: true, data: { data: [] } }); });
  const { getPayrollComments } = load("lib/api/payroll.ts");
  await getPayrollComments("run", 40, "  20% & attendance  ");
  const url = new URL(calls[0], "https://example.test");
  assert.equal(url.searchParams.get("before"), "40");
  assert.equal(url.searchParams.get("search"), "20% & attendance");
});

test("approval changes and comments share a timeline with newest records first", () => {
  const history = [{ actor_id: "hr", actor_name: "HR reviewer", actor_role: "hr", from_status: "draft", to_status: "account_review", action: "advance", note: "Ready for Accounts", created_at: "2026-10-27T11:00:00Z" }];
  const html = harness({ history }).render();
  assert.match(html, /Payroll activity/);
  assert.match(html, /Advanced payroll/);
  assert.match(html, /Ready for Accounts/);
  assert.ok(html.indexOf("HR reviewer") < html.indexOf("Reviewer"));
  const readOnly = harness({ role: "office-operations", history }).render();
  assert.match(readOnly, /Ready for Accounts/);
  assert.doesNotMatch(readOnly, /<textarea/);
});

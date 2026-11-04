import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = names => Object.fromEntries(names.split(" ").map(name => [name, name]));
const nodes = (tree, type) => Array.isArray(tree) ? tree.flatMap(item => nodes(item, type)) : !tree || typeof tree !== "object" ? [] : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
const tick = () => new Promise(resolve => setImmediate(resolve));
const fixture = () => ({ revision: 7, recipient: "ada@example.test", cc: null, reply_to: "hr@aspomtravels.com", draft: { event_id: "decision-1", template: "call_screening_pass", draft_revision: 0, subject: "Interview invitation", body_template: "Hi Ada, interview with {{interviewer}}.", body: "Hi Ada", fields: {}, field_definitions: [{ key: "interviewer", label: "Interviewer", type: "text", required: true }] }, history: [] });

function dialog(data = fixture(), sender) {
  const slots = [], effects = [], calls = [], changed = [];
  let cursor = 0, closed = 0;
  const record = (input, status) => ({ id: "mail-1", event_id: input.event_id, subject: data.draft.subject, body: "Prepared message", recipient: data.recipient, template_fields: input.fields, draft_revision: input.draft_revision + 1, status, sender: { name: "HR" }, updated_at: "2026-11-01" });
  const mutate = action => async (...args) => {
    calls.push([action, ...args]);
    if (action === "send" && sender) return sender(...args);
    return { success: true, data: record(args[1], action === "send" ? "sent" : action === "skip" ? "skipped" : "draft") };
  };
  const Component = actionLoader(undefined, {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
      useEffect(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((value, j) => slots[i][j] !== value)) { slots[i] = deps; effects.push(callback); } },
    },
    "react/jsx-runtime": jsxRuntime,
    "@/components/ui/button": named("Button"), "@/components/ui/input": named("Input"), "@/components/ui/label": named("Label"), "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/dialog": named("Dialog DialogContent DialogDescription DialogHeader DialogTitle"),
    "@/lib/api/recruitment-email": {
      getRecruitmentEmails: async () => data,
      sendRecruitmentEmail: mutate("send"), saveRecruitmentEmailDraft: mutate("save"), skipRecruitmentEmail: mutate("skip"),
    },
  }).load("app/(admin)/hr/recruitment/[id]/components/candidate-emails-dialog.tsx").CandidateEmailsDialog;
  return { calls, changed, get closed() { return closed; }, render() { cursor = 0; const tree = Component({ candidateId: "ada", name: "Ada", onClose() { closed++; }, onChanged(status) { changed.push(status); } }); effects.splice(0).forEach(effect => effect()); return tree; } };
}
const button = (tree, label) => nodes(tree, "Button").find(node => node.props.children === label);

test("email actions persist drafts, skip and send through candidate scoped endpoints", async () => {
  const calls = [];
  const actions = actionLoader(async (method, path, body) => {
    calls.push({ method, path, body });
    return method === "get" ? { success: true, data: { data: fixture() } } : { success: false, error: { error: "Already sent", code: "409" } };
  }).load("lib/api/recruitment-email.ts");
  assert.equal((await actions.getRecruitmentEmails("ada")).revision, 7);
  const input = { event_id: "decision-1", revision: 7, draft_revision: 0, fields: { interviewer: "HR team" } };
  assert.equal((await actions.sendRecruitmentEmail("ada", input)).error, "Already sent");
  await actions.saveRecruitmentEmailDraft("ada", input); await actions.skipRecruitmentEmail("ada", input);
  assert.deepEqual(calls.map(call => call.method), ["get", "post", "patch", "post"]);
  assert.equal(calls[3].path, "/api/recruitment/candidates/ada/emails/skip");
  assert.deepEqual(calls[1].body, input);
});

test("required fields build the preview and send once with decision and draft revisions", async () => {
  let finish;
  const control = dialog(fixture(), () => new Promise(resolve => { finish = resolve; }));
  control.render(); await tick();
  let tree = control.render();
  assert.equal(button(tree, "Send email").props.disabled, true);
  assert.equal(nodes(tree, "Input")[0].props.required, true);
  nodes(tree, "Input")[0].props.onChange({ target: { value: "HR team" } });
  tree = control.render();
  assert.equal(button(tree, "Send email").props.disabled, false);
  assert.ok(nodes(tree, "p").some(node => node.props.children === "Hi Ada, interview with HR team."));
  const form = nodes(tree, "form")[0];
  const pending = form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  assert.equal(control.calls.length, 1);
  assert.deepEqual(control.calls[0], ["send", "ada", { event_id: "decision-1", revision: 7, draft_revision: 0, fields: { interviewer: "HR team" } }]);
  finish({ success: true, data: { id: "sent-1", status: "sent", sender: { name: "HR" }, updated_at: "2026-11-01" } });
  await tick(); await pending;
  assert.equal(nodes(control.render(), "form").length, 0);
  assert.deepEqual(control.changed, ["sent"]);
});

test("closing saves partial edits and reopening uses the saved draft", async () => {
  const data = fixture();
  data.draft.field_definitions.push({ key: "focus", label: "Focus", type: "textarea", required: true });
  const control = dialog(data); control.render(); await tick();
  nodes(control.render(), "Input")[0].props.onChange({ target: { value: "Finance team" } });
  nodes(control.render(), "Dialog")[0].props.onOpenChange(false);
  await tick();
  assert.equal(control.closed, 1);
  assert.equal(control.calls[0][0], "save");
  assert.equal(control.calls[0][2].fields.interviewer, "Finance team");
  data.draft.fields = control.calls[0][2].fields; data.draft.draft_revision = 1;
  const reopened = dialog(data); reopened.render(); await tick();
  assert.equal(nodes(reopened.render(), "Input")[0].props.value, "Finance team");
  assert.equal(button(reopened.render(), "Send email").props.disabled, true);
});

test("skip is available without completing fields or a candidate address", async () => {
  const data = fixture(); data.recipient = null;
  const control = dialog(data); control.render(); await tick();
  let tree = control.render();
  assert.equal(button(tree, "Send email").props.disabled, true);
  assert.equal(button(tree, "Skip email").props.disabled, false);
  button(tree, "Skip email").props.onClick(); await tick();
  tree = control.render();
  assert.equal(nodes(tree, "form").length, 0);
  assert.deepEqual(control.changed, ["skipped"]);
});

test("delivery failures reload the saved draft revision for a safe retry", async () => {
  const data = fixture(); data.draft.fields = { interviewer: "HR team" };
  const control = dialog(data, async () => {
    data.draft.draft_revision = 1;
    data.history = [{ id: "failed-1", event_id: data.draft.event_id, status: "failed", template_fields: data.draft.fields, sender: { name: "HR" }, updated_at: "2026-11-01" }];
    return { success: false, error: "Delivery failed", code: "502" };
  });
  control.render(); await tick();
  nodes(control.render(), "form")[0].props.onSubmit({ preventDefault() {} }); await tick();
  const tree = control.render();
  assert.equal(nodes(tree, "Input")[0].props.value, "HR team");
  assert.equal(nodes(tree, "p").find(node => node.props.role === "alert").props.children, "Delivery failed");
  nodes(tree, "form")[0].props.onSubmit({ preventDefault() {} }); await tick();
  assert.equal(control.calls[1][2].draft_revision, 1);
});

test("the signature stays in a sandboxed preview and development does not copy HR", async () => {
  const data = fixture(); data.signature_html = "<table><tr><td>HR signature</td></tr></table>";
  const control = dialog(data); control.render(); await tick();
  const tree = control.render(), frame = nodes(tree, "iframe")[0];
  assert.equal(frame.props.sandbox, ""); assert.equal(frame.props.referrerPolicy, "no-referrer"); assert.match(frame.props.srcDoc, /HR signature/);
  const line = nodes(tree, "p").find(node => node.props.children?.[0] === "CC: ");
  assert.equal(line.props.children[1], "None — HR is not copied outside production");
});

test("conditional fields, HTTPS links, dates and placeholder text are checked", () => {
  const { emailFieldsComplete, previewRecruitmentEmail } = actionLoader().load("lib/recruitment/email-template.ts");
  const fields = [{ key: "delivery_method", type: "select", required: true, options: { email: "Email", link: "Link" } }, { key: "delivery_link", type: "url", required: true, when: { field: "delivery_method", value: "link" } }];
  assert.equal(emailFieldsComplete(fields, { delivery_method: "email" }), true);
  assert.equal(emailFieldsComplete(fields, { delivery_method: "link" }), false);
  assert.equal(emailFieldsComplete(fields, { delivery_method: "link", delivery_link: "javascript:alert(1)" }), false);
  assert.equal(emailFieldsComplete(fields, { delivery_method: "link", delivery_link: "https://example.test/q" }), true);
  assert.equal(emailFieldsComplete([{ key: "focus", required: true, type: "text" }], { focus: "[brief focus]" }), false);
  assert.equal(previewRecruitmentEmail("Call on {{day}}", [{ key: "day", type: "date" }], { day: "2026-11-01" }), "Call on 1 November 2026");
});

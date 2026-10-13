import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const formFile = "app/(admin)/hr/recruitment/[id]/components/interview-rubric-dialog.tsx";
const launcherFile = "app/(admin)/hr/recruitment/components/standalone-rubric-dialog.tsx";
const namedComponents = (names) => Object.fromEntries(names.split(" ").map((name) => [name, name]));

function nodes(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  if (!tree || typeof tree !== "object") return [];
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}

function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return tree && typeof tree === "object" ? text(tree.props?.children) : "";
}

// Exercise the real form, state transitions, PDF template, and export handlers.
// Only browser capture, PDF writing, UI primitives, and API calls are mocked.
function rubricControl(props = { standalone: true, open: true, onOpenChange() {} }, options = {}) {
  const hooks = [];
  let cursor = 0;
  let effects = [];
  const notices = [];
  const captures = [];
  const pdfCalls = [];
  const apiCalls = [];
  const dependenciesChanged = (previous, next) => !previous || next.some((value, i) => !Object.is(previous[i], value));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial;
      return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useMemo(compute, dependencies) {
      const index = cursor++;
      if (dependenciesChanged(hooks[index]?.dependencies, dependencies)) hooks[index] = { value: compute(), dependencies };
      return hooks[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (dependenciesChanged(hooks[index], dependencies)) effects.push(effect);
      hooks[index] = dependencies;
    },
  };
  const { load } = actionLoader(() => { throw new Error("Unexpected API request"); }, {
    react,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "date-fns": { format: () => "8th October 2026" },
    "lucide-react": namedComponents("Save Send Loader2 Sparkles ClipboardList User Award FileText DollarSign Download TrendingUp CheckCircle2 AlertTriangle XCircle RotateCw Target ShieldCheck"),
    "@/components/ui/dialog": namedComponents("Dialog DialogContent DialogHeader DialogTitle DialogDescription"),
    "@/components/ui/button": namedComponents("Button"),
    "@/components/ui/input": namedComponents("Input"),
    "@/components/ui/textarea": namedComponents("Textarea"),
    "@/components/ui/label": namedComponents("Label"),
    "@/components/ui/badge": namedComponents("Badge"),
    "@/components/ui/select": namedComponents("Select SelectContent SelectItem SelectTrigger SelectValue"),
    "../[id]/components/interview-rubric-dialog": { InterviewRubricDialog: "InterviewRubricDialog" },
    "@/lib/api/recruitment": {
      saveCandidateRubricAction: async (...args) => { apiCalls.push(["save", ...args]); return { success: true }; },
      analyzeInterviewAction: async (...args) => { apiCalls.push(["analyze", ...args]); return { success: true }; },
    },
    "html-to-image": { toJpeg: async (element) => {
      captures.push(element);
      if (options.exportError) throw new Error("Image capture failed");
      return "data:image/jpeg;base64,test";
    } },
    jspdf: { jsPDF: class {
      constructor(settings) { pdfCalls.push(["create", settings]); }
      addImage(...args) { pdfCalls.push(["image", ...args]); }
      save(filename) { pdfCalls.push(["save", filename]); }
    } },
    sonner: { toast: {
      loading: (message) => { notices.push(["loading", message]); return "toast-id"; },
      success: (message) => notices.push(["success", message]),
      error: (message) => notices.push(["error", message]),
    } },
  });
  const Component = load(options.launcher ? launcherFile : formFile)[options.launcher ? "StandaloneRubricDialog" : "InterviewRubricDialog"];
  function render() {
    let tree;
    do {
      cursor = 0;
      effects = [];
      tree = Component(props);
      const pendingEffects = effects;
      pendingEffects.forEach((effect) => effect());
    } while (effects.length);
    const document = nodes(tree, "div").find((node) => node.props.ref);
    if (document) document.props.ref.current = { offsetWidth: 800, offsetHeight: 1200, template: document };
    return tree;
  }
  const edit = (id, value) => {
    const field = [...nodes(render(), "Input"), ...nodes(render(), "Textarea")].find((node) => node.props.id === id);
    assert.ok(field, `Field ${id} exists`);
    field.props.onChange({ target: { value } });
  };
  const download = () => nodes(render(), "Button").find((node) => text(node).includes("Download Rubric PDF")).props.onClick();
  return { render, edit, download, notices, captures, pdfCalls, apiCalls };
}

test("recruitment launcher opens a standalone rubric without a candidate or role and unmounts it on close", () => {
  const ui = rubricControl({}, { launcher: true });
  assert.equal(nodes(ui.render(), "InterviewRubricDialog").length, 0);
  nodes(ui.render(), "Button")[0].props.onClick();
  const form = nodes(ui.render(), "InterviewRubricDialog")[0];
  assert.equal(form.props.standalone, true);
  assert.equal(form.props.candidate, undefined);
  assert.equal(form.props.roleId, undefined);
  form.props.onOpenChange(false);
  assert.equal(nodes(ui.render(), "InterviewRubricDialog").length, 0);
});

test("standalone rubric starts without scored ratings and offers PDF export without candidate save or AI actions", () => {
  const ui = rubricControl();
  const tree = ui.render();
  assert.match(text(tree), /This rubric is not saved in the portal/);
  assert.doesNotMatch(text(tree), /AI suggested|AI Post-Interview|Save Only|Save & Analyze|Proceed to Offer/);
  assert.deepEqual(nodes(tree, "Button").map(text), ["Download Rubric PDF", "Close"]);
  assert.equal(nodes(tree, "Input").find((node) => node.props.id === "interview_date").props.value, "8th October 2026");
  assert.equal(nodes(tree, "Input").find((node) => node.props.type === "number").props.value, "");
  assert.equal(nodes(tree, "button").some((node) => node.props.className.includes("scale-105")), false);
  assert.deepEqual(ui.apiCalls, []);
});

test("standalone PDF requires both an applicant name and role, rejecting empty or whitespace values", async () => {
  const ui = rubricControl();
  await ui.download();
  ui.edit("applicant_name", "   ");
  ui.edit("role_applied", "Visa Officer");
  await ui.download();
  ui.edit("applicant_name", "External Applicant");
  ui.edit("role_applied", "   ");
  await ui.download();
  assert.equal(ui.notices.filter(([kind]) => kind === "error").length, 3);
  assert.deepEqual(ui.captures, []);
  assert.deepEqual(ui.pdfCalls, []);
});

test("standalone export includes entered applicant, reviewer, scores and notes in the branded template without an API call", async () => {
  const ui = rubricControl();
  ui.edit("applicant_name", "Aaron O'Neil");
  ui.edit("role_applied", "Visa Officer");
  ui.edit("reviewer_name", "HR Reviewer");
  ui.edit("interview_date", "7th October 2026");
  ui.edit("interview_comments", "Strong communication during the interview");
  ui.edit("rec_salary", "250,000");
  nodes(ui.render(), "button").filter((node) => text(node) === "5").forEach((node) => node.props.onClick());
  nodes(ui.render(), "Input").find((node) => node.props.type === "number").props.onChange({ target: { value: "12" } });
  assert.equal(nodes(ui.render(), "Input").find((node) => node.props.type === "number").props.value, 10);
  await ui.download();
  assert.equal(ui.captures.length, 1);
  const template = text(ui.captures[0].template);
  for (const value of ["Aaron O'Neil", "Visa Officer", "HR Reviewer", "7th October 2026", "Strong communication during the interview", "250,000", "Total Score (out of 55)55"]) {
    assert.ok(template.includes(value), `PDF includes ${value}`);
  }
  assert.equal(nodes(ui.captures[0].template, "img")[0].props.src, "/aspom-logo.png");
  assert.deepEqual(ui.pdfCalls.at(-1), ["save", "Interview_Rubric_Aaron_O_Neil.pdf"]);
  assert.deepEqual(ui.apiCalls, []);
});

test("failed PDF export retains entered details and enables retry", async () => {
  const ui = rubricControl(undefined, { exportError: true });
  ui.edit("applicant_name", "External Applicant");
  ui.edit("role_applied", "Visa Officer");
  await ui.download();
  assert.ok(ui.notices.some(([kind, message]) => kind === "error" && message === "Failed to generate rubric PDF."));
  assert.equal(nodes(ui.render(), "Input").find((node) => node.props.id === "applicant_name").props.value, "External Applicant");
  assert.equal(nodes(ui.render(), "Button").find((node) => text(node) === "Download Rubric PDF").props.disabled, false);
  assert.deepEqual(ui.pdfCalls, []);
});

test("existing candidates still load saved rubrics and save through the candidate action", async () => {
  const updated = [];
  const closed = [];
  const candidate = {
    id: "candidate-id", name: "Existing Candidate", ai_suggested_rubric_scores: { teamwork: 4 },
    interview_rubric: { applicant_info: { name: "Saved Applicant", role_applied_for: "Visa Officer" }, reviewer_info: { name: "Reviewer" } },
  };
  const ui = rubricControl({ candidate, roleId: "role-id", roleTitle: "Visa Officer", roleDepartment: "Visa", open: true, onOpenChange: (value) => closed.push(value), onCandidateUpdated: (value) => updated.push(value) });
  assert.equal(nodes(ui.render(), "Input").find((node) => node.props.id === "applicant_name").props.value, "Saved Applicant");
  assert.match(text(ui.render()), /AI suggested: 4/);
  nodes(ui.render(), "Button").find((node) => text(node) === "Save Only").props.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(ui.apiCalls[0].slice(0, 3), ["save", "candidate-id", "role-id"]);
  assert.equal(ui.apiCalls[0][3].applicant_info.name, "Saved Applicant");
  assert.equal(updated[0].id, "candidate-id");
  assert.deepEqual(closed, [false]);
});

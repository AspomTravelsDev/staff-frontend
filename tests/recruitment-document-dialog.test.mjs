import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = names => Object.fromEntries(names.split(" ").map(name => [name, name]));
const nodes = (tree, type) => Array.isArray(tree) ? tree.flatMap(item => nodes(item, type)) : !tree || typeof tree !== "object" ? [] : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
const tick = () => new Promise(resolve => setImmediate(resolve));
const review = { revision: 0, ready: true, hr_comments: "Saved HR comment", ai: null, ai_stale: false };
const context = { candidate: { id: "ada", name: "Ada", pipeline_stage: "practical" }, role: { title: "Developer" }, definition: {}, events: [], records: [{ stage: "call_screening", state: "draft", payload: {}, results: {} }] };
function dialog() {
  const slots = [], pending = [], calls = [];
  let cursor = 0;
  const Component = actionLoader(undefined, {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
      useEffect(effect, deps) { const i = cursor++; if (!slots[i] || deps.some((value, j) => value !== slots[i][j])) { slots[i] = deps; pending.push(effect); } },
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": named("Download Loader2"),
    "@/components/ui/button": named("Button"),
    "@/components/ui/label": named("Label"),
    "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/dialog": named("Dialog DialogContent DialogDescription DialogHeader DialogTitle"),
    sonner: { toast: { success() {} } },
    "@/lib/api/recruitment-pipeline": { getRecruitmentPipeline: async () => context },
    "@/lib/api/recruitment-final-review": {
      getRecruitmentFinalReview: async () => review,
      generateRecruitmentFinalReview: async (...args) => { calls.push(args); return { success: true, data: { ...review, revision: 1 } }; },
      saveRecruitmentFinalComments: async (...args) => { calls.push(args); return { success: true, data: { ...review, revision: 2, hr_comments: args[2] } }; },
    },
  }).load("app/(admin)/hr/recruitment/[id]/components/stage-documents-dialog.tsx").StageDocumentsDialog;
  return { calls, render() { cursor = 0; const tree = Component({ candidate: context.candidate, onClose() {} }); pending.splice(0).forEach(effect => effect()); return tree; } };
}

test("all stages and final rubric are listed with filled and blank downloads, without a stage selector", async () => {
  const control = dialog(); control.render(); await tick(); const tree = control.render();
  assert.equal(nodes(tree, "section").filter(node => node.props["aria-label"]?.endsWith("documents")).length, 8);
  const buttons = nodes(tree, "Button");
  assert.equal(buttons.find(node => node.props["aria-label"] === "Download Call screening saved report").props.disabled, false);
  assert.equal(buttons.find(node => node.props["aria-label"] === "Download Practical exercise saved report").props.disabled, true);
  assert.equal(buttons.find(node => node.props["aria-label"] === "Download Practical exercise hr worksheet").props.disabled, false);
  assert.equal(nodes(tree, "Select").length, 0);
});

test("generating AI findings preserves unsaved HR comments and saves using the latest review revision", async () => {
  const control = dialog(); control.render(); await tick();
  nodes(control.render(), "Textarea")[0].props.onChange({ target: { value: "My independent edited comments" } });
  nodes(control.render(), "Button").find(node => node.props.children === "Generate AI review").props.onClick(); await tick();
  assert.equal(nodes(control.render(), "Textarea")[0].props.value, "My independent edited comments");
  nodes(control.render(), "Button").find(node => node.props.children === "Save HR comments").props.onClick(); await tick();
  assert.deepEqual(control.calls.at(-1), ["ada", 1, "My independent edited comments"]);
});

import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = (names) =>
  Object.fromEntries(names.split(" ").map((name) => [name, name]));
function nodes(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  if (!tree || typeof tree !== "object") return [];
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props?.children, type),
  ];
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
function dialog(
  score,
  { stage = "cv_screening", state = "draft", status = "completed" } = {},
) {
  const hooks = [],
    calls = [],
    moved = [];
  let cursor = 0,
    effectRan = false;
  const candidate = {
    id: "candidate-1",
    name: "Ada",
    pipeline_stage: stage,
    pipeline_revision: 3,
    pipeline_outcome: "active",
    ai_score: score,
    ai_evaluation: { status },
  };
  const context = {
    candidate,
    records:
      stage === "cv_screening"
        ? []
        : [{ stage, state, results: { passed: true } }],
  };
  const { load } = actionLoader(undefined, {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = initial;
        return [
          hooks[i],
          (value) => {
            hooks[i] = typeof value === "function" ? value(hooks[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = { current: initial };
        return hooks[i];
      },
      useEffect(callback) {
        if (!effectRan) {
          effectRan = true;
          callback();
        }
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" },
    "lucide-react": named("Loader2"),
    "@/components/ui/button": named("Button"),
    "@/components/ui/label": named("Label"),
    "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/dialog": named(
      "Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle",
    ),
    "@/lib/api/recruitment-pipeline": {
      getRecruitmentPipeline: async () => context,
      decideRecruitmentStage: async (...args) => {
        calls.push(args);
        return {
          success: true,
          data: {
            ...context,
            candidate: { ...candidate, pipeline_stage: "call_screening" },
          },
        };
      },
    },
  });
  const Component = load(
    "app/(admin)/hr/recruitment/[id]/components/applicant-advance-dialog.tsx",
  ).ApplicantAdvanceDialog;
  return {
    calls,
    moved,
    render() {
      cursor = 0;
      return Component({
        candidate,
        roleId: "role-1",
        onClose() {},
        onContinue() {},
        onMoved: (value) => moved.push(value),
      });
    },
  };
}

test("CV at 50 advances with optional comments and the current revision", async () => {
  const control = dialog(50);
  control.render();
  await tick();
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(control.calls.length, 1);
  assert.deepEqual(control.calls[0], [
    "candidate-1",
    "role-1",
    {
      revision: 3,
      stage: "cv_screening",
      action: "advance",
      complete_cv: true,
      manual_cv: false,
      reason: undefined,
    },
  ]);
  assert.equal(control.moved.length, 1);
});

test("CV below 50 requires a meaningful HR note before advancing", async () => {
  const control = dialog(49);
  control.render();
  await tick();
  let tree = control.render();
  assert.equal(nodes(tree, "Textarea")[0].props.required, true);
  await nodes(tree, "form")[0].props.onSubmit({ preventDefault() {} });
  assert.equal(control.calls.length, 0);
  nodes(tree, "Textarea")[0].props.onChange({
    target: { value: "Relevant experience confirmed in supporting records." },
  });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(
    control.calls[0][2].reason,
    "Relevant experience confirmed in supporting records.",
  );
});

test("unscored CVs require an HR note, including a hidden fallback score", async () => {
  for (const [score, status] of [
    [null, "completed"],
    [75, "failed"],
    [75, "pending"],
  ]) {
    const control = dialog(score, { status });
    control.render();
    await tick();
    await nodes(control.render(), "form")[0].props.onSubmit({
      preventDefault() {},
    });
    assert.equal(control.calls.length, 0);
  }
});

test("HR can progress an unscored CV with an explicit manual-review note", async () => {
  const control = dialog(null, { status: "failed" });
  control.render();
  await tick();
  nodes(control.render(), "Textarea")[0].props.onChange({
    target: {
      value: "Reviewed original CV; relevant accounts experience confirmed.",
    },
  });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(control.calls[0][2].manual_cv, true);
  assert.match(control.calls[0][2].reason, /Reviewed original CV/);
});

test("other stages require completed assessments and do not use CV completion shortcut", async () => {
  const draft = dialog(75, { stage: "oral_interview" });
  draft.render();
  await tick();
  await nodes(draft.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(draft.calls.length, 0);
  assert.ok(
    nodes(draft.render(), "Button").some(
      (node) =>
        Array.isArray(node.props.children) &&
        node.props.children.join("") === "Continue oral interview",
    ),
  );
  const completed = dialog(75, { stage: "oral_interview", state: "completed" });
  completed.render();
  await tick();
  await nodes(completed.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(completed.calls[0][2].complete_cv, false);
});

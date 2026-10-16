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
const savedWindow = globalThis.window;
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  confirm: () => true,
};
test.after(() => {
  if (savedWindow) globalThis.window = savedWindow;
  else delete globalThis.window;
});
function fixture(stage = "oral_interview") {
  const definition = {
    oral_questions: [
      { id: "q1", text: "Describe a sound decision.", follow_ups: [] },
      { id: "q2", text: "Explain the evidence.", follow_ups: [] },
    ],
    written_questions: [],
    computer_criteria: [],
    practical_modules: [],
    statuses: { [stage]: ["Not started"] },
  };
  return {
    candidate: {
      id: "candidate-1",
      name: "Ada",
      pipeline_stage: stage,
      pipeline_outcome: "active",
      pipeline_revision: 7,
    },
    role: {
      id: "role-1",
      title: "Accounts officer",
      pipeline_config: definition,
    },
    definition,
    records: [],
    events: [],
  };
}
function harness(path, component, props, api = {}) {
  const slots = [],
    pending = [];
  let cursor = 0;
  const same = (a, b) =>
    a &&
    b &&
    a.length === b.length &&
    a.every((item, i) => Object.is(item, b[i]));
  const { load } = actionLoader(undefined, {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = { current: initial };
        return slots[i];
      },
      useCallback(callback, deps) {
        const i = cursor++;
        if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: callback };
        return slots[i].value;
      },
      useEffect(callback, deps) {
        const i = cursor++;
        if (!same(slots[i]?.deps, deps)) {
          const previous = slots[i];
          slots[i] = { deps, cleanup: previous?.cleanup };
          pending.push(() => {
            previous?.cleanup?.();
            slots[i].cleanup = callback();
          });
        }
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": named("Loader2"),
    "@/components/ui/button": named("Button"),
    "@/components/ui/input": named("Input"),
    "@/components/ui/label": named("Label"),
    "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/radio-group": named("RadioGroup RadioGroupItem"),
    "@/components/ui/select": named(
      "Select SelectContent SelectItem SelectTrigger SelectValue",
    ),
    "@/components/ui/accordion": named(
      "Accordion AccordionContent AccordionItem AccordionTrigger",
    ),
    "@/components/ui/sheet": named(
      "Sheet SheetContent SheetDescription SheetHeader SheetTitle",
    ),
    "@/components/ui/dialog": named(
      "Dialog DialogContent DialogDescription DialogHeader DialogTitle",
    ),
    "../../components/pipeline-disclosure": named("PipelineDisclosure"),
    "./applicant-stage-form": named("ApplicantStageForm"),
    "@/lib/api/recruitment-pipeline": api,
  });
  const Component = load(path)[component];
  return {
    render() {
      cursor = 0;
      const tree = Component(props);
      while (pending.length) pending.shift()();
      return tree;
    },
    dispose() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}
function form(save, context = fixture(), extra = {}) {
  let guard;
  const calls = [],
    updates = [],
    completed = [];
  const control = harness(
    "app/(admin)/hr/recruitment/[id]/components/applicant-stage-form.tsx",
    "ApplicantStageForm",
    {
      initial: context,
      onUpdate: (value) => updates.push(value),
      onComplete: (value) => completed.push(value),
      onDiscard() {},
      registerClose: (callback) => {
        guard = callback;
        return () => {
          guard = undefined;
        };
      },
      ...extra,
    },
    {
      saveRecruitmentStage: async (...args) => {
        calls.push(args[2]);
        return save(args[2]);
      },
    },
  );
  return {
    ...control,
    calls,
    updates,
    completed,
    close: () => guard(),
    success: (input) => ({
      success: true,
      data: {
        ...context,
        candidate: {
          ...context.candidate,
          pipeline_revision: input.revision + 1,
        },
        records: [
          {
            stage: input.stage,
            state: input.complete ? "completed" : "draft",
            payload: input.payload,
            definition: context.definition,
            results: {
              score_100: null,
              threshold: 60,
              missing: [],
              checks: [],
              passed: null,
            },
          },
        ],
      },
    }),
  };
}

test("closing an oral sheet drains autosave, including edits made while a request is running", async (t) => {
  let release;
  let control;
  control = form((input) =>
    control.calls.length === 1
      ? new Promise((resolve) => {
          release = () => resolve(control.success(input));
        })
      : Promise.resolve(control.success(input)),
  );
  t.after(() => control.dispose());
  let tree = control.render();
  nodes(tree, "RadioGroup")[0].props.onValueChange("4");
  control.render();
  const closing = control.close();
  tree = control.render();
  nodes(tree, "RadioGroup")[1].props.onValueChange("5");
  release();
  assert.equal(await closing, true);
  assert.deepEqual(
    control.calls.map((input) => input.revision),
    [7, 8],
  );
  assert.deepEqual(control.calls[1].payload.grades, { q1: 4, q2: 5 });
  assert.equal(control.completed.length, 0);
});

test("a failed save prevents dismissal and retains the score for retry", async (t) => {
  let control;
  control = form(async (input) =>
    control.calls.length === 1
      ? {
          success: false,
          error: "Connection unavailable",
          errorCode: "NETWORK_ERROR",
        }
      : control.success(input),
  );
  t.after(() => control.dispose());
  nodes(control.render(), "RadioGroup")[0].props.onValueChange("3");
  control.render();
  assert.equal(await control.close(), false);
  const tree = control.render();
  assert.equal(nodes(tree, "RadioGroup")[0].props.value, "3");
  nodes(tree, "Button")
    .find((node) => node.props.children === "Retry save")
    .props.onClick();
  await tick();
  assert.equal(await control.close(), true);
  assert.deepEqual(control.calls[1].payload.grades, { q1: 3 });
});

test("completion saves the current draft first and then closes through the completion callback", async (t) => {
  let control;
  control = form(async (input) => control.success(input));
  t.after(() => control.dispose());
  const tree = control.render();
  nodes(tree, "RadioGroup")[0].props.onValueChange("5");
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.deepEqual(
    control.calls.map((input) => [input.revision, input.complete]),
    [
      [7, false],
      [8, true],
    ],
  );
  assert.equal(control.completed.length, 1);
  assert.equal(control.calls[1].advance, false);
  assert.ok(
    nodes(control.render(), "Button").some(
      (node) => node.props.children === "Complete oral interview",
    ),
  );
});

test("below-standard forms capture and retain the HR note used when moving forward", async (t) => {
  const context = fixture("call_screening");
  context.records = [
    {
      stage: "call_screening",
      state: "draft",
      definition: context.definition,
      payload: { custom_status: "Not started" },
      results: {
        score_100: null,
        threshold: null,
        missing: [],
        checks: [],
        passed: false,
      },
    },
  ];
  let control;
  control = form(async (input) => control.success(input), context);
  t.after(() => control.dispose());
  let tree = control.render();
  const note = nodes(tree, "Textarea").find(
    (node) => node.props.id === "advancement-note",
  );
  assert.equal(note.props.required, true);
  note.props.onChange({
    target: { value: "HR verified additional relevant evidence." },
  });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(
    control.calls.at(-1).payload.advancement_note,
    "HR verified additional relevant evidence.",
  );
  assert.equal(control.calls.at(-1).advance, true);
});

test("previous stage assessments are read only", (t) => {
  const context = fixture("written_exam");
  context.records = [
    {
      stage: "oral_interview",
      state: "completed",
      payload: { grades: { q1: 4 } },
      definition: context.definition,
      results: {
        score_100: 80,
        threshold: 60,
        missing: [],
        checks: [],
        passed: true,
      },
    },
  ];
  const control = form(
    async () => {
      throw Error("Read-only");
    },
    context,
    { viewStage: "oral_interview" },
  );
  t.after(() => control.dispose());
  const tree = control.render();
  assert.equal(nodes(tree, "RadioGroup")[0].props.disabled, true);
  assert.ok(
    !nodes(tree, "Button").some((node) => node.props.type === "submit"),
  );
});

test("oral opens a sheet; call, written, practical and management open form dialogs", async (t) => {
  for (const stage of [
    "oral_interview",
    "call_screening",
    "written_exam",
    "practical",
    "management_review",
  ]) {
    const context = fixture(stage);
    let closed = 0;
    const control = harness(
      "app/(admin)/hr/recruitment/[id]/components/applicant-stage-workspace.tsx",
      "ApplicantStageWorkspace",
      {
        candidate: context.candidate,
        roleId: "role-1",
        onClose: () => closed++,
        onUpdate() {},
        onComplete() {},
        onCv() {},
      },
      { getRecruitmentPipeline: async () => context },
    );
    t.after(() => control.dispose());
    control.render();
    await tick();
    let tree = control.render();
    assert.equal(tree.type, stage === "oral_interview" ? "Sheet" : "Dialog");
    const child = nodes(tree, "ApplicantStageForm")[0];
    child.props.registerClose(async () => false);
    tree.props.onOpenChange(false);
    await tick();
    assert.equal(closed, 0);
    child.props.registerClose(async () => true);
    tree.props.onOpenChange(false);
    await tick();
    assert.equal(closed, 1);
  }
});

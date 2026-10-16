import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = (names) =>
  Object.fromEntries(names.split(" ").map((n) => [n, n]));
const nodes = (t, type) =>
  Array.isArray(t)
    ? t.flatMap((c) => nodes(c, type))
    : !t || typeof t !== "object"
      ? []
      : [...(t.type === type ? [t] : []), ...nodes(t.props?.children, type)];
const text = (t) =>
  Array.isArray(t)
    ? t.map(text).join("")
    : typeof t === "string" || typeof t === "number"
      ? String(t)
      : t && typeof t === "object"
        ? text(t.props?.children)
        : "";
const tick = () => new Promise((r) => setImmediate(r));
function fixture() {
  const definition = {
    oral_questions: [{ id: "q1", text: "Explain a reconciliation." }],
    written_questions: [],
    computer_criteria: [],
    practical_modules: [],
  };
  return {
    review: {
      id: "review-1",
      version: 1,
      created_at: "2026-10-15",
      submitted_by: { name: "HR" },
      snapshot: {
        candidate: {
          id: "candidate-1",
          name: "Ada",
          ai_score: 75,
          ai_summary: "Relevant experience.",
        },
        role: {
          id: "role-1",
          title: "Accounts officer",
          salary_budget_min: 100000,
          salary_budget_max: 200000,
        },
        final_score: 80,
        records: [
          {
            stage: "oral_interview",
            state: "completed",
            definition,
            payload: { grades: { q1: 4 }, notes: "Clear source checks." },
            results: { score_100: 80, threshold: 60, passed: true, checks: [] },
            updated_by: { name: "HR" },
            updated_at: "2026-10-15",
          },
          {
            stage: "practical",
            state: "skipped",
            definition,
            payload: {},
            results: null,
            updated_by: { name: "HR" },
            updated_at: "2026-10-15",
          },
          {
            stage: "management_review",
            state: "completed",
            payload: {
              recommendation: "Recommend for offer preparation.",
              strengths: "Accurate checks.",
              concerns: "Month-end support.",
              notes: "Clear interview examples.",
            },
          },
        ],
        events: [],
      },
    },
    updated_since_submission: false,
    is_latest: true,
    can_decide: true,
    outcome: "active",
    decision: null,
    history: [],
  };
}
function harness(
  data = fixture(),
  save = async () => ({
    success: true,
    data: {
      ...data,
      can_decide: false,
      decision: {
        decision: "approve",
        actor: { name: "MP" },
        created_at: "2026-10-15",
      },
    },
  }),
) {
  const hooks = [],
    effects = [],
    calls = [];
  let cursor = 0;
  const overrides = {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in hooks))
          hooks[i] = typeof initial === "function" ? initial() : initial;
        return [
          hooks[i],
          (v) => {
            hooks[i] = typeof v === "function" ? v(hooks[i]) : v;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = { current: initial };
        return hooks[i];
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (!hooks[i] || deps.some((v, j) => v !== hooks[i][j]))
          effects.push(fn);
        hooks[i] = deps;
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    sonner: { toast: { success() {} } },
    "@/lib/api/recruitment-pipeline": {
      getManagementReview: async () => data,
      decideManagementReview: async (...args) => {
        calls.push(args);
        return save(...args);
      },
    },
  };
  for (const [file, names] of Object.entries({
    button: "Button",
    label: "Label",
    textarea: "Textarea",
    input: "Input",
    sheet: "Sheet SheetContent SheetHeader SheetTitle SheetDescription",
    tabs: "Tabs TabsList TabsTrigger TabsContent",
    select: "Select SelectContent SelectItem SelectTrigger SelectValue",
    accordion: "Accordion AccordionItem AccordionTrigger AccordionContent",
    table: "Table TableBody TableRow TableCell TableHead TableHeader",
  }))
    overrides[`@/components/ui/${file}`] = named(names);
  const exports = actionLoader(undefined, overrides).load(
    "app/(admin)/hr/recruitment/[id]/components/management-review-sheet.tsx",
  );
  return {
    calls,
    exports,
    render() {
      cursor = 0;
      effects.length = 0;
      const tree = exports.ManagementReviewSheet({
        candidateId: "candidate-1",
        roleId: "role-1",
        onClose() {},
        onSaved() {},
      });
      effects.splice(0).forEach((fn) => fn());
      return tree;
    },
  };
}
test("submitted brief exposes HR evidence, skipped-stage warnings and four clear review tabs", () => {
  const h = harness(),
    tree = h.exports.ManagementReviewContent({ data: fixture() });
  assert.deepEqual(nodes(tree, "TabsTrigger").map(text), [
    "Summary",
    "Assessments",
    "CV",
    "History",
  ]);
  assert.match(text(tree), /Accurate checks/);
  assert.match(text(tree), /Month-end support/);
  assert.match(text(tree), /skipped by exception/);
  assert.match(text(tree), /Written: answers 60%/);
});
test("HR and outdated submissions have no management decision form", async () => {
  for (const data of [
    { ...fixture(), can_decide: false },
    { ...fixture(), can_decide: false, updated_since_submission: true },
  ]) {
    const h = harness(data);
    h.render();
    await tick();
    const tree = h.render();
    assert.equal(nodes(tree, "form").length, 0);
    if (data.updated_since_submission)
      assert.match(text(tree), /Updated since submission/);
  }
});
test("management decision sends submitted review id, blocks duplicate clicks and preserves marks", async () => {
  let finish;
  const h = harness(fixture(), () => new Promise((r) => (finish = r)));
  h.render();
  await tick();
  nodes(h.render(), "Select")[0].props.onValueChange("approve");
  const form = nodes(h.render(), "form")[0];
  const first = form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][2].review_id, "review-1");
  assert.equal(h.calls[0][2].decision, "approve");
  assert.equal(h.calls[0][2].grades, undefined);
  finish({
    success: true,
    data: {
      ...fixture(),
      can_decide: false,
      decision: {
        decision: "approve",
        actor: { name: "MP" },
        created_at: "2026-10-15",
      },
    },
  });
  await first;
  assert.match(text(h.render()), /Approved for offer preparation/);
  assert.equal(nodes(h.render(), "form").length, 0);
});
test("hold requires a follow-up date; unsuccessful decisions retain comments", async () => {
  const h = harness(fixture(), async () => ({
    success: false,
    error: "Please retry.",
  }));
  h.render();
  await tick();
  nodes(h.render(), "Select")[0].props.onValueChange("hold");
  const tree = h.render();
  assert.equal(nodes(tree, "Input")[0].props.required, true);
  assert.equal(nodes(tree, "Textarea")[0].props.required, true);
  nodes(tree, "Textarea")[0].props.onChange({
    target: { value: "Await budget approval." },
  });
  await nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  assert.equal(
    nodes(h.render(), "Textarea")[0].props.value,
    "Await budget approval.",
  );
  assert.match(text(h.render()), /Please retry/);
});
test("historical submissions offer access to the actual submitted version", () => {
  const data = fixture();
  data.history = [
    {
      id: "old",
      version: 1,
      submitted_by: { name: "HR" },
      created_at: "2026-10-14",
    },
  ];
  data.review.version = 2;
  let selected;
  const h = harness();
  const tree = h.exports.ManagementReviewContent({
    data,
    onVersion: (v) => (selected = v),
  });
  nodes(tree, "Button")
    .find((n) => text(n).includes("View submitted version"))
    .props.onClick();
  assert.equal(selected, 1);
});

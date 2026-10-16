import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const bank = {
  version: "test",
  competencies: {
    reasoning: "Reasoning",
    initiative: "Initiative",
    identification: "Problem identification",
    solution: "Solution quality",
  },
  tracks: ["it", "visa"].map((id) => ({
    id,
    name: id,
    recommended: {
      general: ["general-1"],
      talent: ["t1", "t2", "t3", "t4"],
      role: [`${id}-1`],
    },
  })),
  questions: [
    ...[1, 2, 3, 4, 5, 6].map((n) => ({
      id: `general-${n}`,
      section: "general",
      scored: true,
      track: null,
      competency: "solution",
    })),
    ...["reasoning", "initiative", "identification", "solution"].map(
      (competency, i) => ({
        id: `t${i + 1}`,
        section: "talent",
        scored: true,
        track: null,
        competency,
      }),
    ),
    ...["it", "visa"].flatMap((track) => [
      {
        id: `${track}-1`,
        section: "role",
        scored: true,
        track,
        competency: "solution",
      },
      {
        id: `${track}-practical-1`,
        section: "practical",
        scored: true,
        track,
        competency: "solution",
      },
    ]),
  ],
};
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
const flush = () => new Promise((resolve) => setImmediate(resolve));
function creation(
  create,
  getBank = async () => ({ success: true, data: bank }),
) {
  const state = [],
    navigation = [];
  let cursor = 0;
  const { load } = actionLoader(undefined, {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in state))
          state[i] = typeof initial === "function" ? initial() : initial;
        return [
          state[i],
          (value) => {
            state[i] = typeof value === "function" ? value(state[i]) : value;
          },
        ];
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": {
      useRouter: () => ({ push: (path) => navigation.push(path) }),
    },
    "lucide-react": named("ArrowLeft ArrowRight Check Loader2 Plus"),
    "@/components/ui/button": named("Button"),
    "@/components/ui/dialog": named(
      "Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle DialogTrigger",
    ),
    "@/components/ui/input": named("Input"),
    "@/components/ui/label": named("Label"),
    "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/select": named(
      "Select SelectContent SelectItem SelectTrigger SelectValue",
    ),
    "@/lib/utils/role-department": { PLATFORM_DEPARTMENTS: ["IT", "Visa"] },
    "@/lib/utils": { cn: (...parts) => parts.filter(Boolean).join(" ") },
    "./criteria-pills-input": named("CriteriaPillsInput"),
    "./pipeline-settings-fields": {
      ...named("DepartmentAssessmentSelect PipelineSettingsFields"),
      defaultPipelineSettings: (track = "") => ({
        track,
        custom_questions: [],
        thresholds: { oral_interview: 60, written_exam: 60, practical: 70 },
      }),
    },
    "@/lib/api/applicant-assessment": { getAssessmentBank: getBank },
    "@/lib/api/recruitment": { createRecruitmentRole: create },
    sonner: { toast: { success() {} } },
  });
  const Component = load(
    "app/(admin)/hr/recruitment/components/create-role-dialog.tsx",
  ).CreateRoleDialog;
  const render = () => {
    cursor = 0;
    return Component({});
  };
  return { render, navigation };
}
async function fillRole(control) {
  control.render().props.onOpenChange(true);
  nodes(control.render(), "Input")[0].props.onChange({
    target: { value: "IT Officer" },
  });
  nodes(control.render(), "DepartmentAssessmentSelect")[0].props.onChange("it");
  nodes(control.render(), "Input")[2].props.onChange({
    target: { value: "100000" },
  });
  nodes(control.render(), "Input")[3].props.onChange({
    target: { value: "200000" },
  });
}

test("creation sends fixed workflow settings and salary budget in one request", async () => {
  const calls = [];
  const control = creation(async (payload) => {
    calls.push(payload);
    return { success: true, data: { id: "new-role" } };
  });
  await fillRole(control);
  assert.equal(nodes(control.render(), "AssessmentQuestionPicker").length, 0);
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].pipeline_settings.track, "it");
  assert.equal(calls[0].department, "IT");
  assert.equal(nodes(control.render(), "DepartmentAssessmentSelect").length, 1);
  assert.equal(
    nodes(control.render(), "PipelineSettingsFields")[0].props.showDepartment,
    false,
  );
  assert.deepEqual(calls[0].pipeline_settings.thresholds, {
    oral_interview: 60,
    written_exam: 60,
    practical: 70,
  });
  assert.equal(calls[0].salary_budget_min, 100000);
  assert.equal(calls[0].salary_budget_max, 200000);
  assert.equal(calls[0].assessment, undefined);
  assert.deepEqual(control.navigation, ["/hr/recruitment/new-role"]);
});

test("failed creation retains vacancy and fixed assessment settings", async () => {
  const control = creation(async () => ({
    success: false,
    error: "Save failed",
  }));
  await fillRole(control);
  const settings = nodes(control.render(), "PipelineSettingsFields")[0].props
    .value;
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(nodes(control.render(), "Input")[0].props.value, "IT Officer");
  assert.deepEqual(
    nodes(control.render(), "PipelineSettingsFields")[0].props.value,
    settings,
  );
  assert.equal(
    nodes(control.render(), "p").find((node) => node.props.role === "alert")
      .props.children,
    "Save failed",
  );
  assert.deepEqual(control.navigation, []);
});

test("salary budget and incomplete custom questions block creation", async () => {
  let calls = 0;
  const control = creation(async () => {
    calls++;
    return { success: true, data: { id: "new" } };
  });
  await fillRole(control);
  nodes(control.render(), "Input")[3].props.onChange({
    target: { value: "50000" },
  });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls, 0);
  nodes(control.render(), "Input")[3].props.onChange({
    target: { value: "200000" },
  });
  const fields = nodes(control.render(), "PipelineSettingsFields")[0];
  fields.props.onChange({ ...fields.props.value, custom_questions: [""] });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls, 0);
});

test("configuration always includes every general question and maps platform departments", () => {
  const { load } = actionLoader();
  const helpers = load("lib/recruitment/assessment-configuration.ts");
  assert.equal(helpers.suggestedAssessmentTrack("IT Department"), "it");
  assert.equal(helpers.suggestedAssessmentTrack("Social Media"), "sales");
  assert.equal(helpers.suggestedAssessmentTrack("Holidays"), "");
  const config = helpers.defaultAssessmentConfiguration(bank, "it");
  assert.equal(
    config.question_ids.filter((id) => id.startsWith("general-")).length,
    6,
  );
  assert.deepEqual(helpers.assessmentConfigurationIssues(bank, config), []);
  const changed = {
    ...config,
    question_ids: config.question_ids.filter((id) => id !== "general-2"),
  };
  assert.ok(
    helpers
      .assessmentConfigurationIssues(bank, changed)
      .includes("All general questions are required."),
  );
});

test("custom questions persist through configuration reload and invalid entries block submission", () => {
  const { load } = actionLoader();
  const helpers = load("lib/recruitment/assessment-configuration.ts");
  const custom = {
    id: "custom-one",
    text: "How would you recover a failed deployment?",
    competency: "solution",
  };
  const config = {
    ...helpers.defaultAssessmentConfiguration(bank, "it"),
    custom_questions: [custom],
  };
  assert.deepEqual(helpers.assessmentConfigurationIssues(bank, config), []);
  assert.ok(
    helpers.assessmentConfigurationIssues(bank, {
      ...config,
      custom_questions: [{ ...custom, text: " " }],
    }).length,
  );
  const restored = helpers.configurationFromDefinition(
    {
      track: { id: "it" },
      weights: { practical: 10 },
      questions: [
        ...bank.questions.filter((q) => config.question_ids.includes(q.id)),
        { ...custom, custom: true, section: "role", scored: true },
      ],
    },
    bank,
    false,
  );
  assert.deepEqual(restored.custom_questions, [custom]);
  assert.ok(!restored.question_ids.includes(custom.id));
  assert.deepEqual(helpers.assessmentConfigurationIssues(bank, restored), []);
});
test("custom oral questions are sent with the new vacancy transaction", async () => {
  const calls = [];
  const control = creation(async (input) => {
    calls.push(input);
    return { success: false, error: "Retain form" };
  });
  await fillRole(control);
  const fields = nodes(control.render(), "PipelineSettingsFields")[0];
  fields.props.onChange({
    ...fields.props.value,
    custom_questions: ["Explain a deployment rollback."],
  });
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].pipeline_settings.custom_questions, [
    "Explain a deployment rollback.",
  ]);
  assert.deepEqual(control.navigation, []);
});

test("changing department assessment keeps custom questions and pass marks, and saves the matching department", async () => {
  const calls = [];
  const control = creation(async (input) => {
    calls.push(input);
    return { success: false, error: "Retain form" };
  });
  await fillRole(control);
  const fields = nodes(control.render(), "PipelineSettingsFields")[0];
  fields.props.onChange({
    ...fields.props.value,
    custom_questions: ["How would you check a payment?"],
    thresholds: { oral_interview: 65, written_exam: 70, practical: 75 },
  });
  nodes(control.render(), "DepartmentAssessmentSelect")[0].props.onChange(
    "accounts",
  );
  await nodes(control.render(), "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls[0].department, "Accounts");
  assert.equal(calls[0].pipeline_settings.track, "accounts");
  assert.deepEqual(calls[0].pipeline_settings.custom_questions, [
    "How would you check a payment?",
  ]);
  assert.deepEqual(calls[0].pipeline_settings.thresholds, {
    oral_interview: 65,
    written_exam: 70,
    practical: 75,
  });
});

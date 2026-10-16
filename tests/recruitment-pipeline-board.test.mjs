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
const applicant = {
  id: "applicant-1",
  name: "Ada",
  email: "ada@example.com",
  pipeline_stage: "cv_screening",
  pipeline_outcome: "active",
  pipeline_revision: 4,
  ai_score: 85,
  ai_evaluation: { status: "failed" },
};

function board(reanalyse, initialProps = {}) {
  const hooks = [],
    calls = [],
    messages = [],
    refreshes = [];
  let cursor = 0,
    candidates = [applicant];
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
      useEffect() {},
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" },
    "next/navigation": {
      useRouter: () => ({ refresh: () => refreshes.push(true) }),
    },
    "lucide-react": named("ArrowRight Loader2 MoreHorizontal RotateCw"),
    sonner: {
      toast: {
        success: (value) => messages.push(["success", value]),
        error: (value) => messages.push(["error", value]),
      },
    },
    "@/components/ui/button": named("Button"),
    "@/components/ui/input": named("Input"),
    "@/components/ui/label": named("Label"),
    "@/components/ui/textarea": named("Textarea"),
    "@/components/ui/dialog": named(
      "Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle",
    ),
    "@/components/stats-card": named("StatsCard"),
    "@/components/ui/badge": named("Badge"),
    "@/components/ui/select": named(
      "Select SelectContent SelectItem SelectTrigger SelectValue",
    ),
    "@/components/ui/table": named(
      "Table TableBody TableCell TableHead TableHeader TableRow",
    ),
    "@/components/ui/tabs": named("Tabs TabsContent TabsList TabsTrigger"),
    "@/components/ui/dropdown-menu": named(
      "DropdownMenu DropdownMenuContent DropdownMenuItem DropdownMenuTrigger DropdownMenuSeparator",
    ),
    "./upload-cv-dialog": named("UploadCvDialog"),
    "./cv-analysis-sheet": named("CvAnalysisSheet"),
    "./applicant-advance-dialog": named("ApplicantAdvanceDialog"),
    "./applicant-stage-workspace": named("ApplicantStageWorkspace"),
    "./applicant-status-dialog": named("ApplicantStatusDialog"),
    "./vacancy-settings-dialog": named("VacancySettingsDialog"),
    "./management-review-sheet": named("ManagementReviewSheet"),
    "./prepare-offer-dialog": named("PrepareOfferDialog"),
    "@/lib/api/recruitment": {
      reanalyzeCandidate: async (...args) => {
        calls.push(args);
        return reanalyse(...args);
      },
    },
  });
  const Component = load(
    "app/(admin)/hr/recruitment/[id]/components/recruitment-pipeline-board.tsx",
  ).RecruitmentPipelineBoard;
  return {
    calls,
    messages,
    refreshes,
    render(next) {
      if (next) candidates = next;
      cursor = 0;
      return Component({
        role: {
          id: "role-1",
          title: "Accounts officer",
          department: "Accounts",
          status: "active",
          openings_count: 1,
        },
        candidates,
        ...initialProps,
      });
    },
  };
}
const retry = (control) =>
  nodes(control.render(), "Button").find(
    (node) => node.props["aria-label"] === "Retry AI analysis for Ada",
  );

test("table retry queues AI once, hides failed scores and shows pending without changing the stage", async () => {
  let finish;
  const control = board(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const button = retry(control);
  assert.ok(button);
  button.props.onClick();
  button.props.onClick();
  assert.deepEqual(control.calls, [["applicant-1", "role-1"]]);
  assert.equal(retry(control), undefined);
  finish({
    success: true,
    data: {
      ...applicant,
      ai_score: null,
      ai_evaluation: { status: "pending" },
    },
  });
  await tick();
  const table = nodes(control.render(), "Table")[0];
  assert.ok(JSON.stringify(table).includes("Analysis pending"));
  assert.ok(!JSON.stringify(table).includes("85%"));
  assert.equal(control.refreshes.length, 1);
  assert.equal(control.messages[0][0], "success");
  const action = nodes(table, "DropdownMenuItem").find(
    (node) => node.props.disabled,
  );
  assert.equal(action.props.disabled, true);
  // New server data takes precedence over an earlier optimistic response.
  control.render([{ ...applicant }]);
  assert.ok(retry(control));
});

test("failed retry leaves an immediate recovery action and reports the error", async () => {
  const control = board(async () => ({
    success: false,
    error: "Queue unavailable",
  }));
  retry(control).props.onClick();
  await tick();
  assert.ok(retry(control));
  assert.deepEqual(control.messages, [["error", "Queue unavailable"]]);
  assert.equal(control.refreshes.length, 0);
});

test("pending analysis cannot queue another job from the actions menu", async () => {
  const control = board(async () => {
    throw Error("Should not run");
  });
  const tree = control.render([
    { ...applicant, ai_evaluation: { status: "processing" }, ai_score: null },
  ]);
  const action = nodes(tree, "DropdownMenuItem").find((node) =>
    JSON.stringify(node.props.children).includes("AI analysis pending"),
  );
  assert.equal(action.props.disabled, true);
  action.props.onSelect();
  await tick();
  assert.equal(control.calls.length, 0);
});

test("all applicants are shown by default and stage/status filters work together", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    applicant,
    {
      ...applicant,
      id: "oral-1",
      name: "Grace",
      pipeline_stage: "oral_interview",
    },
    {
      ...applicant,
      id: "held-1",
      name: "Musa",
      pipeline_stage: "oral_interview",
      pipeline_outcome: "hold",
    },
  ]);
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 3);
  const selects = nodes(tree, "Select");
  assert.deepEqual(
    selects.map((node) => node.props.value),
    ["all", "all"],
  );
  selects[0].props.onValueChange("oral_interview");
  tree = control.render();
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 2);
  nodes(tree, "Select")[1].props.onValueChange("hold");
  tree = control.render();
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 1);
  assert.ok(JSON.stringify(nodes(tree, "TableBody")[0]).includes("Musa"));
  nodes(tree, "Button")
    .find((node) => node.props.children === "Clear filters")
    .props.onClick();
  assert.equal(
    nodes(control.render(), "TableBody")[0].props.children[0].length,
    3,
  );
});

test("applicant name opens CV sheet and move action opens a compact stage dialog", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    { ...applicant, ai_score: 50, ai_evaluation: { status: "completed" } },
  ]);
  nodes(tree, "Button")
    .find((node) => node.props["aria-label"] === "View CV analysis for Ada")
    .props.onClick();
  tree = control.render();
  assert.equal(
    nodes(tree, "CvAnalysisSheet")[0].props.candidate.id,
    applicant.id,
  );
  nodes(tree, "Button")
    .find(
      (node) => node.props["aria-label"] === "Move to call screening for Ada",
    )
    .props.onClick();
  tree = control.render();
  assert.equal(
    nodes(tree, "ApplicantAdvanceDialog")[0].props.candidate.id,
    applicant.id,
  );
  assert.equal(
    nodes(tree, "Link").filter(
      (node) =>
        node.props.href === "/hr/recruitment/role-1/candidates/applicant-1",
    ).length,
    0,
  );
});

test("visible row button starts or continues the current form and advances completed stages into the next form", () => {
  for (const [summary, label] of [
    [{ state: "draft", status: null }, "Start oral interview"],
    [{ state: "draft", status: "Not started" }, "Continue oral interview"],
    [{ state: "completed", status: "Completed" }, "Move to written exam"],
  ]) {
    const control = board(async () => ({ success: false }));
    let tree = control.render([
      {
        ...applicant,
        pipeline_stage: "oral_interview",
        ai_score: 75,
        ai_evaluation: { status: "completed" },
        pipeline_summary: summary,
      },
    ]);
    nodes(tree, "Button")
      .find((node) => node.props["aria-label"] === `${label} for Ada`)
      .props.onClick();
    tree = control.render();
    if (summary.state === "completed") {
      const dialog = nodes(tree, "ApplicantAdvanceDialog")[0];
      dialog.props.onMoved({
        candidate: {
          ...applicant,
          pipeline_stage: "written_exam",
          pipeline_revision: 5,
        },
        records: [],
        final_score: null,
      });
      tree = control.render();
      assert.equal(nodes(tree, "ApplicantAdvanceDialog").length, 0);
      assert.equal(
        nodes(tree, "ApplicantStageWorkspace")[0].props.candidate
          .pipeline_stage,
        "written_exam",
      );
    } else
      assert.equal(
        nodes(tree, "ApplicantStageWorkspace")[0].props.candidate
          .pipeline_stage,
        "oral_interview",
      );
  }
});

test("analysis recovery is explicit and held applicants cannot advance", () => {
  for (const status of ["failed", "pending", "processing"]) {
    const control = board(async () => ({ success: false }));
    const tree = control.render([{ ...applicant, ai_evaluation: { status } }]);
    const action = nodes(tree, "Button").find(
      (node) => node.props["aria-label"] === "Review CV manually for Ada",
    );
    assert.ok(action);
    assert.notEqual(action.props.disabled, true);
    action.props.onClick();
    assert.equal(nodes(control.render(), "ApplicantAdvanceDialog").length, 1);
  }
  const control = board(async () => ({ success: false }));
  let tree = control.render([{ ...applicant, pipeline_outcome: "hold" }]);
  nodes(tree, "Button")
    .find((node) => node.props["aria-label"] === "Resume applicant for Ada")
    .props.onClick();
  tree = control.render();
  assert.equal(nodes(tree, "ApplicantStatusDialog").length, 1);
  assert.equal(nodes(tree, "ApplicantAdvanceDialog").length, 0);
});

test("failed or pending CV analysis does not block work after HR advances manually", () => {
  for (const status of ["failed", "pending", "processing"]) {
    const control = board(async () => ({ success: false }));
    const tree = control.render([
      {
        ...applicant,
        pipeline_stage: "call_screening",
        ai_evaluation: { status },
        pipeline_summary: { state: "draft", started: false },
      },
    ]);
    const action = nodes(tree, "Button").find(
      (n) => n.props["aria-label"] === "Start call screening for Ada",
    );
    assert.ok(action);
    assert.notEqual(action.props.disabled, true);
    action.props.onClick();
    assert.equal(nodes(control.render(), "ApplicantStageWorkspace").length, 1);
  }
});

test("management approval gives HR a visible Prepare offer action on the applicant table", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    {
      ...applicant,
      ai_evaluation: { status: "completed" },
      pipeline_stage: "offer_preparation",
      management_review_summary: { decision: "approve" },
      status: "reviewing",
    },
  ]);
  const action = nodes(tree, "Button").find(
    (n) => n.props["aria-label"] === "Prepare offer for Ada",
  );
  assert.ok(action);
  action.props.onClick();
  tree = control.render();
  assert.equal(nodes(tree, "PrepareOfferDialog").length, 1);
  assert.equal(nodes(tree, "ApplicantAdvanceDialog").length, 0);
});

test("a previous approval does not hide an assessment reopened for further work", () => {
  const control = board(async () => ({ success: false }));
  const tree = control.render([
    {
      ...applicant,
      ai_evaluation: { status: "completed" },
      pipeline_stage: "practical",
      management_review_summary: { decision: "approve" },
      pipeline_summary: { state: "draft", started: true },
      status: "reviewing",
    },
  ]);
  const action = nodes(tree, "Button").find(
    (n) => n.props["aria-label"] === "Continue practical exercise for Ada",
  );
  assert.ok(action);
  action.props.onClick();
  assert.equal(nodes(control.render(), "ApplicantStageWorkspace").length, 1);
  assert.equal(nodes(control.render(), "PrepareOfferDialog").length, 0);
});

test("status filter filters applicants by outcome such as on hold", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    { ...applicant, pipeline_outcome: "hold" },
    {
      ...applicant,
      id: "next",
      name: "Grace",
      pipeline_outcome: "active",
    },
  ]);
  nodes(tree, "Select")[1].props.onValueChange("hold");
  tree = control.render();
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 1);
  assert.ok(JSON.stringify(nodes(tree, "TableBody")[0]).includes("Ada"));
});

test("stage forms, status/history and vacancy settings all open overlays without leaving the table", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    {
      ...applicant,
      pipeline_stage: "call_screening",
      ai_score: 75,
      ai_evaluation: { status: "completed" },
    },
  ]);
  nodes(tree, "DropdownMenuItem")
    .find((node) => node.props.children === "Continue call screening")
    .props.onSelect();
  tree = control.render();
  assert.equal(
    nodes(tree, "ApplicantStageWorkspace")[0].props.candidate.id,
    applicant.id,
  );
  assert.deepEqual(
    nodes(tree, "Link").map((n) => n.props.href),
    ["/hr/recruitment", "/hr/recruitment/role-1?review=1"],
  );
  nodes(tree, "DropdownMenuItem")
    .find(
      (node) =>
        (Array.isArray(node.props.children)
          ? node.props.children.join("")
          : node.props.children) === "Status & history",
    )
    .props.onSelect();
  assert.equal(nodes(control.render(), "ApplicantStatusDialog").length, 1);
  nodes(control.render(), "Button")
    .find((node) => node.props.children === "Vacancy settings")
    .props.onClick();
  assert.equal(nodes(control.render(), "VacancySettingsDialog").length, 1);
});

test("a follow-up notification opens status/history without opening a stage form", () => {
  const h = board(async () => ({}), {
    initialApplicantId: "applicant-1",
    initialStatusOpen: true,
  });
  const tree = h.render([{ ...applicant, pipeline_outcome: "hold" }]);
  assert.equal(nodes(tree, "ApplicantStatusDialog").length, 1);
  assert.equal(nodes(tree, "ApplicantStageWorkspace").length, 0);
  assert.equal(nodes(tree, "CvAnalysisSheet").length, 0);
});

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

function board(reanalyse, initialProps = {}, emailOverrides = {}) {
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
    "lucide-react": named("ArrowRight Loader2 MoreHorizontal RotateCw Mail SkipForward"),
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
    "./candidate-emails-dialog": named("CandidateEmailsDialog"),
    "./batch-pipeline-emails-dialog": named("BatchPipelineEmailsDialog"),
    "./candidate-overview-sheet": named("CandidateOverviewSheet"),
    "./stage-documents-dialog": named("StageDocumentsDialog"),
    "./vacancy-settings-dialog": named("VacancySettingsDialog"),
    "./management-review-sheet": named("ManagementReviewSheet"),
    "./prepare-offer-dialog": named("PrepareOfferDialog"),
    "@/lib/api/recruitment-email": {
      batchSkipRecruitmentEmails: async (...args) =>
        emailOverrides.batchSkip
          ? emailOverrides.batchSkip(...args)
          : { success: true, data: { skipped_ids: args[1], skipped_count: args[1].length } },
    },
    "@/lib/api/recruitment": {
      reanalyzeCandidate: async (...args) => {
        calls.push(args);
        return reanalyse(...args);
      },
      batchAnalyzeCandidates: async (roleId, ids) => {
        calls.push(["batch", roleId, ids]);
        if (emailOverrides.batchAnalyze) {
          return emailOverrides.batchAnalyze(roleId, ids);
        }
        return {
          success: true,
          data: {
            rate_limited: false,
            retry_after_seconds: null,
            results: ids.map((id) => ({
              candidate_id: id,
              status: "completed",
              reused: false,
              candidate: { ...(candidates.find((c) => c.id === id) ?? applicant), ai_score: 80, ai_evaluation: { status: "completed" } },
            })),
          },
        };
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

test("a failed CV shows its recovery reason in the table and after retry", async () => {
  const candidate = { ...applicant, ai_evaluation: { status: "failed", failure_code: "missing_api_key" } };
  const control = board(async () => ({ success: true, data: candidate }));
  const tree = control.render([candidate]);
  assert.match(JSON.stringify(nodes(tree, "Table")[0]), /AI screening is not configured/);
  retry(control).props.onClick();
  await tick();
  assert.match(control.messages[0][1], /AI screening is not configured/);
});

test("table retry runs AI once, hides failed scores and shows progress without changing the stage", async () => {
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
  assert.ok(JSON.stringify(table).includes("Analyzing CV"));
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

test("applicant name opens the complete overview and move action opens a stage dialog", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([
    { ...applicant, ai_score: 50, ai_evaluation: { status: "completed" } },
  ]);
  nodes(tree, "Button")
    .find((node) => node.props["aria-label"] === "View candidate overview for Ada")
    .props.onClick();
  tree = control.render();
  assert.equal(
    nodes(tree, "CandidateOverviewSheet")[0].props.candidate.id,
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

test("visible row button starts or continues the form and opens email review after advancing", () => {
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
      assert.equal(nodes(tree, "CandidateEmailsDialog")[0].props.candidateId, applicant.id);
      assert.equal(nodes(tree, "ApplicantStageWorkspace").length, 0);
    } else
      assert.equal(
        nodes(tree, "ApplicantStageWorkspace")[0].props.candidate
          .pipeline_stage,
        "oral_interview",
      );
  }
});

test("stage rejection preselects reject and then opens candidate email review", () => {
  const control = board(async () => ({ success: false }));
  const candidate = { ...applicant, pipeline_stage: "call_screening", pipeline_summary: { state: "draft", started: true, passed: false } };
  let tree = control.render([candidate]);
  nodes(tree, "DropdownMenuItem").find(node => node.props.children === "Continue call screening").props.onSelect();
  tree = control.render();
  nodes(tree, "ApplicantStageWorkspace")[0].props.onReject();
  tree = control.render();
  assert.equal(nodes(tree, "ApplicantStageWorkspace").length, 0);
  const status = nodes(tree, "ApplicantStatusDialog")[0];
  assert.equal(status.props.initialAction, "reject");
  status.props.onSaved({ candidate: { ...candidate, pipeline_outcome: "rejected", pipeline_revision: 5 }, records: [], events: [], final_score: null });
  tree = control.render();
  assert.equal(nodes(tree, "ApplicantStatusDialog").length, 0);
  assert.equal(nodes(tree, "CandidateEmailsDialog")[0].props.candidateId, applicant.id);
});

test("overview routes the offer stage to the offer workflow instead of an assessment form", () => {
  const control = board(async () => ({ success: false }));
  let tree = control.render([{ ...applicant, pipeline_stage: "offer_preparation", status: "reviewing" }]);
  nodes(tree, "Button").find(node => node.props["aria-label"] === "View candidate details for Ada").props.onClick();
  nodes(control.render(), "CandidateOverviewSheet")[0].props.onStage("offer_preparation");
  tree = control.render();
  assert.equal(nodes(tree, "ApplicantStageWorkspace").length, 0);
  assert.equal(nodes(tree, "PrepareOfferDialog")[0].props.candidate.id, applicant.id);
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

test("pending email remains the visible next action after closing, and explicit skip restores the stage action", () => {
  const control = board(async () => ({ success: false }));
  const candidate = { ...applicant, ai_evaluation: { status: "completed" }, pipeline_stage: "oral_interview", email_summary: { pending: true, status: "pending", event_id: "event-1" } };
  let tree = control.render([candidate]);
  nodes(tree, "Button").find(node => node.props["aria-label"] === "Review email for Ada").props.onClick();
  let dialog = nodes(control.render(), "CandidateEmailsDialog")[0];
  dialog.props.onClose();
  tree = control.render();
  assert.ok(nodes(tree, "Button").some(node => node.props["aria-label"] === "Review email for Ada"));
  nodes(tree, "Button").find(node => node.props["aria-label"] === "Review email for Ada").props.onClick();
  dialog = nodes(control.render(), "CandidateEmailsDialog")[0];
  dialog.props.onChanged("skipped"); dialog.props.onClose();
  tree = control.render();
  assert.ok(!nodes(tree, "Button").some(node => node.props["aria-label"] === "Review email for Ada"));
  assert.ok(nodes(tree, "Button").some(node => node.props["aria-label"] === "Start oral interview for Ada"));
});

test("selected CVs are screened in micro-batches, retain failures, cool down on 429, and refresh once", async () => {
  const candidates = [1, 2, 3, 4, 5].map(i => ({ ...applicant, id: `bulk-${i}`, name: `Candidate ${i}`, ai_evaluation: { status: "not_requested" } }));
  let rateLimitedOnce = false;
  const control = board(async () => ({ success: false }), {}, {
    batchAnalyze: async (_roleId, ids) => {
      if (ids.includes("bulk-5") && !rateLimitedOnce) {
        rateLimitedOnce = true;
        return {
          success: true,
          data: {
            rate_limited: true,
            retry_after_seconds: 1,
            results: [{ candidate_id: "bulk-5", status: "failed", reused: false, candidate: { ...candidates[4], ai_evaluation: { status: "failed", failure_code: "provider_http_429", retry_after_seconds: 1 } } }],
          },
        };
      }
      return {
        success: true,
        data: {
          rate_limited: false,
          retry_after_seconds: null,
          results: ids.map((id) =>
            id === "bulk-2"
              ? { candidate_id: id, status: "failed", reused: false, candidate: { ...candidates[1], ai_evaluation: { status: "failed", failure_code: "invalid_response" } } }
              : { candidate_id: id, status: "completed", reused: false, candidate: { ...candidates.find(c => c.id === id), ai_score: 80, ai_evaluation: { status: "completed" } } }
          ),
        },
      };
    },
  });
  let tree = control.render(candidates);
  nodes(tree, "input").find(node => node.props["aria-label"] === "Select up to 50 visible applicants for AI screening").props.onChange({ target: { checked: true } });
  tree = control.render();
  nodes(tree, "Button").find(node => node.props.children === "Analyze selected (5)").props.onClick();
  await new Promise(resolve => setTimeout(resolve, 1200));
  tree = control.render();
  // Sent [4], [1], then cooldown-retried [1] -> 3 batch calls, only 1 router refresh at end, and only bulk-2 stays selected.
  assert.deepEqual(control.calls.map(c => c[2]), [["bulk-1", "bulk-2", "bulk-3", "bulk-4"], ["bulk-5"], ["bulk-5"]]);
  assert.equal(control.refreshes.length, 1);
  assert.ok(nodes(tree, "Button").some(node => node.props.children === "Analyze selected (1)"));
  assert.ok(control.messages.some(([kind, text]) => kind === "error" && text.includes("remain selected")));
});

test("pending emails filter, batch send dialog, and bulk skip clear pending rows immediately", async () => {
  const skippedCalls = [];
  const list = [
    { ...applicant, id: "p-1", name: "Ada", pipeline_stage: "oral_interview", email_summary: { pending: true, status: "pending", event_id: "e-1" } },
    { ...applicant, id: "p-2", name: "Bola", pipeline_stage: "oral_interview", email_summary: { pending: true, status: "pending", event_id: "e-2" } },
    { ...applicant, id: "c-3", name: "Chidi", pipeline_stage: "cv_screening", email_summary: { pending: false, status: null, event_id: null } },
  ];
  const control = board(async () => ({ success: false }), {}, {
    batchSkip: async (roleId, ids) => {
      skippedCalls.push([roleId, ids]);
      return { success: true, data: { skipped_ids: ids, skipped_count: ids.length } };
    },
  });

  let tree = control.render(list);
  const pendingBtn = nodes(tree, "Button").find((n) => JSON.stringify(n.props.children).includes("Pending emails"));
  assert.ok(pendingBtn);
  pendingBtn.props.onClick();
  tree = control.render();
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 2);

  // Clicking "Send pending emails (2)" opens BatchPipelineEmailsDialog with all visible pending IDs.
  nodes(tree, "Button")
    .find((n) => JSON.stringify(n.props.children).includes("Send pending emails"))
    .props.onClick();
  tree = control.render();
  assert.deepEqual(nodes(tree, "BatchPipelineEmailsDialog")[0].props.candidateIds, ["p-1", "p-2"]);
  nodes(tree, "BatchPipelineEmailsDialog")[0].props.onClose();
  tree = control.render();

  // Select all pending rows and click "Skip emails (2)".
  nodes(tree, "input")
    .find((n) => n.props["aria-label"] === "Select up to 50 visible applicants for AI screening")
    .props.onChange({ target: { checked: true } });
  tree = control.render();
  nodes(tree, "Button")
    .find((n) => JSON.stringify(n.props.children).includes("Skip emails"))
    .props.onClick();
  await tick();
  tree = control.render();
  assert.deepEqual(skippedCalls, [["role-1", ["p-1", "p-2"]]]);
  assert.equal(nodes(tree, "TableBody")[0].props.children[0].length, 0);
});

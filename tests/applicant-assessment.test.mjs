import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const draft = (notes = "Evidence") => ({
  answers: [{ question_id: "q", score: 4, notes }],
  unscored_responses: {},
  interviewer_name: "Interviewer",
  interview_date: "2026-10-13",
  strengths: "",
  concerns: "",
  recommendation: "Hire",
  rationale: "Evidence",
});
const tick = () => new Promise((resolve) => setImmediate(resolve));
test("autosave serializes revisions and includes edits made during a pending save", async () => {
  const { AssessmentSaveQueue } = actionLoader().load(
    "lib/recruitment/assessment-draft.ts",
  );
  const requests = [],
    completions = [];
  const queue = new AssessmentSaveQueue(
    draft(),
    1,
    (data, revision) =>
      new Promise((resolve) => requests.push({ data, revision, resolve })),
    (result) => completions.push(result.revision),
    () => {},
  );
  queue.update(draft("First edit"));
  const flushed = queue.flush();
  queue.update(draft("Second edit"));
  assert.equal(requests.length, 1);
  requests[0].resolve({ success: true, data: { revision: 2 } });
  await tick();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].revision, 2);
  assert.equal(requests[1].data.answers[0].notes, "Second edit");
  requests[1].resolve({ success: true, data: { revision: 3 } });
  assert.equal(await flushed, true);
  assert.equal(queue.dirty, false);
  assert.equal(queue.revision, 3);
  assert.deepEqual(completions, [2, 3]);
});
test("failed autosave retains edits and stops until an explicit retry", async () => {
  const { AssessmentSaveQueue } = actionLoader().load(
    "lib/recruitment/assessment-draft.ts",
  );
  let attempts = 0;
  const queue = new AssessmentSaveQueue(
    draft(),
    7,
    async () =>
      ++attempts === 1
        ? {
            success: false,
            error: "Connection failed",
            errorCode: "NETWORK_ERROR",
          }
        : { success: true, data: { revision: 8 } },
    () => {},
    () => {},
  );
  queue.update(draft("Unsaved evidence"));
  assert.equal(await queue.flush(), false);
  assert.equal(queue.dirty, true);
  assert.equal(queue.revision, 7);
  assert.equal(queue.draft.answers[0].notes, "Unsaved evidence");
  assert.equal(await queue.flush(), false);
  assert.equal(attempts, 1);
  assert.equal(await queue.retry(), true);
  assert.equal(queue.dirty, false);
});
test("revision conflicts never trigger an automatic overwrite", async () => {
  const { AssessmentSaveQueue } = actionLoader().load(
    "lib/recruitment/assessment-draft.ts",
  );
  let attempts = 0;
  const queue = new AssessmentSaveQueue(
    draft(),
    1,
    async () => {
      attempts++;
      return { success: false, error: "Conflict", errorCode: "HTTP_409" };
    },
    () => {},
    () => {},
  );
  queue.update(draft());
  assert.equal(await queue.flush(), false);
  queue.update(draft("New local notes"));
  assert.equal(await queue.flush(), false);
  assert.equal(attempts, 1);
  assert.equal(queue.error.code, "HTTP_409");
});
test("reloading fills blank question fields without inventing grades", () => {
  const { assessmentDraft } = actionLoader().load(
    "lib/recruitment/assessment-draft.ts",
  );
  const value = assessmentDraft({
    answers: [],
    unscored_responses: {},
    interviewer: { name: "HR" },
    interview_date: "2026-10-13",
    plan_snapshot: {
      questions: [
        { id: "q", scored: true },
        { id: "info", scored: false },
      ],
    },
  });
  assert.deepEqual(value.answers, [
    { question_id: "q", score: null, notes: "" },
  ]);
  assert.equal(value.recommendation, "");
  const partial = assessmentDraft({
    answers: [{ question_id: "q", score: null, notes: null }],
    unscored_responses: { info: null },
    interviewer: { name: "HR" },
    interview_date: "2026-10-13",
    plan_snapshot: { questions: [{ id: "q", scored: true }] },
  });
  assert.equal(partial.answers[0].notes, "");
  assert.equal(partial.unscored_responses.info, "");
});
test("assessment actions preserve validation and conflict codes and refresh only completed mutations", async () => {
  const refreshed = [],
    calls = [];
  const { load } = actionLoader(
    async (method, endpoint, body) => {
      calls.push({ method, endpoint, body });
      return {
        success: false,
        error: { error: "Changed elsewhere", code: "HTTP_409" },
      };
    },
    { "next/cache": { revalidatePath: (path) => refreshed.push(path) } },
  );
  const api = load("lib/api/applicant-assessment.ts");
  assert.deepEqual(
    await api.saveApplicantAssessment("candidate", { ...draft(), revision: 3 }),
    { success: false, error: "Changed elsewhere", errorCode: "HTTP_409" },
  );
  assert.equal(
    calls[0].endpoint,
    "/api/recruitment/candidates/candidate/assessment",
  );
  assert.equal(calls[0].method, "patch");
  assert.equal(calls[0].body.revision, 3);
  assert.deepEqual(refreshed, []);
});
test("submission sends the current revision and refreshes the vacancy", async () => {
  const refreshed = [];
  const { load } = actionLoader(
    async (method, endpoint, body) => {
      assert.equal(method, "post");
      assert.equal(
        endpoint,
        "/api/recruitment/candidates/candidate/assessment/submit",
      );
      assert.equal(body.revision, 9);
      return { success: true, data: { data: { state: "submitted" } } };
    },
    { "next/cache": { revalidatePath: (path) => refreshed.push(path) } },
  );
  assert.deepEqual(
    await load("lib/api/applicant-assessment.ts").submitApplicantAssessment(
      "candidate",
      "role",
      { ...draft(), revision: 9 },
    ),
    { success: true, data: { state: "submitted" } },
  );
  assert.deepEqual(refreshed, ["/hr/recruitment/role"]);
});

test("optional notes do not block preview scores but missing ratings still do", () => {
  const {load} = actionLoader(undefined, {"react/jsx-runtime": {}});
  const {previewAssessment} = load("app/(admin)/hr/recruitment/[id]/components/assessment-results.tsx");
  const plan = {competencies: {solution: "Solution"}, weights: {role: 100}, questions: [{id: "q", section: "role", scored: true, competency: "solution"}]};
  const scored = previewAssessment(plan, draft(""));
  assert.equal(scored.score_100, 80);
  assert.equal(scored.completed, 1);
  assert.deepEqual(scored.missing, []);
  const incomplete = previewAssessment(plan, {...draft(), answers: [{question_id: "q", score: null, notes: "Extensive notes"}]});
  assert.equal(incomplete.score_100, null);
  assert.deepEqual(incomplete.missing, ["q"]);
});
test("failed CV evaluations hide legacy fallback scores and preserve genuine zero and sixty", () => {
  const {cvEvaluationFailed, cvEvaluationScore} = actionLoader().load("lib/recruitment/cv-evaluation.ts");
  for (const ai_evaluation of [{status: "failed"}, {summary: "Automated AI scoring was unavailable; manual review recommended."}]) {
    const candidate = {ai_score: 60, ai_evaluation};
    assert.equal(cvEvaluationFailed(candidate), true);
    assert.equal(cvEvaluationScore(candidate), null);
  }
  for (const score of [0, 60, 100]) assert.equal(cvEvaluationScore({ai_score: score, ai_evaluation: {status: "completed"}}), score);
});

test("Accounts preview preserves unequal task points and critical checks", () => {
  const {load} = actionLoader(undefined, {"react/jsx-runtime": {}});
  const {previewAssessment} = load("app/(admin)/hr/recruitment/[id]/components/assessment-results.tsx");
  const modules = [4,5,4,3].map((count, task) => ({
    id: `task-${task}`, name: `Task ${task}`, minimum_score: 60,
    criteria: Array.from({length: count}, (_, n) => ({id: `${task}-${n}`, label: `Criterion ${task}-${n}`, max: 5, ...(task === 1 && n === 0 ? {required: true, minimum: 3} : {})})),
  }));
  const criteria = modules.flatMap(task => task.criteria);
  const plan = {
    competencies: {role: "Role"}, weights: {interview: 10, role: 10, practical: 80},
    questions: [{id: "core", section: "role", scoring_section: "interview", scored: true, competency: "role"}, {id: "knowledge", section: "role", scored: true, competency: "role"}],
    practical_module: {id: "accounts", name: "Accounts pack", minimum_score: 60, criteria},
    practical_modules: modules,
    decision_rules: {score_bands: {strong_hire: 90, hire: 80, hold: 70}, critical_competencies: {}},
  };
  const value = {...draft(), answers: [{question_id: "core", score: 5}, {question_id: "knowledge", score: 5}], practical_marks: Object.fromEntries(criteria.map(c => [c.id,5]))};
  assert.equal(previewAssessment(plan, value).score_100, 100);
  const failed = previewAssessment(plan, {...value, practical_marks: {...value.practical_marks, "1-0": 0}});
  assert.equal(failed.score_100, 95);
  assert.equal(failed.decision_guidance, "Do not hire");
  assert.equal(failed.gates.passed, false);
  const incomplete = {...value.practical_marks};
  delete incomplete["0-0"];
  const result = previewAssessment(plan, {...value, practical_marks: incomplete});
  assert.equal(result.score_100, null);
  assert.deepEqual(result.missing, ["practical-module"]);
  assert.equal(result.total, 3);
});

test("candidate task handout excludes assessor guidance and observation scoring", () => {
  const jsx = (type,props) => ({type: typeof type === "string" ? type : type.name,props});
  const renderer = Object.fromEntries(["Document","Image","Page","Text","View"].map(name => [name,name]));
  renderer.StyleSheet = {create: value => value};
  const {load} = actionLoader(undefined, {"react/jsx-runtime": {jsx,jsxs:jsx}, "@react-pdf/renderer":renderer});
  const {CandidatePracticalPdfDocument} = load("lib/recruitment/assessment-pdf.tsx");
  const document = CandidatePracticalPdfDocument({plan:{track:{name:"Accounts"}, practical_modules:[
    {id:"a",name:"Transaction review",duration_minutes:25,scenario:"Fictional transaction data",tasks:["Calculate receipts"],criteria:[{label:"SECRET CRITERION",guide:"SECRET ANSWER"}],assessor_guide:"SECRET GUIDE"},
    {id:"observation",name:"INTERNAL OBSERVATION",duration_minutes:0,scenario:"INTERNAL NOTES",tasks:[]},
  ]}});
  const text = JSON.stringify(document);
  assert.match(text,/Fictional transaction data/);
  assert.match(text,/Calculate receipts/);
  for (const hidden of ["SECRET CRITERION","SECRET ANSWER","SECRET GUIDE","INTERNAL OBSERVATION","INTERNAL NOTES"]) assert.equal(text.includes(hidden),false);
});

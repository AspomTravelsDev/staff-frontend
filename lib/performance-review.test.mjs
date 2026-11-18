import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("review drafts start with unanswered criteria and restore only the author's saved answers", () => {
  const { load } = actionLoader(() => {});
  const { assessmentValues } = load("lib/performance-self-assessment.ts");
  const criteria = [{ id: "accuracy" }, { id: "timeliness" }];
  assert.deepEqual(assessmentValues(criteria, null, 0).answers.map((answer) => answer.rating), [null, null]);
  const restored = assessmentValues(criteria, { comment: "Reviewer note", answers: [{ criterion_id: "accuracy", rating: 2, comment: "Needs correction", evidence: "Report" }] }, 3);
  assert.equal(restored.version, 3);
  assert.equal(restored.comment, "Reviewer note");
  assert.deepEqual(restored.answers.map((answer) => answer.rating), [2, null]);
});

test("MP preview averages only MP answers and waits until all ratings are explicit", () => {
  const { load } = actionLoader(() => {});
  const { previewReviewMean } = load("lib/performance-review.ts");
  assert.equal(previewReviewMean([]), null);
  assert.equal(previewReviewMean([{ rating: 4 }, { rating: null }]), null);
  assert.equal(previewReviewMean([{ rating: 4 }, { rating: 4 }, { rating: 5 }]), "4.33");
});

test("review status distinguishes an active draft, waiting for Compliance and completed history", () => {
  const { load } = actionLoader(() => {});
  const { reviewStatusLabel, reviewStageLabel } = load("lib/performance-review.ts");
  assert.equal(reviewStageLabel({ stage: "reviewer", reviewer_route: "compliance" }), "Compliance assessment");
  assert.equal(reviewStageLabel({ stage: "mp", reviewer_route: "direct_mp" }), "MP assessment");
  assert.equal(reviewStageLabel({ stage: null, is_assigned: false, status: "completed", reviewer_route: "supervisor", type: "appraisal" }), "Completed appraisal result");
  assert.equal(reviewStatusLabel({ status: "awaiting_mp", can_review: true, assessment_status: "draft" }), "Draft saved");
  assert.equal(reviewStatusLabel({ status: "awaiting_reviewer", stage: "mp", reviewer_route: "compliance" }), "Waiting for Compliance");
  assert.equal(reviewStatusLabel({ status: "awaiting_reviewer", current_stage: "hr", stage: "mp" }), "Waiting for HR");
  assert.equal(reviewStatusLabel({ status: "awaiting_mp", current_stage: "mp", stage: "supervisor", type: "monthly_kpi" }), "Waiting for MP");
  assert.equal(reviewStatusLabel({ status: "awaiting_mp", current_stage: "mp", stage: "supervisor", type: "appraisal" }), "Waiting for management");
  assert.equal(reviewStatusLabel({ status: "completed" }), "Completed");
});

test("review actions use assigned review endpoints and preserve versions and serializable failures", async () => {
  const calls = [];
  const fixture = { id: "appraisal", stage: "mp" };
  const input = { version: 2, comment: "Final comment", answers: [] };
  const { load } = actionLoader((method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    return { success: true, data: { data: fixture } };
  });
  const actions = load("lib/api/performance-review.actions.ts");
  assert.deepEqual((await actions.saveReviewDraft("appraisal", input)).data, fixture);
  assert.deepEqual((await actions.submitReview("appraisal", input)).data, fixture);
  assert.deepEqual(calls, [["put", "/api/performance/reviews/appraisal/draft", input], ["post", "/api/performance/reviews/appraisal/submit", input]]);
  const failed = actionLoader(() => ({ success: false, error: { error: "The preceding assessment must be submitted first.", code: "HTTP_409" } }));
  const failure = await failed.load("lib/api/performance-review.actions.ts").submitReview("appraisal", input);
  assert.equal(failure.success, false);
  assert.equal(failure.error.code, "HTTP_409");
});

test("review navigation includes HR, supervisors, Compliance, MP, MD and Super, and excludes department accounts", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { getNavigationForUser } = load("lib/navigation.ts");
  const visible = (user) => getNavigationForUser(user).department.some((item) => item.url === "/performance/reviews");
  const hasCompletedArchive = (user) => getNavigationForUser(user).department.some((item) => item.url === "/hr/performance");
  assert.equal(visible({ role: "visa" }), false);
  for (const role of ["hr", "mp", "md", "super", "compliance"]) assert.equal(visible({ role }), true, role);
  assert.equal(visible({ role: "visa", is_supervisor: true }), true);
  assert.equal(visible({ role: "visa", secondary_roles: ["compliance"] }), true);
  assert.equal(visible({ role: "md", secondary_roles: ["mp"] }), true);
  assert.equal(visible({ role: "compliance", is_department_account: true }), false);
  assert.equal(visible({ role: "hr", is_department_account: true }), false);
  for (const role of ["hr", "compliance", "mp", "md", "super"]) assert.equal(hasCompletedArchive({ role }), false, role);
});

test("appraisal cycle window info identifies May/November early open windows and off-window months", () => {
  const { load } = actionLoader(() => {});
  const { getAppraisalCycleWindowInfo } = load("lib/performance-review.ts");
  assert.deepEqual(getAppraisalCycleWindowInfo(new Date("2026-05-10T10:00:00Z")), {
    targetMonth: "2026-06",
    cycleLabel: "June 2026",
    earlyOpenMonthLabel: "May",
    canOpenNow: true,
    defaultDeadline: "2026-06-30",
  });
  assert.deepEqual(getAppraisalCycleWindowInfo(new Date("2026-11-18T10:00:00Z")), {
    targetMonth: "2026-12",
    cycleLabel: "December 2026",
    earlyOpenMonthLabel: "November",
    canOpenNow: true,
    defaultDeadline: "2026-12-31",
  });
  assert.deepEqual(getAppraisalCycleWindowInfo(new Date("2026-03-15T10:00:00Z")), {
    targetMonth: "2026-06",
    cycleLabel: "June 2026",
    earlyOpenMonthLabel: "May",
    canOpenNow: false,
    defaultDeadline: "2026-06-30",
  });
});

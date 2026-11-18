import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const { load } = actionLoader(() => {});
const { selfAssessmentValues, appraisalStatusLabel } = load("lib/performance-self-assessment.ts");

test("new assigned criteria remain unanswered; a saved draft restores ratings, comments and evidence", () => {
  const appraisal = { self_version: 0, criteria: [{ id: "accuracy" }, { id: "timeliness" }], self_assessment: null };
  const fresh = selfAssessmentValues(appraisal);
  assert.deepEqual(fresh.answers.map((answer) => answer.rating), [null, null]);
  assert.equal(fresh.version, 0);
  const saved = selfAssessmentValues({ ...appraisal, self_version: 3, self_assessment: {
    comment: "Monthly reflection", answers: [{ criterion_id: "accuracy", rating: 5, comment: "No corrections", evidence: "Completed report" }],
  } });
  assert.equal(saved.version, 3);
  assert.equal(saved.comment, "Monthly reflection");
  assert.deepEqual(saved.answers[0], { criterion_id: "accuracy", rating: 5, comment: "No corrections", evidence: "Completed report" });
  assert.equal(saved.answers[1].rating, null);
});

test("draft restoration cannot substitute foreign criteria for the saved appraisal criteria", () => {
  const restored = selfAssessmentValues({ self_version: 1, criteria: [{ id: "assigned" }], self_assessment: {
    answers: [{ criterion_id: "foreign", rating: 5, comment: "Unrelated" }],
  } });
  assert.deepEqual(restored.answers.map((answer) => [answer.criterion_id, answer.rating]), [["assigned", null]]);
});

test("history labels preserve Compliance and direct-to-MP routing and distinguish closed self-assessments", () => {
  assert.equal(appraisalStatusLabel({ status: "awaiting_reviewer", reviewer_route: "compliance" }), "Awaiting Compliance review");
  assert.equal(appraisalStatusLabel({ status: "awaiting_reviewer", reviewer_route: "supervisor" }), "Awaiting supervisor review");
  assert.equal(appraisalStatusLabel({ status: "awaiting_reviewer", current_stage: "hr", reviewer_route: "supervisor" }), "Awaiting HR review");
  assert.equal(appraisalStatusLabel({ status: "awaiting_reviewer", current_stage: "compliance", reviewer_route: "supervisor" }), "Awaiting Compliance review");
  assert.equal(appraisalStatusLabel({ status: "awaiting_mp", reviewer_route: "direct_mp" }), "Awaiting MP review");
  assert.equal(appraisalStatusLabel({ status: "awaiting_self", can_edit_self: false }), "Self-assessment closed");
  assert.equal(appraisalStatusLabel({ status: "awaiting_self", can_edit_self: true, self_status: "draft" }), "Draft saved");
});

test("self-assessment requests use only assigned appraisals and retain draft versions", async () => {
  const calls = [];
  const data = { version: 2, comment: "Reflection", answers: [{ criterion_id: "criterion", rating: 4 }] };
  const fixture = { id: "appraisal", self_version: 3 };
  const { load } = actionLoader((method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    return { success: true, data: { data: endpoint.endsWith("/mine") ? { items: [fixture] } : fixture } };
  });
  const client = load("lib/api/performance-appraisal.ts");
  assert.deepEqual(await client.getAppraisalHistory(), [fixture]);
  assert.deepEqual(await client.saveSelfAppraisalDraft("appraisal", data), fixture);
  assert.deepEqual(await client.submitSelfAppraisal("appraisal", data), fixture);
  assert.deepEqual(calls, [
    ["get", "/api/performance/appraisals/mine", undefined],
    ["put", "/api/performance/appraisals/appraisal/self/draft", data],
    ["post", "/api/performance/appraisals/appraisal/self/submit", data],
  ]);
});

test("personal navigation is enabled for individuals and absent for department accounts", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { getNavigationForUser } = load("lib/navigation.ts");
  const links = (user) => getNavigationForUser(user).personal.flatMap((item) => [item, ...(item.items ?? [])]);
  const appraisal = links({ role: "visa" }).find((item) => item.url === "/my/performance");
  assert.ok(appraisal);
  assert.notEqual(appraisal.disabled, true);
  assert.equal(links({ role: "visa", is_department_account: true }).length, 0);
});

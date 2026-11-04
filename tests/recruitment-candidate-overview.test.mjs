import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const { stageOverview } = actionLoader().load("lib/recruitment/candidate-overview.ts");
const context = { candidate: { ai_score: 0, pipeline_outcome: "active" }, records: [], events: [] };

test("overview distinguishes an AI CV score from an HR stage decision", () => {
  assert.deepEqual(stageOverview(context, "cv_screening"), { score: 0, result: "Awaiting HR review", state: "Not started" });
  assert.equal(stageOverview(context, "practical").result, "Not assessed");
});

test("overview keeps failed marks after advancement and labels incomplete results", () => {
  const failed = { stage: "oral_interview", state: "completed", payload: {}, results: { passed: false, score_100: 40 } };
  const candidate = { ...context, records: [failed], events: [{ event: "advance", from_stage: "oral_interview" }] };
  assert.equal(stageOverview(candidate, "oral_interview").result, "Failed");
  assert.equal(stageOverview({ ...candidate, records: [{ ...failed, state: "draft" }] }, "oral_interview").result, "Below standard · draft");
  assert.equal(stageOverview({ ...candidate, records: [{ ...failed, state: "skipped" }] }, "oral_interview").result, "Skipped by exception");
});

test("call compatibility and final management decisions have clear unscored results", () => {
  const call = { stage: "call_screening", state: "completed", payload: { compatibility: "Not compatible" }, results: { passed: false } };
  assert.equal(stageOverview({ ...context, records: [call] }, "call_screening").result, "Failed");
  assert.equal(stageOverview({ ...context, candidate: { ...context.candidate, pipeline_stage: "call_screening", pipeline_outcome: "rejected" }, records: [{ ...call, state: "draft" }] }, "call_screening").result, "Failed · rejected");
  assert.equal(stageOverview({ ...context, events: [{ event: "management_decline" }] }, "management_review").result, "Declined");
});

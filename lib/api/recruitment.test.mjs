import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./action-test-utils.mjs";

test("CV upload preserves permission versus transport error codes without logging CV data", async () => {
  for (const code of ["INSUFFICIENT_PERMISSIONS", "HTTP_403", "UPLOAD_BLOCKED_BY_HOSTING", "HTTP_413", "NETWORK_ERROR"]) {
    const formData = new FormData();
    formData.append("cv_file", new Blob(["private CV contents"]), "candidate.txt");
    const { load, logs } = actionLoader(async (method, endpoint, body) => {
      assert.equal(method, "post");
      assert.equal(endpoint, "/api/recruitment/roles/role-id/candidates");
      assert.equal(body, formData);
      return { success: false, error: { code, error: "Upload failed" } };
    });
    const result = await load("lib/api/recruitment.ts").uploadCandidateCv("role-id", formData);
    assert.deepEqual(result, { success: false, error: "Upload failed", errorCode: code });
    assert.deepEqual(logs, [["[Recruitment CV upload failed]", { roleId: "role-id", code }]]);
  }
});

test("CV upload success returns the analyzed candidate", async () => {
  const candidate = { id: "candidate-id", ai_score: 85 };
  const { load, logs } = actionLoader(async () => ({ success: true, data: { data: candidate } }));
  assert.deepEqual(await load("lib/api/recruitment.ts").uploadCandidateCv("role-id", new FormData()), {
    success: true, data: candidate,
  });
  assert.equal(logs.length, 0);
});

test("candidate deletion is scoped to its role and refreshes role details and hub counts", async () => {
  const refreshed = [];
  const { load } = actionLoader(async (method, endpoint) => {
    assert.equal(method, "delete");
    assert.equal(endpoint, "/api/recruitment/roles/role-id/candidates/candidate-id");
    return { success: true, data: {} };
  }, { "next/cache": { revalidatePath: (path) => refreshed.push(path) } });
  assert.deepEqual(await load("lib/api/recruitment.ts").deleteRecruitmentCandidate("candidate-id", "role-id"), { success: true });
  assert.deepEqual(refreshed, ["/hr/recruitment/role-id", "/hr/recruitment"]);
});

test("failed candidate deletion preserves its error and does not refresh successful-deletion views", async () => {
  const refreshed = [];
  const { load } = actionLoader(async () => ({
    success: false, error: { error: "Candidate not found", code: "HTTP_404" },
  }), { "next/cache": { revalidatePath: (path) => refreshed.push(path) } });
  assert.deepEqual(await load("lib/api/recruitment.ts").deleteRecruitmentCandidate("candidate-id", "role-id"), {
    success: false, error: "Candidate not found", errorCode: "HTTP_404",
  });
  assert.deepEqual(refreshed, []);
});

test("role deletion refreshes the recruitment hub and linked staff request view", async () => {
  const refreshed = [];
  const { load } = actionLoader(async (method, endpoint) => {
    assert.equal(method, "delete");
    assert.equal(endpoint, "/api/recruitment/roles/role-id");
    return { success: true, data: {} };
  }, { "next/cache": { revalidatePath: (path) => refreshed.push(path) } });
  assert.deepEqual(await load("lib/api/recruitment.ts").deleteRecruitmentRole("role-id"), { success: true });
  assert.deepEqual(refreshed, ["/hr/recruitment", "/hr/staff-requests"]);
});

test("closing a role updates its status and refreshes the detail and hub", async () => {
  const refreshed = [];
  const { load } = actionLoader(async (method, endpoint, body) => {
    assert.equal(method, "put");
    assert.equal(endpoint, "/api/recruitment/roles/role-id");
    assert.deepEqual(body, { status: "closed" });
    return { success: true, data: { data: { id: "role-id", status: "closed" } } };
  }, { "next/cache": { revalidatePath: (path) => refreshed.push(path) } });
  assert.equal((await load("lib/api/recruitment.ts").updateRecruitmentRole("role-id", { status: "closed" })).success, true);
  assert.deepEqual(refreshed, ["/hr/recruitment/role-id", "/hr/recruitment"]);
});

test("batchAnalyzeCandidates posts chunked IDs without intermediate cache revalidation", async () => {
  const refreshed = [];
  const calls = [];
  const { load } = actionLoader(async (method, endpoint, body) => {
    calls.push({ method, endpoint, body });
    return {
      success: true,
      data: { data: { results: [{ candidate_id: "c1", status: "completed", reused: false, candidate: { id: "c1" } }], rate_limited: false, retry_after_seconds: null } },
    };
  }, { "next/cache": { revalidatePath: (path) => refreshed.push(path) } });

  const result = await load("lib/api/recruitment.ts").batchAnalyzeCandidates("role-1", ["c1", "c2"]);
  assert.equal(result.success, true);
  assert.equal(result.data.results.length, 1);
  assert.deepEqual(calls, [{ method: "post", endpoint: "/api/recruitment/roles/role-1/candidates/batch-analyze", body: { candidate_ids: ["c1", "c2"] } }]);
  assert.deepEqual(refreshed, []);
});

import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./action-test-utils.mjs";

function clearanceAction(post) {
  const { load } = actionLoader((method, ...args) => {
    assert.equal(method, "post");
    return post(...args);
  });
  return load("lib/api/inventory.ts").initiateFullClearance;
}

test("no assigned devices returns a serializable result instead of a server-action exception", async () => {
  const message = "This staff member currently has no assigned devices to clear.";
  for (const code of ["NO_ASSIGNED_DEVICES", "HTTP_422"]) {
    const initiate = clearanceAction(async (endpoint, body) => {
      assert.equal(endpoint, "/api/admin/inventory/clearance/full");
      assert.equal(body.assignee_id, "staff-1");
      assert.equal(body.notes, "Offboarding");
      return { success: false, error: { code, error: message } };
    });
    const result = JSON.parse(JSON.stringify(await initiate("staff-1", "Offboarding")));
    assert.deepEqual(result, { success: false, error: { code: "NO_ASSIGNED_DEVICES", error: message } });
  }
});

test("actual clearance conflicts and permission failures keep their code and useful message", async () => {
  for (const error of [
    { code: "HTTP_422", error: "One device already has an open workflow." },
    { code: "HTTP_403", error: "You do not have permission to initiate clearance." },
    { code: "NETWORK_ERROR", error: "Unable to reach the server." },
  ]) {
    const initiate = clearanceAction(async () => ({ success: false, error }));
    assert.deepEqual(JSON.parse(JSON.stringify(await initiate("staff-1"))), { success: false, error });
  }
});

test("successful clearance returns the mapped assignments and an empty result stays empty", async () => {
  const initiate = clearanceAction(async () => ({
    success: true,
    data: { data: [{ id: 5, inventory_item_id: 8, type: "full_clearance", status: "return_pending_staff" }] },
  }));
  const result = await initiate("staff-1");
  assert.equal(result.success, true);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, "5");
  assert.equal(result.data[0].inventoryItemId, "8");
  const empty = clearanceAction(async () => ({ success: true, data: { data: [] } }));
  assert.deepEqual(JSON.parse(JSON.stringify(await empty("staff-1"))), { success: true, data: [] });
});

test("unexpected server failures return a safe result without exposing internal exception details", async () => {
  const initiate = clearanceAction(async () => { throw new Error("Internal server details"); });
  const result = await initiate("staff-1");
  assert.equal(result.success, false);
  assert.equal(result.error.code, "CLEARANCE_FAILED");
  assert.match(result.error.error, /Please try again from Inventory/);
  assert.doesNotMatch(result.error.error, /Internal server details/);
});

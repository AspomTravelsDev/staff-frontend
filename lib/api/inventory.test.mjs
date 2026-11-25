import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./action-test-utils.mjs";

test("task queues opt into waiting assignments while legacy calls keep their original scope", async () => {
  for (const [name, route] of [["getInventoryOfficerQueue", "officer-queue"], ["getInventoryComplianceQueue", "compliance-queue"]]) {
    for (const includeWaiting of [false, true]) {
      const { load } = actionLoader(async (method, endpoint) => {
        assert.equal(method, "get");
        assert.equal(endpoint, `/api/admin/inventory/assignments/${route}${includeWaiting ? "?include_waiting=1" : ""}`);
        return { success: true, data: { data: [] } };
      });
      assert.deepEqual(await load("lib/api/inventory.ts")[name](includeWaiting), []);
    }
  }
});

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

test("createInventoryConditionUpdate posts payload and maps condition update response", async () => {
  const { load } = actionLoader(async (method, endpoint, body) => {
    assert.equal(method, "post");
    assert.equal(endpoint, "/api/admin/inventory/12/condition-updates");
    assert.deepEqual(body, {
      condition_rating: "Good",
      condition_details: "Screen replaced",
      checklist: {
        screen: "New OLED installed",
        charger: "Original",
        buttons: "Working",
        battery: "90%",
        ports: "Working",
        cameraMic: "Working",
        overall: "Clean",
      },
      notes: "Replaced cracked display and verified.",
    });
    return {
      success: true,
      data: {
        data: {
          id: 44,
          inventory_item_id: 12,
          assignee_id: "staff-1",
          previous_condition_rating: "Fair",
          new_condition_rating: "Good",
          new_condition_details: "Screen replaced",
          notes: "Replaced cracked display and verified.",
          status: "pending_staff",
          created_at: "2026-11-25T10:00:00Z",
          initiator: { id: "admin-1", name: "Ada Officer" },
        },
      },
    };
  });

  const result = await load("lib/api/inventory.ts").createInventoryConditionUpdate("12", {
    conditionRating: "Good",
    conditionDetails: "Screen replaced",
    checklist: {
      screen: "New OLED installed",
      charger: "Original",
      buttons: "Working",
      battery: "90%",
      ports: "Working",
      cameraMic: "Working",
      overall: "Clean",
    },
    notes: "Replaced cracked display and verified.",
  });

  assert.equal(result.id, "44");
  assert.equal(result.inventoryItemId, "12");
  assert.equal(result.previousConditionRating, "Fair");
  assert.equal(result.newConditionRating, "Good");
  assert.equal(result.status, "pending_staff");
  assert.equal(result.initiator?.name, "Ada Officer");
});

test("getMyInventoryConditionUpdates fetches pending updates and falls back to empty on HTTP_404", async () => {
  const { load } = actionLoader(async (method, endpoint) => {
    assert.equal(method, "get");
    assert.equal(endpoint, "/api/my-inventory/condition-updates?pending_only=1");
    return {
      success: true,
      data: {
        data: [
          {
            id: 7,
            inventory_item_id: 3,
            previous_condition_rating: "Fair",
            new_condition_rating: "Good",
            notes: "Battery replaced",
            status: "pending_staff",
            created_at: "2026-11-25T10:05:00Z",
          },
        ],
      },
    };
  });

  const updates = await load("lib/api/inventory.ts").getMyInventoryConditionUpdates(true);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, "7");
  assert.equal(updates[0].newConditionRating, "Good");

  const { load: load404 } = actionLoader(async () => ({
    success: false,
    error: { code: "HTTP_404", error: "Not found" },
  }));
  const fallback = await load404("lib/api/inventory.ts").getMyInventoryConditionUpdates(true);
  assert.deepEqual(fallback, []);
});

test("respondToConditionUpdate sends acknowledged or disputed decisions", async () => {
  for (const [decision, notes] of [
    ["acknowledged", undefined],
    ["disputed", "Screen still flickers"],
  ]) {
    const { load } = actionLoader(async (method, endpoint, body) => {
      assert.equal(method, "patch");
      assert.equal(endpoint, "/api/my-inventory/condition-updates/44/respond");
      assert.deepEqual(body, { decision, notes });
      return {
        success: true,
        data: {
          data: {
            id: 44,
            inventory_item_id: 12,
            previous_condition_rating: "Fair",
            new_condition_rating: "Good",
            notes: "Replaced screen",
            status: decision,
            staff_notes: notes,
            created_at: "2026-11-25T10:00:00Z",
          },
        },
      };
    });

    const result = await load("lib/api/inventory.ts").respondToConditionUpdate("44", {
      decision,
      notes,
    });
    assert.equal(result.status, decision);
    assert.equal(result.staffNotes, notes);
  }
});

test("getInventory maps pending_condition_update onto InventoryItem", async () => {
  const { load } = actionLoader(async (method, endpoint) => {
    assert.equal(method, "get");
    assert.ok(endpoint.startsWith("/api/admin/inventory?"));
    return {
      success: true,
      data: {
        items: [
          {
            id: 99,
            name: "iPhone 14",
            category: "Phone",
            serial_number: "SN-99",
            status: "Assigned",
            condition_rating: "Fair",
            assigned_to: "staff-1",
            pending_condition_update: {
              id: 51,
              inventory_item_id: 99,
              previous_condition_rating: "Fair",
              new_condition_rating: "Good",
              notes: "Speaker cleaned",
              status: "pending_staff",
              created_at: "2026-11-25T10:10:00Z",
            },
          },
        ],
        pagination: { page: 1, limit: 25, total: 1, total_pages: 1 },
      },
    };
  });

  const result = await load("lib/api/inventory.ts").getInventory({});
  assert.equal(result.items[0].conditionRating, "Fair");
  assert.equal(result.items[0].pendingConditionUpdate?.id, "51");
  assert.equal(result.items[0].pendingConditionUpdate?.newConditionRating, "Good");
  assert.equal(result.items[0].pendingConditionUpdate?.status, "pending_staff");
});

import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const { getNavigationBadgeTotal } = actionLoader(() => {}).load("lib/navigation-badges.ts");

test("section totals include nested badges and comma-separated sources once", () => {
  const items = [{ badgeKey: "requests, replies", items: [{ badgeKey: "requests" }, { badgeKey: "tasks, replies" }] }, { badgeKey: "tasks" }];
  assert.equal(getNavigationBadgeTotal(items, { requests: 3, replies: { count: 2 }, tasks: 5 }), 10);
});

test("disabled and missing sources do not inflate section totals", () => {
  const items = [{ disabled: true, badgeKey: "hidden", items: [{ badgeKey: "hiddenChild" }] }, { badgeKey: "missing, zero, invalid, negative, large" }];
  assert.equal(getNavigationBadgeTotal(items, { hidden: 8, hiddenChild: 9, zero: 0, invalid: NaN, negative: -2, large: 123 }), 123);
  assert.equal(getNavigationBadgeTotal(items), 0);
});

test("totals follow updated notification counts", () => {
  const items = [{ items: [{ badgeKey: "tasks" }] }];
  assert.equal(getNavigationBadgeTotal(items, { tasks: 4 }), 4);
  assert.equal(getNavigationBadgeTotal(items, { tasks: 0 }), 0);
});

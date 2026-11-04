import test from "node:test";
import assert from "node:assert/strict";
import * as jsx from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const reviewers = ["super", "mp", "md", "it", "compliance", "office-operations"];

test("announcement review navigation and page policy use the same explicit primary/secondary roles", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { canReviewAnnouncements } = load("lib/announcement-review-access.ts");
  const { getNavigationForUser } = load("lib/navigation.ts");
  const visible = (user) => getNavigationForUser(user).department.find((item) => item.url === "/admin/announcements");
  for (const role of reviewers) {
    assert.equal(canReviewAnnouncements({ role }), true, role);
    assert.equal(visible({ role }).badgeKey, "announcements");
    assert.equal(visible({ role }).title, "Announcement Reviews");
    assert.equal(canReviewAnnouncements({ role: "admin", secondary_roles: [role] }), true);
    assert.ok(visible({ role: "admin", secondary_roles: [role] }));
  }
  for (const user of [{ role: "admin" }, { role: "hr" }, { role: "visa" }, { role: "account" },
    { role: "compliance", is_active: false }, { role: "it", is_department_account: true }]) {
    assert.equal(canReviewAnnouncements(user), false);
    assert.equal(visible(user), undefined);
  }
  const feed = getNavigationForUser({ role: "visa" }).department.find((item) => item.url === "/announcements");
  assert.equal(feed.badgeKey, "unreadAnnouncements");
});

test("the review page admits authorized reviewers and redirects unauthorized users before reading submissions", async () => {
  for (const [user, allowed] of [[{ role: "compliance" }, true], [{ role: "office-operations" }, true],
    [{ role: "admin", secondary_roles: ["it"] }, true], [{ role: "admin" }, false], [{ role: "it", is_active: false }, false]]) {
    let loaded = false;
    const { load } = actionLoader(() => {}, {
      "react/jsx-runtime": jsx,
      "@/lib/auth/session": { getCurrentUser: async () => user },
      "@/lib/api/render-data-page": { renderDataPage: (operation) => operation() },
      "./queries": { getAllAnnouncements: async () => { loaded = true; return []; } },
      "./components/admin-announcements-content": { AdminAnnouncementsContent: () => null },
    });
    const page = load("app/(admin)/admin/announcements/page.tsx").default;
    if (allowed) await page();
    else await assert.rejects(page(), (error) => error.digest?.includes("/dashboard"));
    assert.equal(loaded, allowed);
  }
});

test("review loading follows pagination so an older pending submission is not hidden after 100 recent records", async () => {
  const calls = [];
  const { load } = actionLoader((method, endpoint) => {
    calls.push([method, endpoint]);
    return { success: true, data: { data: endpoint.endsWith("page=1") ? [{ id: "recent" }] : [{ id: "older-pending", status: "pending" }], pagination: { total_pages: 2 } } };
  });
  const results = await load("app/(admin)/admin/announcements/queries.ts").getAllAnnouncements();
  assert.deepEqual(results.map((item) => item.id), ["recent", "older-pending"]);
  assert.deepEqual(calls.map((call) => call[1]), ["/api/announcements?limit=100&page=1", "/api/announcements?limit=100&page=2"]);
});

test("failed review loading does not report an empty queue", async () => {
  const { load } = actionLoader(() => ({ success: false, error: { error: "Unable to load announcements.", code: "HTTP_500" } }));
  await assert.rejects(load("app/(admin)/admin/announcements/queries.ts").getAllAnnouncements(), { name: "ExpectedActionError", code: "HTTP_500" });
});

test("approval and rejection actions retain the selected decision and rejection reason", async () => {
  const calls = [];
  const { load } = actionLoader((method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    return { success: true, data: { announcement: { id: "announcement-1", ...body } } };
  });
  const actions = load("app/(admin)/admin/announcements/actions.ts");
  assert.deepEqual(await actions.updateAnnouncementAction("announcement-1", { status: "approved" }), { success: true });
  assert.deepEqual(await actions.updateAnnouncementAction("announcement-1", { status: "rejected", rejection_reason: "Please add the event date." }), { success: true });
  assert.deepEqual(calls, [
    ["patch", "/api/announcements/announcement-1", { status: "approved" }],
    ["patch", "/api/announcements/announcement-1", { status: "rejected", rejection_reason: "Please add the event date." }],
  ]);
});

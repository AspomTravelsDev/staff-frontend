import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const allowedRoles = ["social-media", "super", "mp", "md"];
const blockedRoles = ["visa", "hr", "compliance", "office-operations", "it", "admin", "account"];

test("social media graphics access helpers use role getters across primary and secondary roles", () => {
  const { load } = actionLoader(() => {});
  const {
    canAccessSocialMediaGraphics,
    canDeleteSocialMediaGraphic,
  } = load("lib/social-media-graphics-access.ts");

  for (const role of allowedRoles) {
    assert.equal(canAccessSocialMediaGraphics({ role, is_active: true }), true, role);
    assert.equal(
      canAccessSocialMediaGraphics({ role: "visa", secondary_roles: [role], is_active: true }),
      true,
      `secondary ${role}`
    );
  }

  for (const role of blockedRoles) {
    assert.equal(canAccessSocialMediaGraphics({ role, is_active: true }), false, role);
  }

  assert.equal(
    canAccessSocialMediaGraphics({ role: "social-media", is_active: false }),
    false
  );

  // Delete authorization mirrors uploader + social-media supervisor + management
  assert.equal(
    canDeleteSocialMediaGraphic(
      { id: "u1", role: "social-media", is_active: true },
      { uploaded_by_id: "u1" }
    ),
    true
  );
  assert.equal(
    canDeleteSocialMediaGraphic(
      { id: "u2", role: "social-media", is_active: true, is_supervisor: false },
      { uploaded_by_id: "u1" }
    ),
    false
  );
  assert.equal(
    canDeleteSocialMediaGraphic(
      { id: "u2", role: "social-media", is_active: true, is_supervisor: true },
      { uploaded_by_id: "u1" }
    ),
    true
  );
  assert.equal(
    canDeleteSocialMediaGraphic(
      { id: "md-1", role: "md", is_active: true },
      { uploaded_by_id: "u1" }
    ),
    true
  );
  assert.equal(
    canDeleteSocialMediaGraphic(
      { id: "u2", role: "social-media", is_active: true },
      { uploaded_by_id: "u1", can_delete: true }
    ),
    true
  );
});

test("navigation exposes Graphics Library only to social-media and management roles", () => {
  const { load } = actionLoader(() => {}, {
    "lucide-react": new Proxy({}, { get: () => () => null }),
  });
  const { getNavigationForUser } = load("lib/navigation.ts");

  const hasGraphicsLink = (user) =>
    getNavigationForUser(user).department.some(
      (item) => item.url === "/social-media/graphics"
    );

  for (const role of allowedRoles) {
    assert.equal(hasGraphicsLink({ role }), true, `primary ${role}`);
    assert.equal(
      hasGraphicsLink({ role: "visa", secondary_roles: [role] }),
      true,
      `secondary ${role}`
    );
  }

  for (const role of blockedRoles) {
    assert.equal(hasGraphicsLink({ role }), false, `blocked ${role}`);
  }
});

test("graphics page server route admits allowed roles and redirects unauthorized staff and guests", async () => {
  const pagePath = "app/(admin)/social-media/graphics/page.tsx";
  const pageSource = readFileSync(pagePath, "utf8");
  assert.ok(pageSource.includes("canAccessSocialMediaGraphics"));

  const loadPage = (user) =>
    actionLoader(() => {}, {
      "react/jsx-runtime": jsxRuntime,
      "@/lib/auth/session": { getCurrentUser: async () => user },
      "@/components/social-media/graphics/graphics-workspace": {
        SocialMediaGraphicsWorkspace: () => "WORKSPACE_RENDERED",
      },
    }).load(pagePath).default;

  for (const role of allowedRoles) {
    const rendered = await loadPage({ id: "u1", role, is_active: true })();
    assert.ok(rendered);

    const renderedSecondary = await loadPage({
      id: "u2",
      role: "visa",
      secondary_roles: [role],
      is_active: true,
    })();
    assert.ok(renderedSecondary);
  }

  for (const role of blockedRoles) {
    await assert.rejects(
      loadPage({ id: "u3", role, is_active: true })(),
      (err) => err.digest?.includes("/dashboard")
    );
  }

  await assert.rejects(
    loadPage(null)(),
    (err) => err.digest?.includes("/login")
  );
});

test("social media graphics actions hit expected endpoints and payloads", async () => {
  const calls = [];
  const { load } = actionLoader((method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    if (endpoint.startsWith("/api/social-media/graphics?")) {
      return {
        success: true,
        data: {
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 24, total: 0, has_more: false },
          counts: { fresh: 0, posted: 0, archived: 0, fresh_missing_caption: 0, fresh_with_caption: 0 },
        },
      };
    }
    return {
      success: true,
      data: { data: { id: "g-1", updated_count: 1, deleted: true, status: "posted" } },
    };
  });

  const actions = load("lib/api/social-media-graphics.ts");

  await actions.getSocialMediaGraphics({
    status: "fresh",
    search: "uk visa",
    category: "Visa",
    caption_state: "missing_caption",
    page: 2,
  });
  await actions.updateSocialMediaGraphic("g-1", { caption: "New caption" });
  await actions.updateSocialMediaGraphicStatus("g-1", {
    status: "posted",
    posted_platforms: ["instagram"],
  });
  await actions.bulkUpdateSocialMediaGraphicStatus({
    ids: ["g-1"],
    status: "archived",
  });
  await actions.deleteSocialMediaGraphic("g-1");

  assert.deepEqual(calls, [
    [
      "get",
      "/api/social-media/graphics?status=fresh&search=uk+visa&category=Visa&caption_state=missing_caption&page=2",
      undefined,
    ],
    ["patch", "/api/social-media/graphics/g-1", { caption: "New caption" }],
    [
      "patch",
      "/api/social-media/graphics/g-1/status",
      { status: "posted", posted_platforms: ["instagram"] },
    ],
    [
      "post",
      "/api/social-media/graphics/bulk-status",
      { ids: ["g-1"], status: "archived" },
    ],
    ["delete", "/api/social-media/graphics/g-1", undefined],
  ]);
});

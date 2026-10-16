import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = (names) =>
  Object.fromEntries(names.split(" ").map((n) => [n, n]));
const nodes = (tree, type) =>
  Array.isArray(tree)
    ? tree.flatMap((t) => nodes(t, type))
    : !tree || typeof tree !== "object"
      ? []
      : [
          ...(tree.type === type ? [tree] : []),
          ...nodes(tree.props?.children, type),
        ];

test("the existing bell renders grouped recruitment alerts with their specific destinations", () => {
  const updates = {
    count: 3,
    recruitment_items: [
      {
        id: "1",
        title: "CV analysis needs attention",
        body: "Accounts · Retry or review manually.",
        count: 2,
        url: "/hr/recruitment/role-1",
      },
      {
        id: "2",
        title: "Prepare offer · Ada",
        body: "Management approved this candidate.",
        count: 1,
        url: "/hr/recruitment/role-1?applicant=ada",
      },
    ],
  };
  const overrides = {
    react: { useState: (v) => [v, () => {}], useEffect() {} },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" },
    "@/providers/user-provider": {
      useUser: () => ({ user: { id: "hr", role: "hr" } }),
    },
    "@/lib/api/hooks/use-notifications": {
      useRoleNotifications: () => ({ data: { recruitmentUpdates: updates } }),
    },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries() {} }),
    },
    "@/lib/navigation": {
      getNavigationForUser: () => ({
        dashboard: [],
        personal: [],
        department: [
          { url: "/hr/recruitment", badgeKey: "recruitmentUpdates" },
        ],
      }),
    },
    "@/lib/api/notifications": { clearAllNotifications() {} },
    "@/lib/api/employees": {
      getTodayBirthdays() {},
      getTodayAnniversaries() {},
    },
    "@/components/pwa/push-notification-settings": named(
      "PushNotificationSettings",
    ),
    "./icons/theme-switcher": named("ThemeSwitcher"),
    "./ui/popover": named("Popover PopoverContent PopoverTrigger"),
    "./ui/separator": named("Separator"),
    "./ui/sidebar": named("SidebarTrigger"),
    "./clock-in-widget": named("ClockInWidget"),
    "lucide-react": named("BellIcon Gift Trophy"),
    sonner: { toast: { success() {}, error() {} } },
  };
  const Header = actionLoader(undefined, overrides).load(
    "components/site-header.tsx",
  ).SiteHeader;
  const links = nodes(Header(), "Link");
  assert.deepEqual(
    links.map((n) => n.props.href),
    updates.recruitment_items.map((n) => n.url),
  );
  assert.equal(nodes(links[0], "span")[0].props.children, 2);
  assert.equal(nodes(links[1], "span").length, 0);
});

test("document generation failures record an offer alert from the server action", async () => {
  const calls = [];
  const actions = actionLoader(
    async (method, path, body) => {
      calls.push({ method, path, body });
      return { success: true };
    },
    {
      "@/app/(public)/applicant/[id]/pdf-actions": {
        downloadPdfFormsAction: async () => ({ error: "PDF failed" }),
      },
    },
  ).load("lib/api/recruitment-pipeline.ts");
  const result = await actions.generateRecruitmentOfferDocuments(
    "candidate",
    "application",
    "generation",
  );
  assert.equal(result.error, "PDF failed");
  assert.deepEqual(calls, [
    {
      method: "post",
      path: "/api/recruitment/candidates/candidate/offer-failure",
      body: { application_id: "application", generation: "generation" },
    },
  ]);
});

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const jsx = await import("react/jsx-runtime");
function preview(theme, props = {}) {
  const wrap = ({ children }) => React.createElement("div", null, children);
  const { load } = actionLoader(() => { throw new Error("Preview must not call an API"); }, {
    "react/jsx-runtime": jsx,
    "next-themes": { useTheme: () => ({ resolvedTheme: theme }) },
    "@/components/ui/sheet": { Sheet: wrap, SheetContent: wrap, SheetDescription: wrap, SheetHeader: wrap, SheetTitle: wrap },
  });
  return renderToStaticMarkup(React.createElement(load("app/(admin)/my/announcement/components/announcement-preview.tsx").AnnouncementPreview, {
    open: true, onOpenChange() {}, title: "Team update", content: "<h2>Full announcement</h2><p><strong>Formatted content</strong></p>", type: "announcement", ...props,
  }));
}

test("full announcement preview isolates HTML without allowing scripts or same-origin access", () => {
  const html = preview("light", { content: '<script>alert(1)</script><p>Full content</p>', status: "pending" });
  assert.match(html, /sandbox=""/);
  assert.doesNotMatch(html, /allow-scripts|allow-same-origin|<script>/);
  assert.match(html, /Pending review/);
  assert.match(html, /default-src/);
  assert.match(html, /Full content/);
});

test("draft preview supports theme, formatting, and an empty title without submitting", () => {
  const html = preview("dark", { title: "" });
  assert.match(html, /Untitled announcement/);
  assert.match(html, /Not submitted/);
  assert.match(html, /color-scheme:dark/);
  assert.match(html, /&lt;strong&gt;Formatted content/);
});

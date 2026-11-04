import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

function find(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(item => find(item, type));
  return [...(tree.type === type ? [tree] : []), ...find(tree.props?.children, type)];
}
function grid() {
  let expanded;
  const jsx = (type, props) => ({ type, props });
  const { load } = actionLoader(() => {}, {
    react: { useState(initial) { expanded ??= initial; return [expanded, value => { expanded = typeof value === "function" ? value(expanded) : value; }]; } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/components/ui/badge": { Badge: "Badge" },
    "lucide-react": { ChevronUp: "ChevronUp", ChevronDown: "ChevronDown" },
    "./sanction-grid-export-button": { SanctionGridExportButton: "ExportGrid" },
  });
  const { SanctionLadderGrid } = load("app/(admin)/compliance/components/sanction-ladder-grid.tsx");
  return () => SanctionLadderGrid({ windowStart: "2026-07-01", steps: [], items: [{ user_id: "staff", name: "Staff", issues_count: 0, current_step: 0 }], defaultOpen: false });
}

test("the full grid header is a native button that expands and collapses the grid", () => {
  const render = grid();
  const header = find(render(), "button")[0];
  assert.equal(header.props.type, "button");
  assert.equal(header.props["aria-expanded"], false);
  assert.equal(header.props["aria-controls"], "sanction-grid-export-content");
  header.props.onClick();
  assert.equal(find(render(), "button")[0].props["aria-expanded"], true);
  assert.ok(find(render(), "div").some(node => node.props.id === "sanction-grid-export-content"));
  find(render(), "button")[0].props.onClick();
  assert.equal(find(render(), "button")[0].props["aria-expanded"], false);
});
test("the export control remains outside the header toggle", () => {
  const render = grid();
  assert.equal(find(render(), "ExportGrid").length, 0);
  find(render(), "button")[0].props.onClick();
  const expanded = render();
  assert.equal(find(expanded, "ExportGrid").length, 1);
  assert.equal(find(find(expanded, "button")[0], "ExportGrid").length, 0);
});

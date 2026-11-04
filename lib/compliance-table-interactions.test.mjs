import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const componentNames = names => Object.fromEntries(names.map(name => [name, name]));
const jsx = (type, props) => ({ type, props });
function find(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(node => find(node, type));
  return [...(tree.type === type ? [tree] : []), ...find(tree.props?.children, type)];
}
function table(admin = true) {
  const state = []; let cursor = 0;
  const { load } = actionLoader(() => {}, {
    react: { useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], value => { state[index] = value; }]; } },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "next/navigation": { useRouter: () => ({ refresh() {}, replace() {} }), usePathname: () => "/compliance", useSearchParams: () => new URLSearchParams() },
    "date-fns": { format: () => "30 Oct 2026" }, "sonner": { toast: {} },
    "lucide-react": componentNames(["MoreHorizontal", "Trash2", "Eye", "MessagesSquare", "Scale", "ShieldCheck", "Clock3", "CheckCircle2"]),
    "@/components/ui/table": componentNames(["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"]),
    "@/components/ui/details-table-row": { DetailsTableRow: "DetailsTableRow" },
    "@/components/ui/avatar": componentNames(["Avatar", "AvatarFallback"]),
    "@/components/ui/button": { Button: "Button" }, "@/components/ui/badge": { Badge: "Badge" },
    "@/components/ui/dropdown-menu": componentNames(["DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuTrigger"]),
    "@/components/ui/alert-dialog": componentNames(["AlertDialog", "AlertDialogContent", "AlertDialogHeader", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogCancel", "AlertDialogAction"]),
    "@/lib/api/compliance": {}, "./compliance-details-dialog": { ComplianceDetailsDialog: "QueryWorkspace" },
  });
  const { ComplianceTable } = load("app/(admin)/compliance/components/compliance-table.tsx");
  return () => { cursor = 0; return ComplianceTable({ isAdmin: admin, issues: [{ id: "query-1", user_name: "Sample Staff", type: "Policy review", description: "Details", severity: "medium", status: "open", occurrence_date: "2026-10-30" }] }); };
}

test("selecting a compliance row opens the details sheet", () => {
  const render = table();
  find(render(), "DetailsTableRow")[0].props.onOpenDetails();
  const workspace = find(render(), "QueryWorkspace")[0];
  assert.equal(workspace.props.issueId, "query-1");
  assert.equal(workspace.props.mode, "details");
});
test("the actions cell has one popover trigger and distinct response and outcome actions", () => {
  const render = table();
  const row = find(render(), "DetailsTableRow")[0];
  assert.equal(find(row, "Button").length, 1);
  const menu = find(row, "DropdownMenuContent")[0];
  assert.equal(menu.props["data-row-click-ignore"], true);
  const items = find(menu, "DropdownMenuItem");
  items[1].props.onSelect();
  assert.equal(find(render(), "QueryWorkspace")[0].props.mode, "response");
  items[2].props.onSelect();
  assert.equal(find(render(), "QueryWorkspace")[0].props.mode, "outcome");
});
test("staff actions exclude outcome selection and deletion", () => {
  const row = find(table(false)(), "DetailsTableRow")[0];
  assert.equal(find(row, "DropdownMenuItem").length, 2);
});
test("query details are enabled only for an open workspace with an ID", async () => {
  let captured, requested;
  const { load } = actionLoader(() => {}, {
    "@tanstack/react-query": { useQuery: options => { captured = options; return options; } },
    "../compliance": { getComplianceDetails: async id => { requested = id; return { id }; } },
    "../query-keys": { queryKeys: { compliance: { detail: id => ["compliance", "detail", id] } } },
  });
  const { useComplianceQuery } = load("lib/api/hooks/use-compliance.ts");
  useComplianceQuery(null, false);
  assert.equal(captured.enabled, false);
  assert.equal(requested, undefined);
  useComplianceQuery("query-1", true);
  assert.equal(captured.enabled, true);
  assert.equal(captured.refetchOnWindowFocus, false);
  assert.equal((await captured.queryFn()).id, "query-1");
});
test("interactive menu targets do not trigger the shared row details action", () => {
  const originalElement = globalThis.Element;
  class TargetElement { constructor(interactive) { this.interactive = interactive; } closest() { return this.interactive; } }
  globalThis.Element = TargetElement;
  try {
    const { load } = actionLoader(() => {}, {
      "react/jsx-runtime": { jsx }, "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") }, "@/components/ui/table": { TableRow: "tr" },
    });
    const { DetailsTableRow } = load("components/ui/details-table-row.tsx");
    let opened = 0;
    const row = DetailsTableRow({ detailLabel: "Query details", onOpenDetails: () => opened++ });
    row.props.onClick({ target: new TargetElement(true), defaultPrevented: false });
    assert.equal(opened, 0);
    row.props.onClick({ target: new TargetElement(false), defaultPrevented: false });
    assert.equal(opened, 1);
    const target = {};
    row.props.onKeyDown({ key: "Enter", target, currentTarget: target, defaultPrevented: false, preventDefault() {} });
    assert.equal(opened, 2);
  } finally { globalThis.Element = originalElement; }
});

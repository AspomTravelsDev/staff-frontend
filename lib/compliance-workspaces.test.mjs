import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

const issue = {
  id: "query-123", type: "Customer Complaint", status: "open", severity: "low",
  user: { name: "Sample Staff", department: "Operations" }, description: "Review the booking record",
  evidence: "Reference ABC-123", evidence_documents: [{ id: "doc-123", original_name: "booking.pdf", file_size: 1000 }],
  comments: [{ id: "comment", user_id: "staff", created_at: "2026-10-30T10:00:00Z", comment: "Staff response evidence", user: { name: "Sample Staff" } }],
};
const element = ({ children }) => React.createElement("div", null, children);
const components = names => Object.fromEntries(names.map(name => [name, element]));
function workspace(mode) {
  const overrides = {
    react: React, "react/jsx-runtime": runtime,
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/providers/user-provider": { useUser: () => ({ user: { id: "reviewer" } }) },
    "@/lib/api/hooks/use-compliance": { useComplianceQuery: () => ({ data: issue, isFetchedAfterMount: true, isError: false, refetch: async () => ({ data: issue }) }) },
    "@/lib/api/compliance": {}, "date-fns": { format: () => "30 Oct 2026" }, "sonner": { toast: {} },
    "lucide-react": { Paperclip: () => null },
    "@/components/ui/dialog": components(["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription", "DialogFooter"]),
    "@/components/ui/sheet": { ...components(["Sheet", "SheetHeader", "SheetTitle", "SheetDescription", "SheetFooter"]), SheetContent: ({ children }) => React.createElement("aside", { "data-surface": "sheet" }, children) },
    "@/components/ui/button": { Button: element }, "@/components/ui/badge": { Badge: element },
    "@/components/ui/avatar": components(["Avatar", "AvatarFallback", "AvatarImage"]),
    "@/components/ui/textarea": { Textarea: ({ placeholder }) => React.createElement("textarea", { placeholder }) },
    "@/components/ui/input": { Input: () => null }, "@/components/ui/label": { Label: element },
    "@/components/ui/select": components(["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"]),
    "./decision-policy-fields": { DecisionPolicyFields: () => null }, "./correction-plan-fields": { CorrectionPlanFields: () => null },
    "@/lib/utils/employee-headcount": { lagosDateKey: () => "2026-10-30" },
  };
  const { load } = actionLoader(() => {}, overrides);
  overrides["./query-evidence"] = load("app/(admin)/compliance/components/query-evidence.tsx");
  const { ComplianceDetailsDialog } = load("app/(admin)/compliance/components/compliance-details-dialog.tsx");
  return renderToStaticMarkup(React.createElement(ComplianceDetailsDialog, { issueId: issue.id, open: true, onOpenChange() {}, isAdmin: true, mode }));
}

test("responses show evidence text and attachments without resolution controls", () => {
  const html = workspace("response");
  assert.match(html, /Reference ABC-123/);
  assert.match(html, /booking.pdf/);
  assert.match(html, /Staff response evidence/);
  assert.doesNotMatch(html, /Select outcome|Verified evidence|Record outcome/);
});
test("outcome selection is separate from the conversation", () => {
  const html = workspace("outcome");
  assert.match(html, /Select outcome/);
  assert.match(html, /Verified evidence/);
  assert.doesNotMatch(html, /Communication Thread|Staff response evidence|Send Message/);
});
test("details open in a sheet with full query information rather than the conversation", () => {
  const html = workspace("details");
  assert.match(html, /data-surface="sheet"/);
  assert.match(html, /Query reference/);
  assert.match(html, /query-123/);
  assert.match(html, /booking.pdf/);
  assert.doesNotMatch(html, /Communication Thread|Select outcome/);
});

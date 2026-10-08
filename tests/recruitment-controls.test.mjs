import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const namedComponents = (names) => Object.fromEntries(names.split(" ").map((name) => [name, name]));

// Exercise real component handlers with explicit hook state and mocked UI primitives.
// No live candidates are deleted and no browser session is used.
function control(filename, exportName, props, actions) {
  const state = [];
  let cursor = 0;
  const navigation = [];
  const notices = [];
  const { load } = actionLoader(() => { throw new Error("Unexpected API call"); }, {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = value; }];
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => ({
      replace: (path) => navigation.push(["replace", path]),
      refresh: () => navigation.push(["refresh"]),
    }) },
    sonner: { toast: {
      success: (message) => notices.push(["success", message]),
      error: (message) => notices.push(["error", message]),
    } },
    "lucide-react": namedComponents("CheckCircle2 Loader2 MoreHorizontal PlayCircle Trash2"),
    "@/components/ui/button": namedComponents("Button"),
    "@/components/ui/dropdown-menu": namedComponents("DropdownMenu DropdownMenuContent DropdownMenuItem DropdownMenuSeparator DropdownMenuTrigger"),
    "@/components/ui/alert-dialog": namedComponents("AlertDialog AlertDialogAction AlertDialogCancel AlertDialogContent AlertDialogDescription AlertDialogFooter AlertDialogHeader AlertDialogTitle AlertDialogTrigger"),
    "@/lib/api/recruitment": actions,
  });
  const Component = load(filename)[exportName];
  const render = () => { cursor = 0; return Component(props); };
  return { render, navigation, notices };
}

function nodes(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  if (!tree || typeof tree !== "object") return [];
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}

function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string") return tree;
  return tree && typeof tree === "object" ? text(tree.props?.children) : "";
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const roleFile = "app/(admin)/hr/recruitment/components/role-actions.tsx";
const candidateFile = "app/(admin)/hr/recruitment/[id]/components/delete-candidate-dialog.tsx";
const role = { id: "role-id", title: "Visa Officer", status: "active" };
const candidate = { id: "candidate-id", name: "Candidate", onboarding_application_id: "application-id" };

test("role deletion requires confirmation and returns from a deleted role to the hub", async () => {
  const calls = [];
  const ui = control(roleFile, "RoleActions", { role, redirectOnDelete: true }, {
    deleteRecruitmentRole: async (id) => { calls.push(id); return { success: true }; },
  });
  let tree = ui.render();
  assert.equal(nodes(tree, "AlertDialog")[0].props.open, false);
  nodes(tree, "DropdownMenuItem").find((node) => text(node).includes("Delete role")).props.onSelect();
  tree = ui.render();
  assert.equal(nodes(tree, "AlertDialog")[0].props.open, true);
  assert.match(text(nodes(tree, "AlertDialogDescription")[0]), /all its candidates/);
  assert.deepEqual(calls, []);
  let prevented = false;
  nodes(tree, "AlertDialogAction")[0].props.onClick({ preventDefault: () => { prevented = true; } });
  await flush();
  assert.equal(prevented, true);
  assert.deepEqual(calls, ["role-id"]);
  assert.deepEqual(ui.navigation, [["replace", "/hr/recruitment"], ["refresh"]]);
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, false);
});

test("cancelling role deletion makes no API call", () => {
  const ui = control(roleFile, "RoleActions", { role }, {
    deleteRecruitmentRole: () => { throw new Error("Deletion must not happen"); },
  });
  nodes(ui.render(), "DropdownMenuItem").find((node) => text(node).includes("Delete role")).props.onSelect();
  nodes(ui.render(), "AlertDialog")[0].props.onOpenChange(false);
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, false);
  assert.deepEqual(ui.navigation, []);
});

test("failed role deletion leaves confirmation open without redirecting", async () => {
  const ui = control(roleFile, "RoleActions", { role, redirectOnDelete: true }, {
    deleteRecruitmentRole: async () => ({ success: false, error: "Permission denied" }),
  });
  nodes(ui.render(), "DropdownMenuItem").find((node) => text(node).includes("Delete role")).props.onSelect();
  nodes(ui.render(), "AlertDialogAction")[0].props.onClick({ preventDefault() {} });
  await flush();
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, true);
  assert.deepEqual(ui.navigation, []);
  assert.deepEqual(ui.notices, [["error", "Permission denied"]]);
});

test("close role requires confirmation and sends closed status without deleting", async () => {
  const calls = [];
  const ui = control(roleFile, "RoleActions", { role }, {
    updateRecruitmentRole: async (...args) => { calls.push(args); return { success: true }; },
  });
  nodes(ui.render(), "DropdownMenuItem").find((node) => text(node).includes("Close role")).props.onSelect();
  assert.deepEqual(calls, []);
  nodes(ui.render(), "AlertDialogAction")[0].props.onClick({ preventDefault() {} });
  await flush();
  assert.deepEqual(calls, [["role-id", { status: "closed" }]]);
  assert.deepEqual(ui.navigation, [["refresh"]]);
});

test("closed roles offer reopening and list deletion refreshes without redirecting", async () => {
  const calls = [];
  const ui = control(roleFile, "RoleActions", { role: { ...role, status: "closed" } }, {
    updateRecruitmentRole: async (...args) => { calls.push(args); return { success: true }; },
    deleteRecruitmentRole: async () => ({ success: true }),
  });
  let items = nodes(ui.render(), "DropdownMenuItem");
  assert.equal(items.some((node) => text(node).includes("Close role")), false);
  items.find((node) => text(node).includes("Reopen role")).props.onSelect();
  await flush();
  assert.deepEqual(calls, [["role-id", { status: "active" }]]);
  items = nodes(ui.render(), "DropdownMenuItem");
  items.find((node) => text(node).includes("Delete role")).props.onSelect();
  nodes(ui.render(), "AlertDialogAction")[0].props.onClick({ preventDefault() {} });
  await flush();
  assert.deepEqual(ui.navigation, [["refresh"], ["refresh"]]);
});

test("candidate deletion waits for confirmation, disables controls while pending, and closes evaluation on success", async () => {
  let resolve;
  const calls = [];
  let deleted = false;
  const ui = control(candidateFile, "DeleteCandidateDialog", { candidate, roleId: "role-id", onDeleted: () => { deleted = true; } }, {
    deleteRecruitmentCandidate: (...args) => { calls.push(args); return new Promise((done) => { resolve = done; }); },
  });
  nodes(ui.render(), "AlertDialog")[0].props.onOpenChange(true);
  assert.deepEqual(calls, []);
  nodes(ui.render(), "AlertDialogAction")[0].props.onClick({ preventDefault() {} });
  const pending = ui.render();
  assert.equal(nodes(pending, "AlertDialogAction")[0].props.disabled, true);
  assert.equal(nodes(pending, "AlertDialogCancel")[0].props.disabled, true);
  nodes(pending, "AlertDialog")[0].props.onOpenChange(false);
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, true);
  resolve({ success: true });
  await flush();
  assert.deepEqual(calls, [["candidate-id", "role-id"]]);
  assert.equal(deleted, true);
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, false);
  assert.deepEqual(ui.navigation, [["refresh"]]);
});

test("failed candidate deletion retains confirmation and the candidate view", async () => {
  let deleted = false;
  const ui = control(candidateFile, "DeleteCandidateDialog", { candidate, roleId: "role-id", onDeleted: () => { deleted = true; } }, {
    deleteRecruitmentCandidate: async () => ({ success: false, error: "Candidate not found" }),
  });
  nodes(ui.render(), "AlertDialog")[0].props.onOpenChange(true);
  nodes(ui.render(), "AlertDialogAction")[0].props.onClick({ preventDefault() {} });
  await flush();
  assert.equal(nodes(ui.render(), "AlertDialog")[0].props.open, true);
  assert.equal(deleted, false);
  assert.deepEqual(ui.navigation, []);
  assert.deepEqual(ui.notices, [["error", "Candidate not found"]]);
});

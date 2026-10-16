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
const tick = () => new Promise((r) => setImmediate(r));

function form({ locked = false, failSave = false } = {}) {
  const hooks = [],
    calls = [];
  let cursor = 0;
  const overrides = {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = initial;
        return [
          hooks[i],
          (v) => (hooks[i] = typeof v === "function" ? v(hooks[i]) : v),
        ];
      },
      useRef(initial) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = { current: initial };
        return hooks[i];
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    sonner: { toast: { success() {} } },
    "lucide-react": named("Plus Trash2"),
    "@/lib/utils/attendance": { formatLagosDateForInput: () => "2026-10-15" },
    "@/lib/api/tasks": {
      getDailyTaskBackfill: async (...args) => {
        calls.push(["load", ...args]);
        return {
          version: locked ? "saved-version" : null,
          data: locked
            ? {
                report_submitted: true,
                tasks: [{ text: "Submitted task", completed: true }],
              }
            : null,
        };
      },
      saveDailyTaskBackfill: async (input) => {
        calls.push(["save", input]);
        if (failSave) throw new Error("Record changed. Reload before saving.");
        return {
          version: "next-version",
          data: { tasks: input.tasks, report_submitted: input.submit },
        };
      },
    },
  };
  for (const [file, names] of Object.entries({
    button: "Button",
    input: "Input",
    label: "Label",
    textarea: "Textarea",
    checkbox: "Checkbox",
    dialog:
      "Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle DialogTrigger",
    select: "Select SelectContent SelectItem SelectTrigger SelectValue",
  }))
    overrides[`@/components/ui/${file}`] = named(names);
  const Component = actionLoader(undefined, overrides).load(
    "app/(admin)/hr/tasks/components/backfill-report-dialog.tsx",
  ).BackfillReportDialog;
  return {
    calls,
    render() {
      cursor = 0;
      return Component({
        users: [{ id: "employee", name: "Employee", staff_id: "EMP" }],
        initialUserId: "employee",
        initialDate: "2026-10-14",
      });
    },
  };
}

test("backfill loads on demand and drafts before submitting the same record version", async () => {
  const h = form();
  assert.deepEqual(h.calls, []);
  nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  await tick();
  assert.deepEqual(h.calls[0], ["load", "employee", "2026-10-14"]);
  nodes(h.render(), "Textarea")[0].props.onChange({
    target: { value: "Prepared client documents" },
  });
  const save = nodes(h.render(), "Button").find(
    (n) => n.props.children === "Save draft",
  );
  save.props.onClick();
  save.props.onClick();
  await tick();
  assert.equal(h.calls.filter((c) => c[0] === "save").length, 1);
  assert.equal(h.calls[1][1].version, null);
  nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  await tick();
  assert.equal(h.calls[2][1].version, "next-version");
  assert.equal(h.calls[2][1].submit, true);
});

test("an unsuccessful save retains the typed task and displays the recovery message", async () => {
  const h = form({ failSave: true });
  nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  await tick();
  nodes(h.render(), "Textarea")[0].props.onChange({
    target: { value: "Keep these edits" },
  });
  nodes(h.render(), "Button")
    .find((n) => n.props.children === "Save draft")
    .props.onClick();
  await tick();
  assert.equal(
    nodes(h.render(), "Textarea")[0].props.value,
    "Keep these edits",
  );
  assert.ok(
    nodes(h.render(), "p").some(
      (n) =>
        n.props.role === "alert" && n.props.children.includes("Record changed"),
    ),
  );
});

test("already submitted reports display as read only", async () => {
  const h = form({ locked: true });
  nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  await tick();
  const tree = h.render();
  assert.equal(nodes(tree, "Textarea")[0].props.disabled, true);
  assert.equal(nodes(tree, "Checkbox")[0].props.disabled, true);
  assert.equal(
    nodes(tree, "Button").some((n) => n.props.children === "Submit report"),
    false,
  );
  assert.equal(h.calls.filter((c) => c[0] === "save").length, 0);
});

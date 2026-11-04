import test from "node:test";
import assert from "node:assert/strict";
import * as jsx from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

function renderManager(initialData) {
  const component = () => null;
  const { load } = actionLoader(() => {}, {
    "react": { useState: (value) => [typeof value === "function" ? value() : value, () => {}], useRef: () => ({ current: null }) },
    "react/jsx-runtime": jsx,
    "@tanstack/react-query": { useQueryClient: () => ({}), useQuery: () => ({ data: initialData }), useMutation: () => ({}) },
    "lucide-react": { Plus: component, Pencil: component, Target: component },
    "sonner": { toast: {} },
    ...Object.fromEntries(["button", "input", "textarea", "label", "badge"].map((name) => [
      `@/components/ui/${name}`, { [name[0].toUpperCase() + name.slice(1)]: component },
    ])),
  });
  const tree = load("app/(admin)/compliance/kpis/kpi-manager.tsx").DepartmentKpiManager({ initialData });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return nodes;
}

const kpi = (department, is_active = true) => ({ id: department, department, is_active, name: `${department} target`, description: "Measure", expectation: "Target", applies_to: "all_staff" });

test("opening KPIs shows seeded active criteria even when General has no entries", () => {
  const nodes = renderManager({ departments: ["General", "Accounts", "Visa"], items: [kpi("Accounts"), kpi("Visa")] });
  assert.equal(nodes.find((node) => node.props.id === "department-filter").props.value, "Accounts");
  assert.ok(nodes.some((node) => node.type === "h3" && node.props.children === "Accounts target"));
});

test("initial department matches the active filter, skipping departments with only inactive criteria", () => {
  const nodes = renderManager({ departments: ["General", "Accounts", "Visa"], items: [kpi("Accounts", false), kpi("Visa")] });
  assert.equal(nodes.find((node) => node.props.id === "department-filter").props.value, "Visa");
  assert.ok(nodes.some((node) => node.type === "h3" && node.props.children === "Visa target"));
});

test("empty catalog still selects a department so Compliance can add the first KPI", () => {
  const nodes = renderManager({ departments: ["General", "Accounts"], items: [] });
  assert.equal(nodes.find((node) => node.props.id === "department-filter").props.value, "General");
});

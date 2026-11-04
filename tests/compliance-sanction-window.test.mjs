import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = names => Object.fromEntries(names.split(" ").map(name => [name, name]));
const nodes = (tree, type) => Array.isArray(tree) ? tree.flatMap(item => nodes(item, type)) : !tree || typeof tree !== "object" ? [] : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
function section(data) {
  const slots = [], paths = [];
  let cursor = 0;
  const Component = actionLoader(undefined, {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
      useTransition: () => [false, work => work()],
    },
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { usePathname: () => "/compliance", useSearchParams: () => new URLSearchParams("status=open&month=2026-09&grid_window_end=2026-04-28"), useRouter: () => ({ push: path => paths.push(path) }) },
    "@/components/ui/button": named("Button"),
    "@/components/ui/input": named("Input"),
    "@/components/ui/label": named("Label"),
    "@/lib/utils/attendance": { formatLagosDate: value => value },
    "./sanction-ladder-grid": named("SanctionLadderGrid"),
  }).load("app/(admin)/compliance/components/sanction-grid-section.tsx").SanctionGridSection;
  return { paths, render() { cursor = 0; return Component({ data }); } };
}
const data = { windowStart: "2025-10-28", windowEnd: "2026-04-28", today: "2026-11-01", isHistorical: true, steps: [], items: [], periodLabel: "Historical six months" };

test("an empty window hides the grid but keeps controls available to choose another period", () => {
  const control = section(data);
  assert.equal(nodes(control.render(), "SanctionLadderGrid").length, 0);
  const input = nodes(control.render(), "Input")[0];
  assert.equal(input.props.max, "2026-11-01");
  input.props.onChange({ target: { value: "2026-05-31" } });
  nodes(control.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  const params = new URL(control.paths[0], "https://portal.example.test").searchParams;
  assert.equal(params.get("grid_window_end"), "2026-05-31");
  assert.equal(params.get("status"), "open");
  assert.equal(params.get("month"), "2026-09");
});

test("the previous window ends before the selected window and current window clears only its date", () => {
  const control = section(data);
  nodes(control.render(), "Button").find(node => node.props.children === "Previous window").props.onClick();
  assert.equal(new URL(control.paths[0], "https://portal.example.test").searchParams.get("grid_window_end"), "2025-10-27");
  nodes(control.render(), "Button").find(node => node.props.children === "Current window").props.onClick();
  const params = new URL(control.paths[1], "https://portal.example.test").searchParams;
  assert.equal(params.has("grid_window_end"), false);
  assert.equal(params.get("status"), "open");
});

test("the API action forwards the grid window independently of the employee scope", async () => {
  let url;
  const actions = actionLoader(async (_method, endpoint) => { url = endpoint; return { success: true, data }; }).load("lib/api/compliance.ts");
  await actions.getComplianceSanctionGrid({ user_id: "staff", window_end: "2026-04-28" });
  const params = new URL(url, "https://api.example.test").searchParams;
  assert.equal(params.get("window_end"), "2026-04-28");
  assert.equal(params.get("user_id"), "staff");
});

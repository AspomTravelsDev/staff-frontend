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
function offer({
  pdfError = false,
  emailError = false,
  sent = false,
  prepared = false,
} = {}) {
  const hooks = [],
    effects = [],
    calls = [];
  let cursor = 0;
  const data = {
    candidate: { id: "candidate-1", status: sent ? "offered" : "reviewing" },
    application:
      sent || prepared
        ? {
            id: "app-1",
            applicant_name: "Ada",
            applicant_email: "ada@example.test",
            position_title: "Accounts Officer",
            employment_terms: {
              gross_salary: 150000,
              effective_date: "2026-11-01",
            },
          }
        : null,
  };
  const overrides = {
    react: {
      useState(value) {
        const i = cursor++;
        if (!(i in hooks))
          hooks[i] = typeof value === "function" ? value() : value;
        return [
          hooks[i],
          (v) => (hooks[i] = typeof v === "function" ? v(hooks[i]) : v),
        ];
      },
      useRef(value) {
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = { current: value };
        return hooks[i];
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (!hooks[i] || deps.some((v, j) => v !== hooks[i][j]))
          effects.push(fn);
        hooks[i] = deps;
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    sonner: { toast: { success() {} } },
    "@/lib/api/recruitment-pipeline": {
      generateRecruitmentOfferDocuments: async (candidateId, appId) => {
        calls.push(["pdf", appId]);
        return pdfError ? { error: "PDF generation unavailable" } : {};
      },
      reportRecruitmentOfferFailure: async (...args) => {
        calls.push(["failure", ...args]);
      },
      getRecruitmentOffer: async () => {
        throw new Error("Offer prefill must come from the page");
      },
    },
    "@/lib/api/recruitment": {
      onboardCandidateAction: async (...args) => {
        calls.push(["prepare", ...args]);
        return {
          success: true,
          data: {
            onboarding_application: {
              id: "app-1",
              form_data: { recruitment_offer: { generation: "generation-1" } },
            },
          },
        };
      },
    },
    "@/app/(public)/applicant/[id]/pdf-actions": {
      downloadPdfFormsAction: async (...args) => {
        calls.push(["pdf", ...args]);
        return pdfError ? { error: "PDF generation unavailable" } : {};
      },
    },
    "@/lib/api/hr": {
      sendInvite: async (...args) => {
        calls.push(["email", ...args]);
        if (emailError) throw new Error("Email unavailable");
      },
    },
    "@/lib/payroll/payroll-reverse-calculator": {
      calculateNetFromGross: (gross) => ({
        gross_salary: gross,
        net_salary: gross - 500,
        statutory_tax_deduction: 500,
      }),
    },
  };
  for (const [file, names] of Object.entries({
    button: "Button",
    input: "Input",
    label: "Label",
    checkbox: "Checkbox",
    dialog:
      "Dialog DialogContent DialogDescription DialogHeader DialogTitle DialogFooter",
  }))
    overrides[`@/components/ui/${file}`] = named(names);
  const Component = actionLoader(undefined, overrides).load(
    "app/(admin)/hr/recruitment/[id]/components/prepare-offer-dialog.tsx",
  ).PrepareOfferDialog;
  return {
    calls,
    render() {
      cursor = 0;
      effects.length = 0;
      const tree = Component({
        candidate: {
          id: "candidate-1",
          status: data.candidate.status,
          onboarding_application_id: data.application?.id ?? null,
          offer_application: data.application,
          name: "Ada",
          email: "ada@example.test",
          pipeline_summary: { salary_expectation: 150000 },
        },
        role: {
          id: "role-1",
          title: "Accounts Officer",
          salary_budget_min: 100000,
          salary_budget_max: 200000,
        },
        onClose() {},
      });
      effects.splice(0).forEach((fn) => fn());
      return tree;
    },
  };
}
test("HR confirms terms then one action prepares, generates and sends the offer", async () => {
  const h = offer();
  h.render();
  await tick();
  nodes(h.render(), "Input")
    .find((n) => n.props.id === "offer-date")
    .props.onChange({ target: { value: "2026-11-01" } });
  assert.equal(
    nodes(h.render(), "Input").some((n) => n.props.id === "offer-reporting"),
    false,
  );
  const form = nodes(h.render(), "form")[0];
  const first = form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  await first;
  assert.deepEqual(
    h.calls.map((c) => c[0]),
    ["prepare", "pdf", "email"],
  );
  assert.equal(h.calls[0][3].applicant_email, "ada@example.test");
  assert.equal(h.calls[0][3].salary_gross, 150000);
  assert.equal(h.calls[0][3].reporting_to, "Nancy O. Peters");
  assert.equal(h.calls[1][1], "app-1");
  assert.equal(nodes(h.render(), "form").length, 0);
});
test("PDF failure prevents email and keeps entered offer details available", async () => {
  const h = offer({ pdfError: true });
  h.render();
  await tick();
  nodes(h.render(), "Input")
    .find((n) => n.props.id === "offer-date")
    .props.onChange({ target: { value: "2026-11-01" } });
  await nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  assert.deepEqual(
    h.calls.map((c) => c[0]),
    ["prepare", "pdf", "failure"],
  );
  assert.equal(
    nodes(h.render(), "Input").find((n) => n.props.id === "offer-date").props
      .value,
    "2026-11-01",
  );
  assert.equal(nodes(h.render(), "form").length, 1);
});
test("failed email retains the retry form; previously sent offers open as read only", async () => {
  const h = offer({ emailError: true });
  h.render();
  await tick();
  nodes(h.render(), "Input")
    .find((n) => n.props.id === "offer-date")
    .props.onChange({ target: { value: "2026-11-01" } });
  await nodes(h.render(), "form")[0].props.onSubmit({ preventDefault() {} });
  assert.equal(nodes(h.render(), "form").length, 1);
  const done = offer({ sent: true });
  done.render();
  await tick();
  assert.equal(nodes(done.render(), "form").length, 0);
  assert.deepEqual(done.calls, []);
});

test("saved offer terms are available immediately without a prefill request", () => {
  const h = offer({ prepared: true });
  const inputs = nodes(h.render(), "Input");
  assert.equal(
    inputs.find((n) => n.props.id === "offer-date").props.value,
    "2026-11-01",
  );
  assert.equal(
    inputs.find((n) => n.props.id === "offer-gross").props.value,
    "150000",
  );
  assert.deepEqual(h.calls, []);
});

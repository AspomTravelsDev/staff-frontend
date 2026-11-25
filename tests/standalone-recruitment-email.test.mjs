import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const names = (text) =>
  Object.fromEntries(text.split(" ").map((name) => [name, name]));

function nodes(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((item) => nodes(item, type));
  if (!tree || typeof tree !== "object") return [];
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props?.children, type),
  ];
}

function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return tree && typeof tree === "object" ? text(tree.props?.children) : "";
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

const fixture = () => ({
  templates: [
    {
      key: "call_screening_pass",
      stage: "call_screening",
      stage_label: "Interview invite",
      outcome: "pass",
      subject_template: "Interview invitation for {{role_title}} at Aspom Travels",
      body_template:
        "Dear {{applicant_name}},\n\nYou have been invited for a {{interview_format_label}} interview for {{role_title}} on {{interview_date}} at {{interview_time}}.\n{{interview_details}}",
      field_definitions: [
        { key: "interview_date", label: "Interview date", type: "date", required: true },
        { key: "interview_time", label: "Interview time", type: "time", required: true },
        {
          key: "interview_format",
          label: "Interview format",
          type: "select",
          required: true,
          options: { physical: "Physical", virtual: "Virtual" },
        },
        {
          key: "meeting_link",
          label: "Meeting link",
          type: "url",
          required: true,
          when: { field: "interview_format", value: "virtual" },
        },
      ],
    },
    {
      key: "call_screening_fail",
      stage: "call_screening",
      stage_label: "Interview invite",
      outcome: "fail",
      subject_template: "Update on your application for {{role_title}}",
      body_template: "Hi {{applicant_name}},\n\nThank you for speaking with us.",
      field_definitions: [],
    },
    {
      key: "oral_interview_pass",
      stage: "oral_interview",
      stage_label: "Oral interview",
      outcome: "pass",
      subject_template: "Your application for {{role_title}}: next step",
      body_template: "Hi {{applicant_name}},\n\nYou passed the oral interview.",
      field_definitions: [],
    },
    {
      key: "oral_interview_fail",
      stage: "oral_interview",
      stage_label: "Oral interview",
      outcome: "fail",
      subject_template: "Update on your application for {{role_title}}",
      body_template: "Hi {{applicant_name}},\n\nWe will not proceed further.",
      field_definitions: [],
    },
  ],
  signature_html: "<p>HR Signature</p>",
  cc: null,
  reply_to: "hr@aspomtravels.com",
  history: [],
  roles: [
    {
      id: "role-1",
      title: "Developer",
      department: "IT",
      status: "active",
      candidates: [
        { id: "c-1", recruitment_role_id: "role-1", name: "Ada Role", email: "adarole@example.test", pipeline_stage: "call_screening" },
      ],
    },
  ],
});

function control(options = {}) {
  const slots = [];
  const calls = [];
  const records = new Map();
  let cursor = 0;

  const record = (id, input, status) => ({
    id,
    ...input,
    template_fields: input.fields,
    revision: (input.revision ?? 0) + 1,
    status,
    sender: { id: "hr", name: "HR" },
    sent_at: status === "sent" ? "2026-11-01T12:00:00Z" : null,
    updated_at: "2026-11-01T12:00:00Z",
  });

  const mutate = (action) => async (id, input) => {
    calls.push([action, id, input]);
    if (options[action]) return options[action](id, input, records);
    const result = record(id, input, action === "send" ? "sent" : "draft");
    records.set(id, result);
    return { success: true, data: result };
  };

  const Component = actionLoader(undefined, {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = { current: initial };
        return slots[i];
      },
      useMemo(factory) {
        return factory();
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": names(
      "Calendar CheckCircle2 ChevronLeft ChevronRight ClipboardPaste Clock Copy Edit3 History Link2 Loader2 Mail Plus RotateCcw Search Send Trash2 Users XCircle",
    ),
    "@/components/ui/badge": names("Badge"),
    "@/components/ui/button": names("Button"),
    "@/components/ui/card": names("Card CardContent CardDescription CardHeader CardTitle"),
    "@/components/ui/dialog": names("Dialog DialogContent DialogDescription DialogHeader DialogTitle"),
    "@/components/ui/input": names("Input"),
    "@/components/ui/label": names("Label"),
    "@/components/ui/select": names("Select SelectContent SelectItem SelectTrigger SelectValue"),
    "@/components/ui/tabs": names("Tabs TabsContent TabsList TabsTrigger"),
    "@/components/ui/textarea": names("Textarea"),
    "@/lib/api/standalone-recruitment-email": {
      getStandaloneEmailComposer: async () => {
        calls.push(["catalog"]);
        return fixture();
      },
      getStandaloneEmail: async (id) => {
        calls.push(["load", id]);
        return records.get(id);
      },
      prepareStandaloneEmail: mutate("prepare"),
      saveStandaloneEmail: mutate("save"),
      sendStandaloneEmail: mutate("send"),
      batchSendStandaloneEmails: async (input) => {
        calls.push(["batch-send", input]);
        if (options.batchSend) return options.batchSend(input);
        return {
          success: true,
          data: {
            sent_count: input.recipients.length,
            failed_count: 0,
            results: input.recipients.map((r) => ({
              id: r.id,
              applicant_name: r.applicant_name,
              recipient: r.recipient,
              status: "sent",
              error: null,
              record: record(r.id, { ...input, ...r, revision: 0, subject: "Batch", body: "Hello" }, "sent"),
            })),
          },
        };
      },
    },
  }).load("app/(admin)/hr/recruitment/components/standalone-recruitment-email-dialog.tsx")
    .StandaloneRecruitmentEmailDialog;

  const render = () => {
    cursor = 0;
    return Component({ initialData: fixture() });
  };

  const launch = () =>
    nodes(render(), "Button")
      .find((node) => text(node).includes("Send recruitment email"))
      .props.onClick();

  const editInput = (id, value) =>
    [...nodes(render(), "Input"), ...nodes(render(), "Textarea")]
      .find((node) => node.props.id === id)
      .props.onChange({ target: { value } });

  const editSelect = (id, value) => {
    const trigger = nodes(render(), "SelectTrigger").find((n) => n.props.id === id);
    const select = nodes(render(), "Select").find((n) =>
      nodes(n, "SelectTrigger").some((t) => t.props.id === id),
    );
    assert.ok(trigger && select, `Select ${id} not found`);
    select.props.onValueChange(value);
  };

  const submit = () => nodes(render(), "form")[0].props.onSubmit({ preventDefault() {} });

  return { calls, records, render, launch, editInput, editSelect, submit };
}

test("live preview updates immediately without prepare step and sends once with edited wording", async () => {
  let finish;
  const c = control({
    send: async (id, input) =>
      new Promise((resolve) => {
        finish = () =>
          resolve({
            success: true,
            data: { id, ...input, template_fields: input.fields, status: "sent", revision: 1, sender: { id: "hr", name: "HR" }, updated_at: "2026-11-01" },
          });
      }),
  });
  c.launch();
  assert.equal(c.calls.length, 0, "server prefills avoid an opening request");
  assert.equal(nodes(c.render(), "Button").find((n) => n.props.type === "submit").props.disabled, true);

  c.editInput("standalone-role_title", "Developer");
  c.editSelect("standalone-interview_format", "physical");
  c.editInput("standalone-interview_date", "2026-12-01");
  c.editInput("standalone-interview_time", "10:00");
  c.editInput("standalone-applicant_name", "Ada External");
  c.editInput("standalone-recipient", "ada@example.test");

  // Live preview immediately contains formatted date, time, and physical address without a server prepare call.
  const previewCard = nodes(c.render(), "Card")[0];
  const previewStr = text(previewCard);
  assert.match(previewStr, /Dear Ada External,/);
  assert.match(previewStr, /10:00 AM/);
  assert.match(previewStr, /10A Iberekodo Street/);

  // Toggle customize wording and personalize subject/body.
  nodes(c.render(), "Button")
    .find((n) => text(n).includes("Customize wording"))
    .props.onClick();
  c.editInput("standalone-subject", "A personal invitation");
  c.editInput("standalone-body", "Hi Ada, please join the interview on Tuesday.");

  c.submit();
  c.submit();
  assert.equal(c.calls.filter((call) => call[0] === "send").length, 1);
  const input = c.calls.find((call) => call[0] === "send")[2];
  assert.equal(input.recipient, "ada@example.test");
  assert.equal(input.subject, "A personal invitation");
  assert.equal(input.fields.interview_format, "physical");

  finish();
  await tick();
  assert.ok(nodes(c.render(), "Button").some((n) => text(n).includes("Send another for this role")));
});

test("closing saves partial details and custom placeholders block send", async () => {
  const c = control();
  c.launch();
  c.editInput("standalone-applicant_name", "Unfinished applicant");
  nodes(c.render(), "Dialog")[0].props.onOpenChange(false);
  await tick();
  assert.equal(c.calls[0][0], "save");
  assert.equal(c.calls[0][2].applicant_name, "Unfinished applicant");
  assert.equal(nodes(c.render(), "Dialog").length, 0);

  // Reopen, switch to oral fail, verify placeholder guard in custom mode.
  c.launch();
  c.editInput("standalone-role_title", "Developer");
  c.editSelect("standalone-stage", "oral_interview");
  c.editSelect("standalone-outcome", "fail");
  c.editInput("standalone-applicant_name", "Ada");
  c.editInput("standalone-recipient", "ada@example.test");
  assert.equal(nodes(c.render(), "Button").find((n) => n.props.type === "submit").props.disabled, false);

  nodes(c.render(), "Button")
    .find((n) => text(n).includes("Customize wording"))
    .props.onClick();
  c.editInput("standalone-body", "Please submit by [deadline].");
  assert.equal(nodes(c.render(), "Button").find((n) => n.props.type === "submit").props.disabled, true);
});

test("failed saves retain edits and keep the composer open", async () => {
  const c = control({ save: async () => ({ success: false, error: "Could not save", code: "HTTP_500" }) });
  c.launch();
  c.editInput("standalone-applicant_name", "Keep these edits");
  nodes(c.render(), "Dialog")[0].props.onOpenChange(false);
  await tick();
  assert.equal(nodes(c.render(), "Dialog").length, 1);
  assert.equal(nodes(c.render(), "Input").find((n) => n.props.id === "standalone-applicant_name").props.value, "Keep these edits");
  assert.ok(nodes(c.render(), "p").some((n) => n.props.role === "alert" && text(n) === "Could not save"));
});

test("paste list imports multiple recipients and batch sends all of them", async () => {
  const c = control();
  c.launch();
  c.editInput("standalone-role_title", "Developer");
  c.editSelect("standalone-outcome", "fail");

  nodes(c.render(), "Button")
    .find((n) => text(n).includes("Paste list"))
    .props.onClick();
  c.editInput(
    "standalone-paste-box",
    "Name,Email\nAda Obi, ada@example.com\nTunde Bakare\ttunde@example.com\nada@example.com",
  );
  nodes(c.render(), "Button")
    .find((n) => text(n).includes("Add 2 recipients"))
    .props.onClick();

  const submitBtn = nodes(c.render(), "Button").find((n) => n.props.type === "submit");
  assert.match(text(submitBtn), /Send to 2 applicants/);

  c.submit();
  await tick();
  const batchCall = c.calls.find((call) => call[0] === "batch-send");
  assert.ok(batchCall);
  assert.equal(batchCall[1].recipients.length, 2);
  assert.equal(batchCall[1].recipients[0].applicant_name, "Ada Obi");
  assert.equal(batchCall[1].recipients[1].recipient, "tunde@example.com");
});

test("parseRecipientPaste handles CSV, TSV, angle brackets, bare emails, optional schedule/links, and deduplication", () => {
  const { parseRecipientPaste } = actionLoader().load("lib/recruitment/email-template.ts");
  const parsed = parseRecipientPaste(
    "Full Name\tEmail Address\nAda Obi\tada@example.com\nTunde <tunde@example.com>\nchidi.okafor@example.com\nada@example.com",
  );
  assert.deepEqual(parsed, [
    { name: "Ada Obi", email: "ada@example.com" },
    { name: "Tunde", email: "tunde@example.com" },
    { name: "Chidi Okafor", email: "chidi.okafor@example.com" },
  ]);

  const withSchedule = parseRecipientPaste(
    "Amaka Eze, amaka@example.com, 2026-12-05, 9:30, https://meet.example.com/amaka",
  );
  assert.deepEqual(withSchedule, [
    {
      name: "Amaka Eze",
      email: "amaka@example.com",
      interview_date: "2026-12-05",
      interview_time: "09:30",
      meeting_link: "https://meet.example.com/amaka",
    },
  ]);
});

test("virtual interview invites allow per-applicant date, time, and unique meeting links without requiring defaults", async () => {
  const c = control();
  c.launch();
  c.editInput("standalone-role_title", "Travel Consultant");
  c.editSelect("standalone-interview_format", "virtual");
  c.editInput("standalone-interview_date", "2026-12-05");

  nodes(c.render(), "Button")
    .find((n) => text(n).includes("Add applicant"))
    .props.onClick();

  const editByAria = (label, value) =>
    nodes(c.render(), "Input")
      .find((n) => n.props["aria-label"] === label)
      .props.onChange({ target: { value } });

  editByAria("Applicant name row 1", "Ada One");
  editByAria("Email row 1", "ada1@example.test");
  editByAria("Applicant name row 2", "Bola Two");
  editByAria("Email row 2", "bola2@example.test");

  // Still disabled until per-applicant times and virtual links are supplied.
  assert.equal(nodes(c.render(), "Button").find((n) => n.props.type === "submit").props.disabled, true);

  editByAria("Applicant 1 interview time", "10:00");
  editByAria("Applicant 1 meeting link", "https://meet.example.com/ada");
  editByAria("Applicant 2 interview date", "2026-12-06");
  editByAria("Applicant 2 interview time", "11:30");
  editByAria("Applicant 2 meeting link", "https://meet.example.com/bola");

  assert.equal(nodes(c.render(), "Button").find((n) => n.props.type === "submit").props.disabled, false);

  c.submit();
  await tick();

  const batchCall = c.calls.find((call) => call[0] === "batch-send");
  assert.ok(batchCall);
  assert.deepEqual(batchCall[1].recipients[0].field_overrides, {
    interview_time: "10:00",
    meeting_link: "https://meet.example.com/ada",
  });
  assert.deepEqual(batchCall[1].recipients[1].field_overrides, {
    interview_date: "2026-12-06",
    interview_time: "11:30",
    meeting_link: "https://meet.example.com/bola",
  });
});

test("standalone email actions use dedicated endpoints including batch-send", async () => {
  const calls = [];
  const actions = actionLoader(async (method, url, input) => {
    calls.push([method, url, input]);
    return {
      success: true,
      data: {
        data: method === "get" && url.endsWith("composer")
          ? fixture()
          : url.endsWith("batch-send")
            ? { sent_count: 1, failed_count: 0, results: [] }
            : { id: "external", revision: 2 },
      },
    };
  }).load("lib/api/standalone-recruitment-email.ts");

  await actions.getStandaloneEmailComposer();
  await actions.getStandaloneEmail("external");
  await actions.saveStandaloneEmail("external", { revision: 1 });
  await actions.prepareStandaloneEmail("external", { revision: 1 });
  assert.equal((await actions.sendStandaloneEmail("external", { revision: 1 })).data.revision, 2);
  assert.equal((await actions.batchSendStandaloneEmails({ role_title: "Dev", template: "call_screening_fail", fields: {}, recipients: [] })).data.sent_count, 1);

  assert.deepEqual(
    calls.map((call) => [call[0], call[1]]),
    [
      ["get", "/api/recruitment/emails/composer"],
      ["get", "/api/recruitment/emails/external"],
      ["put", "/api/recruitment/emails/external"],
      ["post", "/api/recruitment/emails/external/prepare"],
      ["post", "/api/recruitment/emails/external/send"],
      ["post", "/api/recruitment/emails/batch-send"],
    ],
  );
});

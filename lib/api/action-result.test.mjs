import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./action-test-utils.mjs";

const failure = { success: false, error: { code: "HTTP_422", error: "This record already has an open workflow." } };
const modules = {
  inventory: {
    createInventoryItem: [{}], updateInventoryItem: ["1", {}], deleteInventoryItem: ["1"],
    logInventoryInspection: ["1", {}], updateMyInventory: ["1", {}],
    submitInventoryAssignmentDecision: ["1", {}], initiateInventoryAssignment: ["1", {}],
    submitInventoryOfficerDecision: ["1", {}], submitInventoryComplianceDecision: ["1", {}],
    initiateSingleReturn: ["1"], inspectClearanceReturn: ["1", {}],
    approveClearanceCompliance: ["1", {}], submitClearanceHandover: [{ assignmentIds: ["1"] }],
  },
  hr: {
    createApplication: [{}], deleteApplication: ["1"], sendInvite: ["1"], sendOnboardingReminder: ["1", {}],
    requestOnboardingCorrection: ["1", {}], toggleAddressVerification: ["1", true],
    updateContactVerification: ["1", {}], provisionCorporateEmail: ["1", {}],
    resendPortalInvite: ["1", {}], checkCpanelEmail: ["1"],
    savePublicFormStep: ["1", 1, {}], submitPublicApplication: ["1", {}],
  },
  chat: { createConversation: ["1"], getMessages: ["1"], updateMessage: ["1", "Hello"], deleteMessage: ["1"], getAttachmentDownloadUrl: ["1"] },
  "content-collections": {
    saveContentCollection: [{}], publishContentCollection: ["1"], changeContentDeadline: ["1", "2026-10-10"],
    addContentAssignment: ["1", {}], updateContentAssignment: ["1", "2", {}], saveContentIdea: ["1", {}],
  },
  "departmental-contacts": { createDepartmentalContact: [{}], updateDepartmentalContact: ["1", {}], deleteDepartmentalContact: ["1"] },
  "anonymous-comments": { submitAnonymousComment: ["A useful suggestion"] },
  "performance-appraisal": { saveSelfAppraisalDraft: ["1", {}], submitSelfAppraisal: ["1", {}] },
  "it-guides": { createITGuide: [{}], updateITGuide: ["1", {}], deleteITGuide: ["1"] },
  awards: { assignAward: [{}], updateAward: ["1", {}], deleteAward: ["1"] },
};

for (const [module, operations] of Object.entries(modules)) {
  test(`${module}: expected failures survive serialization for every affected mutation`, async () => {
    const { load } = actionLoader(async () => failure);
    const server = load(`lib/api/${module}.actions.ts`);
    const client = load(`lib/api/${module}.ts`);
    for (const [operation, args] of Object.entries(operations)) {
      const result = JSON.parse(JSON.stringify(await server[operation](...args)));
      assert.deepEqual(result, { success: false, error: { message: failure.error.error, code: failure.error.code } }, operation);
      await assert.rejects(client[operation](...args), { name: "ExpectedActionError", message: failure.error.error, code: failure.error.code }, operation);
    }
  });
}

test("chat sends preserve form-data validation failures and expected server messages", async () => {
  const { load } = actionLoader(async () => failure);
  const chat = load("lib/api/chat.ts");
  await assert.rejects(chat.sendMessage(new FormData()), /Conversation ID is required/);
  const form = new FormData();
  form.set("conversation_id", "1");
  form.set("body", "Hello");
  await assert.rejects(chat.sendMessage(form), { message: failure.error.error });
});

test("unexpected server exceptions are logged and never expose private details", async () => {
  const { load, logs } = actionLoader(async () => { throw new Error("secret connection string"); });
  for (const [module, operations] of Object.entries(modules)) {
    const client = load(`lib/api/${module}.ts`);
    const [operation, args] = Object.entries(operations)[0];
    await assert.rejects(client[operation](...args), error => {
      assert.match(error.message, /Please try again/);
      assert.doesNotMatch(error.message, /secret/);
      return true;
    });
  }
  assert.ok(logs.length >= Object.keys(modules).length);
});

test("failed inventory reads cannot produce empty lists or zero stats", async () => {
  const { load } = actionLoader(async () => failure);
  const inventory = load("lib/api/inventory.ts");
  for (const operation of ["getInventory", "getInventoryStats", "getInventoryHistory", "getMyInventory", "getMyInventoryHistory", "getMyInventoryAssignments", "getInventoryOfficerQueue", "getInventoryComplianceQueue", "getInventoryItemAssignments", "getClearanceOfficerQueue", "getClearanceComplianceQueue"]) {
    await assert.rejects(inventory[operation]("1"), { name: "ExpectedActionError" }, operation);
  }
});

test("empty successful reads remain valid empty records", async () => {
  const { load } = actionLoader(async () => ({ success: true, data: { data: [] } }));
  assert.deepEqual(await load("lib/api/anonymous-comments.ts").getAnonymousComments(), []);
  assert.deepEqual(await load("lib/api/awards.ts").getAllAwards(), []);
});

test("successful mutations retain their mapped records and void results", async () => {
  const sample = { id: 12, name: "Laptop", status: "Assigned" };
  const inventory = actionLoader(async () => ({ success: true, data: sample }));
  const created = await inventory.load("lib/api/inventory.ts").createInventoryItem({ name: "Laptop" });
  assert.equal(created.id, "12");
  assert.equal(created.name, "Laptop");
  const modules = ["hr", "chat", "content-collections", "departmental-contacts", "anonymous-comments"];
  const names = ["createApplication", "createConversation", "saveContentCollection", "createDepartmentalContact", "submitAnonymousComment"];
  for (let index = 0; index < modules.length; index++) {
    const { load } = actionLoader(async () => ({ success: true, data: { data: sample } }));
    assert.deepEqual(await load(`lib/api/${modules[index]}.ts`)[names[index]]({}), sample);
  }
  const guide = actionLoader(async () => ({ success: true, data: { guide: sample } }));
  assert.deepEqual(await guide.load("lib/api/it-guides.ts").createITGuide({}), sample);
  const award = actionLoader(async () => ({ success: true, data: { award: sample } }));
  assert.deepEqual(await award.load("lib/api/awards.ts").assignAward({}), sample);
  const appraisal = actionLoader(async () => ({ success: true, data: { data: sample } }));
  assert.deepEqual(await appraisal.load("lib/api/performance-appraisal.ts").submitSelfAppraisal("12", { version: 0, answers: [] }), sample);
  assert.equal(await inventory.load("lib/api/inventory.ts").deleteInventoryItem("12"), undefined);
});

test("nested HR actions preserve errors and document-generation failure never reports success", async () => {
  const { load } = actionLoader(async () => failure, {
    "@/app/(public)/applicant/[id]/pdf-actions": { downloadPdfFormsAction: async () => ({ error: "Unable to generate application documents." }) },
  });
  const actions = load("app/(admin)/hr/applications/actions.ts");
  for (const [operation, args] of Object.entries({
    deleteApplicationAction: ["1"], requestCorrectionAction: ["1", "missing_documents", "Note"],
    sendReminderAction: ["1", "Reminder"], toggleAddressVerificationAction: ["1", true],
    updateContactVerificationAction: ["1", {}], provisionCorporateEmailAction: ["1", {}],
    resendPortalInviteAction: ["1", {}], checkCpanelEmailAction: ["1"],
  })) await assert.rejects(actions[operation](...args), { message: failure.error.error, code: failure.error.code }, operation);
  await assert.rejects(actions.generateDocumentsAction("1"), /Unable to generate application documents/);
});

test("transport failures show a safe retry message and navigation keeps its Next.js behavior", async () => {
  const { load } = actionLoader(async () => failure);
  const { callAction } = load("lib/api/action-result.ts");
  await assert.rejects(callAction(async () => { throw new Error("Server Components render redacted error"); }), { code: "ACTION_UNAVAILABLE" });
  const redirect = Object.assign(new Error("redirect"), { digest: "NEXT_REDIRECT;replace;/login;307;" });
  await assert.rejects(callAction(async () => { throw redirect; }), error => error === redirect);
  const { runAction } = load("lib/api/run-action.ts");
  await assert.rejects(runAction(async () => { throw redirect; }, "navigation"), error => error === redirect);
  for (const digest of ["DYNAMIC_SERVER_USAGE", "BAILOUT_TO_CLIENT_SIDE_RENDERING", "HANGING_PROMISE_REJECTION", "NEXT_PRERENDER_INTERRUPTED"]) {
    const signal = Object.assign(new Error("rendering signal"), { digest });
    await assert.rejects(callAction(async () => { throw signal; }), error => error === signal);
    await assert.rejects(runAction(async () => { throw signal; }, "rendering"), error => error === signal);
  }
});

test("guide lookup treats only missing records as not found", async () => {
  const missing = actionLoader(async () => ({ success: false, error: { code: "HTTP_404", error: "Guide not found." } }));
  assert.equal(await missing.load("lib/api/it-guides.ts").getITGuide("1"), null);
  const unavailable = actionLoader(async () => failure);
  await assert.rejects(unavailable.load("lib/api/it-guides.ts").getITGuide("1"), { message: failure.error.error });
});

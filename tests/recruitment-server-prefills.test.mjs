import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const named = names => Object.fromEntries(names.split(" ").map(name => [name, name]));
const nodes = (tree, type) => Array.isArray(tree) ? tree.flatMap(item => nodes(item, type)) : !tree || typeof tree !== "object" ? [] : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
const definition = { oral_questions: [], written_questions: [], computer_criteria: [], practical_modules: [], statuses: {} };
const context = {
  candidate: { id: "ada", name: "Ada", pipeline_stage: "call_screening", pipeline_outcome: "active", pipeline_revision: 7, ai_score: 80 },
  role: { id: "role", title: "Developer", pipeline_config: definition }, definition, final_score: null,
  records: [{ id: "record", stage: "call_screening", state: "completed", definition, payload: { compatibility: "Not compatible", notes: "Saved call evidence" }, results: { passed: false, score_100: null, threshold: null, checks: [], missing: [] }, updated_by: { name: "HR" } }], events: [],
};
const review = { revision: 0, ready: false, hr_comments: "Saved final comments", ai: null, ai_stale: false };

function renderPrefilled(file, component, extra = {}) {
  const effects = [], reads = [];
  const Component = actionLoader(undefined, {
    react: {
      useState: value => [value, () => {}], useRef: value => ({ current: value }), useCallback: value => value,
      useEffect: callback => effects.push(callback),
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": named("Loader2 Download"), sonner: { toast: { success() {} } },
    "@/components/ui/button": named("Button"), "@/components/ui/label": named("Label"),
    "@/components/ui/input": named("Input"), "@/components/ui/textarea": named("Textarea"), "@/components/ui/badge": named("Badge"),
    "@/components/ui/dialog": named("Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle"),
    "@/components/ui/sheet": named("Sheet SheetContent SheetDescription SheetHeader SheetTitle"),
    "@/components/ui/select": named("Select SelectContent SelectItem SelectTrigger SelectValue"),
    "../../components/pipeline-disclosure": named("PipelineDisclosure"),
    "./applicant-stage-form": named("ApplicantStageForm"),
    "@/lib/api/recruitment-pipeline": { getRecruitmentPipeline() { reads.push("pipeline"); throw Error("Unexpected initial fetch"); } },
    "@/lib/api/recruitment-final-review": { getRecruitmentFinalReview() { reads.push("review"); throw Error("Unexpected initial fetch"); } },
  }).load(`app/(admin)/hr/recruitment/[id]/components/${file}.tsx`)[component];
  const tree = Component({ candidate: context.candidate, roleId: "role", initialContext: context, initialReview: review, onUpdate() {}, onComplete() {}, onCv() {}, onClose() {}, ...extra });
  effects.forEach(effect => effect());
  assert.deepEqual(reads, []);
  return tree;
}

test("advancement and status forms render immediately from server data without an opening request", () => {
  const advance = renderPrefilled("applicant-advance-dialog", "ApplicantAdvanceDialog");
  assert.equal(nodes(advance, "Textarea")[0].props.required, true);
  const status = renderPrefilled("applicant-status-dialog", "ApplicantStatusDialog", { initialAction: "reject" });
  assert.equal(nodes(status, "Select")[0].props.value, "reject");
  assert.equal(nodes(status, "Textarea")[0].props.id, "status-reason");
});

test("assessment, overview and document dialogs receive usable context on their first render", () => {
  const workspace = renderPrefilled("applicant-stage-workspace", "ApplicantStageWorkspace");
  assert.equal(nodes(workspace, "ApplicantStageForm")[0].props.initial.records[0].payload.notes, "Saved call evidence");
  const overview = renderPrefilled("candidate-overview-sheet", "CandidateOverviewSheet");
  assert.ok(nodes(overview, "section").some(node => node.props["aria-label"] === "Stage scores and results"));
  const documents = renderPrefilled("stage-documents-dialog", "StageDocumentsDialog");
  assert.equal(nodes(documents, "Textarea")[0].props.value, "Saved final comments");
  assert.equal(nodes(documents, "Button").find(node => node.props["aria-label"] === "Download Call screening saved report").props.disabled, false);
});

test("server prefill expansion shares the role definition and retains historical overrides", () => {
  const expand = actionLoader().load("lib/recruitment/pipeline-prefills.ts").recruitmentPipelinePrefills;
  const override = { ...definition, version: "historical" };
  const data = { role: context.role, candidates: [context.candidate], pipeline_prefills: { ada: { records: [{ ...context.records[0], definition: null }, { ...context.records[0], stage: "oral_interview", definition: override }], events: [], final_score: 0, final_review: review } } };
  const result = expand(data).ada;
  assert.equal(result.definition, definition);
  assert.equal(result.records[1].definition, override);
  assert.equal(result.final_score, 0);
  assert.equal(expand({ role: context.role, candidates: [context.candidate] }).ada, undefined);
});

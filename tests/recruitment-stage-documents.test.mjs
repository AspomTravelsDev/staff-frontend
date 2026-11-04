import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const filename = path.resolve('lib/recruitment/stage-document.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(filename);
loaded._compile(compiled.outputText, filename);
const { buildStageDocument, buildFinalRubric, hasStageReport } = loaded.exports;
export const definition = {
  oral_questions: [{ id: 'oral-1', text: 'Describe a difficult customer conversation.', anchors: { 1: 'Weak evidence', 5: 'Clear evidence' }, follow_ups: ['What was the outcome?'] }],
  written_questions: [{ id: 'written-1', text: 'Explain your checks before processing a booking.', guide: 'PRIVATE MARKING GUIDE' }],
  computer_criteria: [{ id: 'computer-1', label: 'Spreadsheet accuracy', guide: 'PRIVATE COMPUTER GUIDE' }],
};
export const context = {
  candidate: { id: 'candidate-123', name: 'Sample Applicant', ai_score: 75, ai_summary: 'Relevant experience', pipeline_revision: 3, cv_original_name: 'resume.pdf' },
  role: { title: 'Travel Consultant' }, definition, final_score: 72, events: [],
  records: [{ stage: 'written_exam', state: 'draft', definition, payload: { grades: { 'written-1': 0 }, notes: 'PRIVATE NOTES', advancement_note: 'PRIVATE EXCEPTION' }, results: { score_100: null, threshold: 60, passed: null, checks: [] }, updated_by: { name: 'HR Officer' }, updated_at: '2026-10-30' }],
};
const content = document => JSON.stringify(document);

test('candidate exam contains questions but excludes all internal evidence and guides', () => {
  const paper = content(buildStageDocument(context, 'written_exam', 'candidate'));
  assert.match(paper, /Explain your checks/);
  for (const hidden of ['PRIVATE', 'Score /', 'HR Officer', 'Pass mark', 'Decision history']) assert.ok(!paper.includes(hidden), hidden);
});
test('HR marking guide includes guidance and blank marks without saved private notes', () => {
  const guide = content(buildStageDocument(context, 'written_exam', 'worksheet'));
  assert.match(guide, /PRIVATE MARKING GUIDE/);
  assert.match(guide, /PRIVATE COMPUTER GUIDE/);
  assert.ok(!guide.includes('PRIVATE NOTES'));
});
test('saved report keeps zero marks and labels incomplete assessment', () => {
  const report = buildStageDocument(context, 'written_exam', 'report');
  assert.match(report.status, /draft/);
  assert.match(content(report), /Score \/ 5: 0/);
  assert.match(content(report), /Incomplete \/ not assessed/);
  assert.match(content(report), /PRIVATE NOTES/);
});
test('practical worksheet has score out of ten and no preset questions', () => {
  const practical = content(buildStageDocument(context, 'practical', 'worksheet'));
  assert.match(practical, /Practical score \/ 10/);
  assert.ok(!practical.includes('Describe a difficult'));
  assert.ok(!practical.includes('Explain your checks'));
});
test('all seven stages support blank sheets and saved reports before assessment starts', () => {
  for (const stage of ['cv_screening', 'call_screening', 'oral_interview', 'written_exam', 'practical', 'management_review', 'offer_preparation']) {
    for (const mode of ['worksheet', 'report']) assert.ok(buildStageDocument({ ...context, records: [] }, stage, mode).sections.length > 0);
  }
});
test('oral rubric includes scoring anchors and follow-ups', () => {
  const oral = content(buildStageDocument(context, 'oral_interview', 'worksheet'));
  assert.match(oral, /5\/5: Clear evidence/);
  assert.match(oral, /What was the outcome/);
});

test('saved document availability distinguishes absent records and preserves zero scores', () => {
  assert.equal(hasStageReport(context, 'written_exam'), true);
  assert.equal(hasStageReport(context, 'practical'), false);
  assert.equal(hasStageReport({ ...context, candidate: { ...context.candidate, ai_score: 0, ai_summary: null } }, 'cv_screening'), true);
});

test('final rubric separates AI findings and HR comments and labels stale evidence', () => {
  const review = { ready: false, ai_stale: true, hr_comments: 'Independent HR observation', hr_updated_by: { name: 'HR Officer' }, hr_updated_at: '2026-11-01', ai: { generated_at: '2026-11-01', generated_by: { name: 'HR Officer' }, strengths: ['Written: careful checks'], weaknesses: ['Oral: limited evidence'], comments: 'AI summary only', missing_evidence: ['Practical not assessed'] } };
  const report = buildFinalRubric(context, 'report', review);
  assert.match(report.status, /in progress/);
  for (const text of ['Independent HR observation', 'AI summary only', 'OUTDATED', 'Practical not assessed', 'Written: careful checks']) assert.match(content(report), new RegExp(text));
  const blank = content(buildFinalRubric(context, 'worksheet', review));
  for (const text of ['Independent HR observation', 'AI summary only', 'PRIVATE NOTES', 'Written: careful checks']) assert.ok(!blank.includes(text));
});

test('final rubric uses recorded competency marks without inventing a total or missing grades', () => {
  const candidate = { ...context.candidate, interview_rubric: { scores: { teamwork: 0, communication: 4 }, reviewer_info: {}, qualitative: {} } };
  const report = content(buildFinalRubric({ ...context, candidate }, 'report'));
  assert.match(report, /Teamwork \/ 5: 0/);
  assert.match(report, /Technical skills \/ 5: Not recorded/);
  assert.match(report, /Recorded total \/ 55: Not recorded/);
});

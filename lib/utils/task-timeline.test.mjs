import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';
import ts from 'typescript';

const filename = fileURLToPath(new URL('./task-timeline.ts', import.meta.url));
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const timelineModule = new Module(filename);
timelineModule.paths = Module._nodeModulePaths(path.dirname(filename));
timelineModule._compile(compiled.outputText, filename);
const { computeTaskTimeline, computeTaskDeadlineTimeline } = timelineModule.exports;
const start = '2026-10-01T12:00:00Z';
const due = '2026-10-11T12:00:00Z';
const now = Date.parse('2026-10-06T12:00:00Z');
const task = (overrides = {}) => ({ created_at: start, due_date: due, status: 'in_progress', is_delegated: true, ...overrides });

test('elapsed time uses the assignment-to-deadline window and handles its boundaries', () => {
  const halfway = computeTaskTimeline(start, due, now);
  assert.equal(halfway.percent, 50);
  assert.equal(halfway.remainingText, '5d left');
  assert.equal(computeTaskTimeline(start, due, Date.parse(start)).percent, 0);
  assert.equal(computeTaskTimeline(start, due, Date.parse(start) - 60_000).percent, 0);
  const overdue = computeTaskTimeline(start, due, Date.parse(due) + 86_400_000);
  assert.equal(overdue.percent, 100);
  assert.equal(overdue.colorScheme, 'rose');
  assert.match(overdue.remainingText, /Overdue by 1 day/);
});

test('an approved extension changes the time window; invalid dates never produce a broken bar', () => {
  assert.equal(computeTaskDeadlineTimeline(task({ due_date: '2026-10-21T12:00:00Z' }), now).percent, 25);
  assert.equal(computeTaskDeadlineTimeline(task({ due_date: null }), now), null);
  assert.equal(computeTaskDeadlineTimeline(task({ due_date: 'invalid' }), now), null);
  assert.equal(computeTaskDeadlineTimeline(task({ created_at: 'invalid' }), now), null);
  assert.equal(computeTaskDeadlineTimeline(task({ status: 'cancelled' }), now), null);
});

test('submission freezes at its deadline snapshot and review delays do not make it overdue', () => {
  const accepted = computeTaskDeadlineTimeline(task({ status: 'completed', submitted_at: '2026-10-06T12:00:00Z', submission_due_date: due, due_date: '2026-10-21T12:00:00Z' }), Date.parse('2026-11-01T12:00:00Z'));
  assert.equal(accepted.percent, 50);
  assert.equal(accepted.remainingText, 'Submitted on time');
  assert.equal(accepted.isOverdue, false);
  assert.equal(accepted.colorScheme, 'emerald');
  const exact = computeTaskDeadlineTimeline(task({ status: 'submitted', submitted_at: due, submission_due_date: due }), now);
  assert.equal(exact.remainingText, 'Submitted on time');
  const late = computeTaskDeadlineTimeline(task({ status: 'submitted', submitted_at: '2026-10-12T12:00:00Z', submission_due_date: due }), now);
  assert.equal(late.percent, 100);
  assert.equal(late.remainingText, 'Submitted late');
});

test('personal completion freezes its clock; requested changes resume the live clock', () => {
  const completed = computeTaskDeadlineTimeline(task({ is_delegated: false, status: 'completed', completed_at: '2026-10-06T12:00:00Z' }), Date.parse('2026-11-01T12:00:00Z'));
  assert.equal(completed.percent, 50);
  assert.equal(completed.remainingText, 'Completed on time');
  const revised = computeTaskDeadlineTimeline(task({ status: 'changes_requested', submitted_at: '2026-10-03T12:00:00Z' }), now);
  assert.equal(revised.percent, 50);
  assert.equal(revised.remainingText, '5d left');
  assert.equal(computeTaskDeadlineTimeline(task({ status: 'completed' }), now), null);
});

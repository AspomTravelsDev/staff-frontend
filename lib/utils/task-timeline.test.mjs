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

test('urgency uses remaining time on the same scale regardless of assignment age', () => {
  const fiveDays = computeTaskTimeline(start, due, now);
  assert.equal(fiveDays.remainingText, '5d left');
  assert.equal(fiveDays.colorScheme, 'emerald');
  const newlyAssigned = computeTaskTimeline('2026-10-06T11:59:00Z', due, now);
  assert.equal(newlyAssigned.urgencyPercent, fiveDays.urgencyPercent);
  assert.equal(newlyAssigned.colorScheme, fiveDays.colorScheme);
  assert.equal(computeTaskTimeline('invalid', due, now).urgencyPercent, fiveDays.urgencyPercent);
  const overdue = computeTaskTimeline(start, due, Date.parse(due) + 86_400_000);
  assert.equal(overdue.urgencyPercent, 100);
  assert.equal(overdue.colorScheme, 'rose');
  assert.match(overdue.remainingText, /Overdue by 1 day/);
});

test('an approved extension reduces urgency; invalid or missing deadlines never produce a broken bar', () => {
  const original = computeTaskDeadlineTimeline(task(), now);
  const extended = computeTaskDeadlineTimeline(task({ due_date: '2026-10-21T12:00:00Z' }), now);
  assert.ok(extended.urgencyPercent < original.urgencyPercent);
  assert.equal(extended.remainingText, '15d left');
  assert.equal(extended.colorScheme, 'slate');
  assert.equal(computeTaskDeadlineTimeline(task({ due_date: null }), now), null);
  assert.equal(computeTaskDeadlineTimeline(task({ due_date: 'invalid' }), now), null);
  assert.equal(computeTaskDeadlineTimeline(task({ status: 'cancelled' }), now), null);
});

test('urgency increases with proximity and uses actual 24-hour and three-day thresholds', () => {
  const at = hours => computeTaskTimeline(start, due, Date.parse(due) - hours * 3_600_000);
  const far = at(24 * 10);
  const week = at(24 * 7);
  const fiveDays = at(24 * 5);
  const threeDays = at(24 * 3);
  const oneDay = at(24);
  const eightHours = at(8);
  assert.equal(far.colorScheme, 'slate');
  assert.equal(week.colorScheme, 'emerald');
  assert.equal(fiveDays.colorScheme, 'emerald');
  assert.equal(threeDays.colorScheme, 'amber');
  assert.equal(oneDay.colorScheme, 'amber');
  assert.equal(eightHours.colorScheme, 'rose');
  assert.ok(eightHours.urgencyPercent > 90 && eightHours.urgencyPercent < 100);
  const fills = [far, week, fiveDays, threeDays, oneDay, eightHours].map(value => value.urgencyPercent);
  assert.deepEqual(fills, [...fills].sort((a, b) => a - b));
  const dueNow = at(0);
  assert.equal(dueNow.urgencyPercent, 100);
  assert.equal(dueNow.remainingText, 'Due now');
  assert.equal(dueNow.isOverdue, false);
  assert.equal(at(1 / 120).remainingText, 'Less than 1m left');
});

test('submission freezes at its deadline snapshot and review delays do not make it overdue', () => {
  const accepted = computeTaskDeadlineTimeline(task({ status: 'completed', submitted_at: '2026-10-06T12:00:00Z', submission_due_date: due, due_date: '2026-10-21T12:00:00Z' }), Date.parse('2026-11-01T12:00:00Z'));
  assert.equal(accepted.remainingText, 'Submitted on time');
  assert.equal(accepted.isOverdue, false);
  assert.equal(accepted.colorScheme, 'emerald');
  const exact = computeTaskDeadlineTimeline(task({ status: 'submitted', submitted_at: due, submission_due_date: due }), now);
  assert.equal(exact.remainingText, 'Submitted on time');
  const late = computeTaskDeadlineTimeline(task({ status: 'submitted', submitted_at: '2026-10-12T12:00:00Z', submission_due_date: due }), now);
  assert.equal(late.urgencyPercent, 100);
  assert.equal(late.remainingText, 'Submitted late');
});

test('personal completion freezes its clock; requested changes resume the live clock', () => {
  const completed = computeTaskDeadlineTimeline(task({ is_delegated: false, status: 'completed', completed_at: '2026-10-06T12:00:00Z' }), Date.parse('2026-11-01T12:00:00Z'));
  assert.equal(completed.remainingText, 'Completed on time');
  const revised = computeTaskDeadlineTimeline(task({ status: 'changes_requested', submitted_at: '2026-10-03T12:00:00Z' }), now);
  assert.equal(revised.urgencyPercent, computeTaskTimeline(start, due, now).urgencyPercent);
  assert.equal(revised.remainingText, '5d left');
  assert.equal(computeTaskDeadlineTimeline(task({ status: 'completed' }), now), null);
});

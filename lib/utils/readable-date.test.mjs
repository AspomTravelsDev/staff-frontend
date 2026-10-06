import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';
import ts from 'typescript';

const filename = fileURLToPath(new URL('./readable-date.ts', import.meta.url));
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const dateModule = new Module(filename);
dateModule._compile(compiled.outputText, filename);
const { formatReadableDate } = dateModule.exports;
const now = new Date('2026-10-06T12:00:00Z');
const label = (value, includeTime = false) => formatReadableDate(value, { now, includeTime });

test('calendar labels retain the exact date and Lagos time', () => {
  assert.equal(label('2026-10-05T12:00:00Z'), 'Yesterday (Oct 5, 2026)');
  assert.equal(label('2026-10-06T12:00:00Z'), 'Today (Oct 6, 2026)');
  assert.equal(label('2026-10-07T12:00:00Z'), 'Tomorrow (Oct 7, 2026)');
  assert.equal(label('2026-10-05T12:00:00Z', true), 'Yesterday (Oct 5, 2026 at 1:00 PM)');
});
test('relative dates use days, weeks, calendar months and years in both directions', () => {
  assert.equal(label('2026-10-03T12:00:00Z'), '3 days ago (Oct 3, 2026)');
  assert.equal(label('2026-09-22T12:00:00Z'), '2 weeks ago (Sep 22, 2026)');
  assert.equal(label('2026-08-06T12:00:00Z'), '2 months ago (Aug 6, 2026)');
  assert.equal(label('2026-12-06T12:00:00Z'), 'In 2 months (Dec 6, 2026)');
  assert.equal(label('2024-10-06T12:00:00Z'), '2 years ago (Oct 6, 2024)');
});
test('midnight uses the Lagos calendar, independently of the computer timezone', () => {
  const midnight = new Date('2026-10-05T23:30:00Z');
  assert.equal(formatReadableDate('2026-10-05T22:00:00Z', { now: midnight, includeTime: false }), 'Yesterday (Oct 5, 2026)');
  assert.equal(formatReadableDate('2026-10-05T23:15:00Z', { now: midnight, includeTime: false }), 'Today (Oct 6, 2026)');
});
test('missing and malformed dates are readable', () => {
  assert.equal(label(null), 'No date');
  assert.equal(label('not a date'), 'Date unavailable');
});

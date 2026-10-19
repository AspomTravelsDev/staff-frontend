import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const { filterApplications, paginateApplications } = actionLoader(() => {}).load('lib/utils/application-list.ts');
const defaults = { search: '', status: 'all', position: 'all', sort: 'newest' };
const rows = [
  { id: 'a', application_id: 'ASP-001', applicant_name: 'Zara', applicant_email: 'zara@example.test', position_title: 'Accounts Officer', status: 'completed', invited_at: '2026-10-10' },
  { id: 'b', application_id: 'ASP-002', applicant_name: 'Ada', applicant_email: 'ada@example.test', position_title: 'IT Officer', status: 'invited', invited_at: '2026-10-15' },
  { id: 'c', application_id: 'ASP-003', applicant_name: null, applicant_email: 'bala@example.test', position_title: 'Accounts Officer', status: 'in_progress', invited_at: '2026-10-15' },
];
test('search combines with status and position and includes reference/email', () => {
  assert.deepEqual(filterApplications(rows, { ...defaults, search: ' ACCOUNTS ', position: 'Accounts Officer', status: 'completed' }).map(row => row.id), ['a']);
  assert.deepEqual(filterApplications(rows, { ...defaults, search: 'asp-003' }).map(row => row.id), ['c']);
  assert.deepEqual(filterApplications(rows, { ...defaults, search: 'ADA@EXAMPLE' }).map(row => row.id), ['b']);
  assert.equal(filterApplications(rows, { ...defaults, position: 'Accounts Officer', status: 'invited' }).length, 0);
});
test('sorting is stable, handles missing names and leaves the server data intact', () => {
  assert.deepEqual(filterApplications(rows, defaults).map(row => row.id), ['b', 'c', 'a']);
  assert.deepEqual(filterApplications(rows, { ...defaults, sort: 'oldest' }).map(row => row.id), ['a', 'b', 'c']);
  assert.deepEqual(filterApplications(rows, { ...defaults, sort: 'name_asc' }).map(row => row.id), ['b', 'c', 'a']);
  assert.deepEqual(filterApplications(rows, { ...defaults, sort: 'name_desc' }).map(row => row.id), ['a', 'c', 'b']);
  assert.deepEqual(filterApplications(rows, { ...defaults, sort: 'position' }).map(row => row.id), ['c', 'a', 'b']);
  assert.deepEqual(rows.map(row => row.id), ['a', 'b', 'c']);
});
test('pagination clamps after filtering/deletion, reports ranges and preserves all export results', () => {
  const matching = filterApplications(rows, defaults);
  assert.equal(matching.length, 3);
  const page = paginateApplications(matching, 2, 2);
  assert.deepEqual(page.rows.map(row => row.id), ['a']);
  assert.deepEqual([page.from, page.to, page.page, page.totalPages], [3, 3, 2, 2]);
  const clamped = paginateApplications([rows[0]], 99, 10);
  assert.deepEqual([clamped.page, clamped.totalPages, clamped.from, clamped.to], [1, 1, 1, 1]);
  const empty = paginateApplications([], 3, 10);
  assert.deepEqual([empty.page, empty.totalPages, empty.from, empty.to], [1, 1, 0, 0]);
  assert.equal(matching.length, 3, 'Export keeps all matching applications across pages');
});

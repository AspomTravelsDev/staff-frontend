import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const { filterLeaveRequests, paginateLeaveRequests } = actionLoader(() => {}).load('lib/utils/leave-list.ts');
const defaults = { search: '', status: 'all', department: 'all', type: 'all', sort: 'pending' };
const rows = [
  { id: 'a', employeeName: 'Zara', department: 'Accounts', type: 'Annual', status: 'Approved', startDate: '2026-11-10', days: 10 },
  { id: 'b', employeeName: 'Ada', department: 'IT', type: 'Sick', status: 'Pending', startDate: '2026-10-12', days: 2 },
  { id: 'c', employeeName: 'Bala', department: 'Accounts', type: 'Annual', status: 'Pending', startDate: '2026-10-15', days: 4 },
];
test('leave filters combine search, status, department and type without losing other pages', () => {
  assert.deepEqual(filterLeaveRequests(rows, { ...defaults, search: ' ACCOUNTS ', status: 'Pending', department: 'Accounts', type: 'Annual' }).map(r => r.id), ['c']);
  assert.equal(filterLeaveRequests(rows, { ...defaults, type: 'Sick', department: 'Accounts' }).length, 0);
  const many = Array.from({ length: 125 }, (_, i) => ({ ...rows[0], id: String(i), employeeName: `Employee ${i}` }));
  assert.equal(filterLeaveRequests(many, defaults).length, 125);
  assert.equal(filterLeaveRequests(many, { ...defaults, search: 'Employee 124' })[0].id, '124');
});
test('pending priority and explicit sorts are stable and preserve input', () => {
  for (const [sort, expected] of [['pending', ['c','b','a']], ['start_desc',['a','c','b']], ['start_asc',['b','c','a']], ['name',['b','c','a']], ['days',['a','c','b']]]) {
    assert.deepEqual(filterLeaveRequests(rows, { ...defaults, sort }).map(r => r.id), expected);
  }
  assert.deepEqual(rows.map(r => r.id), ['a','b','c']);
});
test('pagination clamps when an approval changes a filtered page and handles empty results', () => {
  const result = paginateLeaveRequests(rows, 2, 2);
  assert.deepEqual([result.from, result.to, result.page, result.totalPages], [3,3,2,2]);
  const pending = filterLeaveRequests(rows.map(r => ({ ...r, status: r.id === 'c' ? 'Approved' : r.status })), { ...defaults, status: 'Pending' });
  const clamped = paginateLeaveRequests(pending, 2, 2);
  assert.deepEqual([clamped.from, clamped.to, clamped.page, clamped.totalPages], [1,1,1,1]);
  const empty = paginateLeaveRequests([], 3, 10);
  assert.deepEqual([empty.from, empty.to, empty.page, empty.totalPages], [0,0,1,1]);
});
test('management loader returns all requests and exposes failures instead of a false empty list', async () => {
  const many = Array.from({ length: 125 }, (_, i) => ({ ...rows[0], id: String(i) }));
  const { getLeaveManagementRequests } = actionLoader(async (_method, url) => {
    assert.equal(url, '/api/hr/leave');
    return { success: true, data: { data: many } };
  }).load('lib/api/leave.ts');
  assert.equal((await getLeaveManagementRequests()).length, 125);
  const failed = actionLoader(async () => ({ success: false, error: { error: 'Unavailable' } })).load('lib/api/leave.ts');
  await assert.rejects(failed.getLeaveManagementRequests(), /Unavailable/);
});

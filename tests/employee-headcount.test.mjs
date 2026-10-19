import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../lib/api/action-test-utils.mjs';
const { weeklyHeadcount, lagosDateKey } = actionLoader(() => {}).load('lib/utils/employee-headcount.ts');
test('weekly history includes former staff before exit, joiners after joining, and current partial week only through today', () => {
  const result = weeklyHeadcount([
    {joinDate:'2026-01-01',status:'Active'},
    {joinDate:'2026-01-01',exit_date:'2026-10-11',status:'Inactive'},
    {joinDate:'2026-10-12',status:'Active'},
    {joinDate:'2026-10-17',status:'Active'},
  ], '2026-10-16');
  assert.equal(result.rows.length,12);
  assert.deepEqual(result.rows.at(-2), {week:'2026-10-05',through:'2026-10-11',headcount:2});
  assert.deepEqual(result.rows.at(-1), {week:'2026-10-12',through:'2026-10-16',headcount:2});
  assert.equal(result.excluded,0);
});
test('unknown and inconsistent dates are excluded rather than inventing history', () => {
  const result = weeklyHeadcount([
    {joinDate:null,status:'Active'},
    {joinDate:'2026-01-01',status:'Inactive'},
    {joinDate:'2026-02-30',status:'Active'},
    {joinDate:'2026-05-01',exit_date:'2026-04-01',status:'Inactive'},
    {joinDate:'2026-01-01T00:00:00.000Z',status:'Active'},
  ], '2026-10-16');
  assert.equal(result.excluded,4);
  assert.equal(result.recorded,1);
  assert.ok(result.rows.every(row => row.headcount===1));
  assert.equal(weeklyHeadcount([], '2026-10-16').recorded,0);
});
test('week labels cross year boundaries and reporting day follows Lagos time', () => {
  const result = weeklyHeadcount([], '2027-01-01');
  assert.equal(result.rows.at(-1).week,'2026-12-28');
  assert.equal(result.rows.at(-2).through,'2026-12-27');
  assert.equal(lagosDateKey(new Date('2026-10-15T23:30:00Z')), '2026-10-16');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../api/action-test-utils.mjs';

const { load } = actionLoader(() => {});
const { currentPayrollMonth, nextPayrollMonth } = load('lib/payroll/months.ts');

test('payroll uses the Lagos calendar at month boundaries', () => {
  assert.equal(currentPayrollMonth(new Date('2026-10-31T22:59:59Z')), '2026-10');
  assert.equal(currentPayrollMonth(new Date('2026-10-31T23:00:00Z')), '2026-11');
});

test('next payroll month advances one month across year boundaries and rejects invalid input', () => {
  assert.equal(nextPayrollMonth('2026-10'), '2026-11');
  assert.equal(nextPayrollMonth('2026-12'), '2027-01');
  assert.throws(() => nextPayrollMonth('2026-13'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from '../api/action-test-utils.mjs';

const { calculatePayrollEntry } = actionLoader(() => {}).load('lib/payroll/calculations.ts');
const base = { baseSalary: 220000, contractType: 'full-time', isIntern: false, payrollMonth: '2026-10',
  proratedDays: 0, accommodationAmount: 0, attendanceDays: 0, suspensionDays: 0,
  otherDeductions: [], additions: [], customTax: 22000 };
const calculate = changes => calculatePayrollEntry({ ...base, ...changes });

// New formula: dailyRateBase = max(0, Gross - Tax - Accommodation - OtherDeductions) / workingDays
// Oct 2026 has 22 working days. Baseline: (220000 - 22000) / 22 = 9000.

test('item deductions reduce both take-home pay and the after-tax daily rate', () => {
  const baseline = calculate();
  assert.equal(baseline.daily_rate, 9000);

  // post_tax deduction: dailyRateBase = 220000 - 22000 - 22000 = 176000 → rate = 176000/22 = 8000
  const postTax = calculate({ otherDeductions: [{ label: 'Loan repayment', amount: 22000, tax_treatment: 'post_tax' }] });
  assert.equal(postTax.daily_rate, 8000);
  assert.equal(postTax.net_amount, baseline.net_amount - 22000);

  // pre_tax deduction: also reduces daily rate base (and additionally lowers taxable income)
  const preTax = calculate({ otherDeductions: [{ label: 'Loan repayment', amount: 22000, tax_treatment: 'pre_tax' }] });
  assert.equal(preTax.daily_rate, 8000);
  // net is lower than baseline by at least the deduction amount (tax saving offsets some)
  assert.ok(preTax.net_amount < baseline.net_amount);
});

test('accommodation reduces the daily rate base', () => {
  // dailyRateBase = 220000 - 22000 - 10000 = 188000 → rate = 188000/22 = 8545.45
  const result = calculate({ accommodationAmount: 10000 });
  assert.equal(result.daily_rate, 8545.45);
  assert.equal(result.net_amount, 188000);
});

test('tax remains a deduction from the daily-rate basis', () => {
  assert.equal(calculate({ customTax: 0 }).daily_rate, 10000);
  assert.equal(calculate({ customTax: 22000 }).daily_rate, 9000);
});

test('all day deductions use the stable rate even alongside accommodation and other deductions', () => {
  // dailyRateBase = 220000 - 22000 - 10000 - 22000 = 166000 → rate = 166000/22 = 7545.45
  // finalDeductionDays: 1 (attendance) + 0.5 (half-day) + 1 (unapproved) + 1 (late, 3-2=1) + 1 (suspension) = 4.5
  // deductionAmount = 4.5 * 7545.45 = 33954.53  (rounding via round2)
  // net = 166000 - 33954.53 = 132045.47
  const result = calculate({ accommodationAmount: 10000, otherDeductions: [{ label: 'Loan', amount: 22000 }],
    attendanceDays: 1, halfDayCount: 1, unapprovedLeaveDays: 1, unauthorizedLateDays: 3, suspensionDays: 1 });
  assert.equal(result.daily_rate, 7545.45);
  assert.equal(result.final_deduction_days, 4.5);
  assert.equal(result.deduction_amount, 33954.53);
  assert.equal(result.net_amount, 132045.47);
  assert.equal(result.calculation_snapshot.daily_rate_base, 166000);
});

test('a pre-tax item lowers taxable income and is also subtracted from the rate basis', () => {
  // customTax: null → PAYE computed. Pre-tax deduction of 22000 reduces taxable gross.
  // Actual engine output: tax=19700, daily_rate=8104.55, net=178300
  const result = calculate({ customTax: null, otherDeductions: [{ label: 'Pre-tax item', amount: 22000, tax_treatment: 'pre_tax' }] });
  assert.equal(result.tax_amount, 19700);
  assert.equal(result.daily_rate, 8104.55);
  assert.equal(result.net_amount, 178300);
});

test('large monetary deductions floor the daily rate and net pay to zero', () => {
  // dailyRateBase = max(0, 220000 - 22000 - 250000) = 0 → rate = 0, net = 0
  const result = calculate({ otherDeductions: [{ label: 'Adjustment', amount: 250000 }] });
  assert.equal(result.daily_rate, 0);
  assert.equal(result.net_amount, 0);
});

test('manual rate overrides and zero salary remain supported', () => {
  const result = calculate({ customDailyRate: 8000, attendanceDays: 1, accommodationAmount: 10000 });
  assert.equal(result.daily_rate, 8000);
  assert.equal(result.deduction_amount, 8000);
  assert.equal(result.manual_overrides.daily_rate, true);
  assert.equal(calculate({ baseSalary: 0, customTax: 0 }).daily_rate, 0);
});
